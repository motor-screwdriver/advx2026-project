package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

// sleepPlanClient is the subset of MiFitnessClient needed by the sleep plan handler.
type sleepPlanClient interface {
	RestoreSession(mifit.MiFitnessSession) error
	FetchSleep(context.Context, time.Time, time.Time) ([]mifit.SleepSession, error)
}

// sleepPlanClientFactory creates a sleep-capable client for a given region.
type sleepPlanClientFactory func(region string) (sleepPlanClient, error)

// sleepPlanRequest is the wire request for POST /api/sleep-plan.
type sleepPlanRequest struct {
	MiFitSession mifit.MiFitnessSession `json:"mifitSession"`
	Region       string                 `json:"region"`
}

// sleepPlanResponse is the wire response for POST /api/sleep-plan.
type sleepPlanResponse struct {
	Status      string          `json:"status"`
	LumaMessage string          `json:"lumaMessage"`
	Plan        *sleepPlan      `json:"plan,omitempty"`
	Stats       *sleepPlanStats `json:"stats,omitempty"`
}

type sleepPlan struct {
	BedTime     string   `json:"bedTime"`
	WakeTime    string   `json:"wakeTime"`
	RitualSteps []string `json:"ritualSteps"`
	Reason      string   `json:"reason"`
}

type sleepPlanStats struct {
	TotalNights      int    `json:"totalNights"`
	AvgDurationMin   int    `json:"avgDurationMin"`
	AvgBedTime       string `json:"avgBedTime"`
	AvgWakeTime      string `json:"avgWakeTime"`
	AvgDeepPct       int    `json:"avgDeepPct"`
	ConsistencyScore int    `json:"consistencyScore"`
}

// sleepAggregate holds computed stats from a month of sleep sessions.
type sleepAggregate struct {
	TotalNights    int
	AvgDurationMin float64
	AvgBedTimeMin  float64 // minutes from midnight (can be negative for before-midnight)
	AvgWakeTimeMin float64 // minutes from midnight
	AvgDeepPct     float64
	AvgLightPct    float64
	AvgRemPct      float64
	Consistency    int // 0-100 score (100 = perfectly consistent bedtime)

	WeekdayAvgDurationMin float64
	WeekdayAvgBedTimeMin  float64
	WeekendAvgDurationMin float64
	WeekendAvgBedTimeMin  float64

	LastWeekAvgDurationMin float64
	LastWeekAvgBedTimeMin  float64
}

const sleepPlanTimeout = 80 * time.Second

func (s *Server) handleSleepPlan(w http.ResponseWriter, r *http.Request) {
	id := oracleRequestSeq.Add(1)
	start := time.Now()
	client := clientID(r)
	if !s.limiter.allow(client) {
		log.Printf("sleep-plan rate limited: id=%d client=%s", id, client)
		writeJSON(w, http.StatusTooManyRequests, errorResponse{Error: "Too many requests. Try again shortly."})
		return
	}

	payload, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64*1024))
	if err != nil {
		log.Printf("sleep-plan body unreadable: id=%d client=%s err=%v", id, client, err)
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "The oracle is unavailable."})
		return
	}

	var body sleepPlanRequest
	if err := json.Unmarshal(payload, &body); err != nil {
		log.Printf("sleep-plan malformed JSON: id=%d client=%s", id, client)
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Malformed request JSON."})
		return
	}

	region, ok := normalizeMiFitnessRegion(body.Region)
	if !ok {
		log.Printf("sleep-plan bad region: id=%d client=%s raw=%q", id, client, body.Region)
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Unsupported Mi Fitness region."})
		return
	}
	if body.MiFitSession.Security == "" || body.MiFitSession.Cookies == "" {
		log.Printf("sleep-plan missing session: id=%d client=%s", id, client)
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Mi Fitness session is required."})
		return
	}

	log.Printf("sleep-plan request: id=%d client=%s region=%s", id, client, region)

	ctx, cancel := context.WithTimeout(withRequestID(r.Context(), id), sleepPlanTimeout)
	defer cancel()

	// Create MiFitness client and restore session.
	mifitClient, err := s.sleepPlanClientFactory(region)
	if err != nil {
		log.Printf("sleep-plan client create error: id=%d err=%v", id, err)
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "The oracle is unavailable."})
		return
	}
	if err := mifitClient.RestoreSession(body.MiFitSession); err != nil {
		log.Printf("sleep-plan session restore error: id=%d err=%v", id, err)
		writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "Mi Fitness session expired. Please reconnect your Xiaomi account."})
		return
	}

	// Fetch 30 days of sleep data.
	now := time.Now()
	from := now.AddDate(0, 0, -30)
	sessions, err := mifitClient.FetchSleep(ctx, from, now)
	if err != nil {
		log.Printf("sleep-plan fetch error: id=%d err=%v", id, err)
		kind := mifit.KindOf(err)
		if kind == mifit.KindAuth {
			writeJSON(w, http.StatusUnauthorized, errorResponse{Error: "Mi Fitness session expired. Please reconnect your Xiaomi account."})
		} else {
			writeJSON(w, http.StatusBadGateway, errorResponse{Error: "Could not retrieve sleep data from Xiaomi."})
		}
		return
	}

	// Filter out naps, keep only main sleep sessions.
	mainSessions := filterMainSleep(sessions)
	if len(mainSessions) == 0 {
		log.Printf("sleep-plan no data: id=%d sessions_total=%d", id, len(sessions))
		writeJSON(w, http.StatusOK, sleepPlanResponse{
			Status:      "no_data",
			LumaMessage: "The crystal shows no nights recorded yet, traveler. Wear your band to sleep for a few nights, and the stars will have something to read.",
		})
		return
	}

	// Aggregate stats.
	agg := aggregateSleepMonth(mainSessions)
	log.Printf("sleep-plan aggregated: id=%d nights=%d avgDur=%.0f avgBed=%.0f consistency=%d",
		id, agg.TotalNights, agg.AvgDurationMin, agg.AvgBedTimeMin, agg.Consistency)

	// Build LLM prompt with aggregate data.
	statsJSON := buildStatsPrompt(agg)
	messages := []ChatMessage{
		{Role: "user", Content: fmt.Sprintf("Here are my sleep statistics from the past 30 days:\n\n%s\n\nPlease analyze and provide my sleep plan.", statsJSON)},
	}

	provider, err := s.providerFactory()
	if err != nil {
		log.Printf("sleep-plan provider error: id=%d err=%v", id, err)
		writeJSON(w, http.StatusServiceUnavailable, errorResponse{Error: "The oracle is unavailable."})
		return
	}

	raw, err := provider.Complete(ctx, StructuredCompletionInput{
		System:     SleepPlanSystemPrompt,
		Messages:   messages,
		SchemaName: "sleep_plan",
		Schema:     SleepPlanSchema,
	})
	if err != nil {
		log.Printf("sleep-plan LLM error: id=%d latency=%s err=%v", id, time.Since(start).Round(time.Millisecond), err)
		writeJSON(w, http.StatusServiceUnavailable, errorResponse{Error: "The oracle is unavailable."})
		return
	}

	response, err := parseSleepPlanResponse(raw, agg)
	if err != nil {
		log.Printf("sleep-plan parse error: id=%d err=%v", id, err)
		writeJSON(w, http.StatusServiceUnavailable, errorResponse{Error: "The oracle is unavailable."})
		return
	}

	log.Printf("sleep-plan ok: id=%d client=%s latency=%s nights=%d",
		id, client, time.Since(start).Round(time.Millisecond), agg.TotalNights)
	writeJSON(w, http.StatusOK, response)
}

// sleepPlanClientFactory returns the default factory that creates real MiFitness clients
// with FetchSleep capability.
func (s *Server) sleepPlanClientFactory(region string) (sleepPlanClient, error) {
	if s.sleepPlanFactory != nil {
		return s.sleepPlanFactory(region)
	}
	c, err := mifit.NewMiFitness(mifit.MiFitnessConfig{
		Region:     region,
		HTTPClient: newMiFitnessHTTPClient(),
	})
	if err != nil {
		return nil, err
	}
	return c, nil
}

// filterMainSleep removes naps from the session list.
func filterMainSleep(sessions []mifit.SleepSession) []mifit.SleepSession {
	var main []mifit.SleepSession
	for _, s := range sessions {
		if !s.IsNap {
			main = append(main, s)
		}
	}
	return main
}

// aggregateSleepMonth computes aggregated statistics from sleep sessions.
func aggregateSleepMonth(sessions []mifit.SleepSession) sleepAggregate {
	n := len(sessions)
	if n == 0 {
		return sleepAggregate{}
	}

	var totalDur float64
	var bedTimes []float64
	var wakeTimes []float64
	var deepMins, lightMins, remMins, totalStageMins float64

	var weekdayDurs, weekdayBeds []float64
	var weekendDurs, weekendBeds []float64
	var lastWeekDurs, lastWeekBeds []float64

	now := time.Now()
	weekAgo := now.AddDate(0, 0, -7)

	for _, s := range sessions {
		dur := float64(s.DurationMinutes)
		totalDur += dur

		// Bed time: minutes from midnight (negative = before midnight).
		bedMin := bedTimeMinutes(s.Start)
		bedTimes = append(bedTimes, bedMin)

		// Wake time: minutes from midnight.
		wakeMin := float64(s.End.Hour()*60 + s.End.Minute())
		wakeTimes = append(wakeTimes, wakeMin)

		// Stage analysis.
		for _, stage := range s.Stages {
			totalStageMins += float64(stage.Minutes)
			switch strings.ToLower(stage.Name) {
			case "deep":
				deepMins += float64(stage.Minutes)
			case "light":
				lightMins += float64(stage.Minutes)
			case "rem":
				remMins += float64(stage.Minutes)
			}
		}

		// Weekday vs weekend.
		day := s.Start.Weekday()
		if day == time.Saturday || day == time.Sunday {
			weekendDurs = append(weekendDurs, dur)
			weekendBeds = append(weekendBeds, bedMin)
		} else {
			weekdayDurs = append(weekdayDurs, dur)
			weekdayBeds = append(weekdayBeds, bedMin)
		}

		// Last week.
		if s.Start.After(weekAgo) {
			lastWeekDurs = append(lastWeekDurs, dur)
			lastWeekBeds = append(lastWeekBeds, bedMin)
		}
	}

	agg := sleepAggregate{
		TotalNights:    n,
		AvgDurationMin: totalDur / float64(n),
		AvgBedTimeMin:  avgFloat(bedTimes),
		AvgWakeTimeMin: avgFloat(wakeTimes),
	}

	if totalStageMins > 0 {
		agg.AvgDeepPct = (deepMins / totalStageMins) * 100
		agg.AvgLightPct = (lightMins / totalStageMins) * 100
		agg.AvgRemPct = (remMins / totalStageMins) * 100
	}

	// Consistency: standard deviation of bedtimes mapped to 0-100.
	agg.Consistency = bedTimeConsistency(bedTimes)

	// Weekday/weekend.
	agg.WeekdayAvgDurationMin = avgFloat(weekdayDurs)
	agg.WeekdayAvgBedTimeMin = avgFloat(weekdayBeds)
	agg.WeekendAvgDurationMin = avgFloat(weekendDurs)
	agg.WeekendAvgBedTimeMin = avgFloat(weekendBeds)

	// Last week.
	agg.LastWeekAvgDurationMin = avgFloat(lastWeekDurs)
	agg.LastWeekAvgBedTimeMin = avgFloat(lastWeekBeds)

	return agg
}

// bedTimeMinutes converts a session start to "minutes from midnight" suitable for
// averaging. Sessions starting before 12:00 are treated as after midnight (e.g., 01:30 = 90).
// Sessions starting after 12:00 are treated as before midnight (e.g., 23:00 = -60).
func bedTimeMinutes(t time.Time) float64 {
	min := float64(t.Hour()*60 + t.Minute())
	if min >= 720 { // after noon = evening/night before midnight
		return min - 1440 // e.g., 23:00 -> -60
	}
	return min // e.g., 01:30 -> 90
}

// bedTimeConsistency maps the standard deviation of bedtimes (in minutes) to a 0-100 score.
// 0 stddev = 100 (perfect), 120+ min stddev = 0 (chaotic).
func bedTimeConsistency(bedTimes []float64) int {
	if len(bedTimes) < 2 {
		return 50 // not enough data
	}
	mean := avgFloat(bedTimes)
	var sumSq float64
	for _, bt := range bedTimes {
		diff := bt - mean
		sumSq += diff * diff
	}
	stddev := math.Sqrt(sumSq / float64(len(bedTimes)))
	// Map: 0 min stddev -> 100, 120 min stddev -> 0.
	score := int(math.Round(100 * (1 - stddev/120)))
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	return score
}

func avgFloat(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	var sum float64
	for _, v := range vals {
		sum += v
	}
	return sum / float64(len(vals))
}

// minutesToClock converts minutes-from-midnight to HH:MM string.
// Handles wrapping (negative values = before midnight).
func minutesToClock(min float64) string {
	m := int(math.Round(min))
	if m < 0 {
		m += 1440
	}
	m = ((m % 1440) + 1440) % 1440
	return fmt.Sprintf("%02d:%02d", m/60, m%60)
}

// buildStatsPrompt formats aggregate stats as a readable JSON block for the LLM.
func buildStatsPrompt(agg sleepAggregate) string {
	stats := map[string]any{
		"totalNights":            agg.TotalNights,
		"avgDurationMinutes":     int(math.Round(agg.AvgDurationMin)),
		"avgBedTime":             minutesToClock(agg.AvgBedTimeMin),
		"avgWakeTime":            minutesToClock(agg.AvgWakeTimeMin),
		"avgDeepSleepPct":        int(math.Round(agg.AvgDeepPct)),
		"avgLightSleepPct":       int(math.Round(agg.AvgLightPct)),
		"avgRemSleepPct":         int(math.Round(agg.AvgRemPct)),
		"consistencyScore":       agg.Consistency,
		"weekdayAvgDurationMin":  int(math.Round(agg.WeekdayAvgDurationMin)),
		"weekdayAvgBedTime":      minutesToClock(agg.WeekdayAvgBedTimeMin),
		"weekendAvgDurationMin":  int(math.Round(agg.WeekendAvgDurationMin)),
		"weekendAvgBedTime":      minutesToClock(agg.WeekendAvgBedTimeMin),
		"lastWeekAvgDurationMin": int(math.Round(agg.LastWeekAvgDurationMin)),
		"lastWeekAvgBedTime":     minutesToClock(agg.LastWeekAvgBedTimeMin),
	}
	data, _ := json.MarshalIndent(stats, "", "  ")
	return string(data)
}

// parseSleepPlanResponse extracts and validates the LLM response into a typed response.
func parseSleepPlanResponse(raw any, agg sleepAggregate) (*sleepPlanResponse, error) {
	model, ok := raw.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("LLM returned non-object response")
	}

	lumaMessage, ok := model["lumaMessage"].(string)
	if !ok || strings.TrimSpace(lumaMessage) == "" {
		return nil, fmt.Errorf("LLM returned no lumaMessage")
	}
	lumaMessage = truncateRunes(strings.TrimSpace(lumaMessage), 500)

	bedTime, ok := model["bedTime"].(string)
	if !ok || !isValidClock(bedTime) {
		return nil, fmt.Errorf("LLM returned invalid bedTime: %v", model["bedTime"])
	}

	wakeTime, ok := model["wakeTime"].(string)
	if !ok || !isValidClock(wakeTime) {
		return nil, fmt.Errorf("LLM returned invalid wakeTime: %v", model["wakeTime"])
	}

	ritualStepsRaw, ok := model["ritualSteps"].([]any)
	if !ok || len(ritualStepsRaw) < 3 || len(ritualStepsRaw) > 5 {
		return nil, fmt.Errorf("LLM returned invalid ritualSteps count")
	}
	ritualSteps := make([]string, 0, len(ritualStepsRaw))
	for _, step := range ritualStepsRaw {
		s, ok := step.(string)
		if !ok || strings.TrimSpace(s) == "" {
			continue
		}
		ritualSteps = append(ritualSteps, truncateRunes(strings.TrimSpace(s), 200))
	}
	if len(ritualSteps) < 3 {
		return nil, fmt.Errorf("LLM returned too few valid ritualSteps")
	}

	reason, _ := model["reason"].(string)
	reason = truncateRunes(strings.TrimSpace(reason), 500)

	return &sleepPlanResponse{
		Status:      "ok",
		LumaMessage: lumaMessage,
		Plan: &sleepPlan{
			BedTime:     bedTime,
			WakeTime:    wakeTime,
			RitualSteps: ritualSteps,
			Reason:      reason,
		},
		Stats: &sleepPlanStats{
			TotalNights:      agg.TotalNights,
			AvgDurationMin:   int(math.Round(agg.AvgDurationMin)),
			AvgBedTime:       minutesToClock(agg.AvgBedTimeMin),
			AvgWakeTime:      minutesToClock(agg.AvgWakeTimeMin),
			AvgDeepPct:       int(math.Round(agg.AvgDeepPct)),
			ConsistencyScore: agg.Consistency,
		},
	}, nil
}

// isValidClock checks if a string is a valid HH:MM 24h clock.
func isValidClock(s string) bool {
	match := clockPattern.FindStringSubmatch(strings.TrimSpace(s))
	if match == nil {
		return false
	}
	hours := 0
	for _, c := range match[1] {
		hours = hours*10 + int(c-'0')
	}
	minutes := 0
	for _, c := range match[2] {
		minutes = minutes*10 + int(c-'0')
	}
	return hours <= 23 && minutes <= 59
}

// sortSessionsByStart sorts sessions by start time (ascending).
func sortSessionsByStart(sessions []mifit.SleepSession) {
	sort.Slice(sessions, func(i, j int) bool {
		return sessions[i].Start.Before(sessions[j].Start)
	})
}
