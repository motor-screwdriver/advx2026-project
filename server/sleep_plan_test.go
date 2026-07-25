package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

// fakeSleepPlanClient implements sleepPlanClient for testing.
type fakeSleepPlanClient struct {
	restoreErr error
	fetchErr   error
	sessions   []mifit.SleepSession
}

func (f *fakeSleepPlanClient) RestoreSession(s mifit.MiFitnessSession) error {
	return f.restoreErr
}

func (f *fakeSleepPlanClient) FetchSleep(_ context.Context, from, to time.Time) ([]mifit.SleepSession, error) {
	if f.fetchErr != nil {
		return nil, f.fetchErr
	}
	return f.sessions, nil
}

func postSleepPlan(t *testing.T, server *Server, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/sleep-plan", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)
	return recorder
}

func sleepPlanTestServer(fakeClient *fakeSleepPlanClient, fakeProvider AiProvider) *Server {
	server := newServer(func() (AiProvider, error) { return fakeProvider, nil })
	server.sleepPlanFactory = func(region string) (sleepPlanClient, error) {
		return fakeClient, nil
	}
	return server
}

// fakeSleepPlanProvider returns a fixed response from Complete.
type fakeSleepPlanProvider struct {
	response any
	err      error
}

func (f *fakeSleepPlanProvider) Complete(_ context.Context, _ StructuredCompletionInput) (any, error) {
	return f.response, f.err
}

func validLLMResponse() map[string]any {
	return map[string]any{
		"lumaMessage": "The embers reveal your nights, traveler. Your rest has been unsteady, but a gentler rhythm awaits.",
		"bedTime":     "23:00",
		"wakeTime":    "07:00",
		"ritualSteps": []any{
			"Dim the lights one hour before rest",
			"A few minutes of slow breathing",
			"Keep the room cool and dark",
		},
		"reason": "Your deepest sleep happens before 23:30. Weeknights average 6.5 hours — this gives 8.",
	}
}

func makeSessions(count int) []mifit.SleepSession {
	sessions := make([]mifit.SleepSession, count)
	base := time.Date(2025, 6, 1, 23, 30, 0, 0, time.UTC)
	for i := range sessions {
		start := base.AddDate(0, 0, i)
		sessions[i] = mifit.SleepSession{
			Provider:        mifit.ProviderMiFitness,
			ExternalID:      "test-" + string(rune('a'+i)),
			Start:           start,
			End:             start.Add(7*time.Hour + 30*time.Minute),
			DurationMinutes: 450,
			IsNap:           false,
			Stages: []mifit.SleepStage{
				{Name: "deep", Minutes: 90},
				{Name: "light", Minutes: 240},
				{Name: "rem", Minutes: 120},
			},
		}
	}
	return sessions
}

// --- Aggregation tests ---

func TestAggregateSleepMonthBasic(t *testing.T) {
	sessions := makeSessions(10)
	agg := aggregateSleepMonth(sessions)

	if agg.TotalNights != 10 {
		t.Fatalf("TotalNights = %d, want 10", agg.TotalNights)
	}
	if agg.AvgDurationMin != 450 {
		t.Fatalf("AvgDurationMin = %f, want 450", agg.AvgDurationMin)
	}
	if agg.AvgDeepPct < 19 || agg.AvgDeepPct > 21 {
		t.Fatalf("AvgDeepPct = %f, want ~20", agg.AvgDeepPct)
	}
	// All sessions at same time -> high consistency.
	if agg.Consistency < 90 {
		t.Fatalf("Consistency = %d, want >= 90 for uniform bedtimes", agg.Consistency)
	}
}

func TestAggregateSleepMonthEmpty(t *testing.T) {
	agg := aggregateSleepMonth(nil)
	if agg.TotalNights != 0 {
		t.Fatalf("TotalNights = %d, want 0", agg.TotalNights)
	}
}

func TestAggregateSleepMonthSingleNight(t *testing.T) {
	sessions := makeSessions(1)
	agg := aggregateSleepMonth(sessions)
	if agg.TotalNights != 1 {
		t.Fatalf("TotalNights = %d, want 1", agg.TotalNights)
	}
	// Single night = default consistency of 50.
	if agg.Consistency != 50 {
		t.Fatalf("Consistency = %d, want 50 for single night", agg.Consistency)
	}
}

func TestAggregateFiltersNaps(t *testing.T) {
	sessions := makeSessions(5)
	sessions = append(sessions, mifit.SleepSession{
		Start:           time.Date(2025, 6, 6, 14, 0, 0, 0, time.UTC),
		End:             time.Date(2025, 6, 6, 14, 30, 0, 0, time.UTC),
		DurationMinutes: 30,
		IsNap:           true,
	})
	main := filterMainSleep(sessions)
	if len(main) != 5 {
		t.Fatalf("filterMainSleep returned %d, want 5", len(main))
	}
}

func TestBedTimeConsistencyVaried(t *testing.T) {
	// Very inconsistent bedtimes: large stddev -> low score.
	bedTimes := []float64{-120, -60, 0, 60, 120, -90, 30, 90, -30, 150}
	score := bedTimeConsistency(bedTimes)
	if score > 50 {
		t.Fatalf("Consistency = %d, want <= 50 for varied bedtimes", score)
	}
}

// --- Endpoint tests ---

func TestSleepPlanSuccess(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{sessions: makeSessions(20)}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"de"}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", resp.Code, resp.Body.String())
	}
	var body sleepPlanResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if body.Status != "ok" {
		t.Fatalf("status = %q, want ok", body.Status)
	}
	if body.LumaMessage == "" {
		t.Fatal("lumaMessage is empty")
	}
	if body.Plan == nil {
		t.Fatal("plan is nil")
	}
	if body.Plan.BedTime != "23:00" || body.Plan.WakeTime != "07:00" {
		t.Fatalf("plan times = %s/%s", body.Plan.BedTime, body.Plan.WakeTime)
	}
	if len(body.Plan.RitualSteps) < 3 {
		t.Fatalf("ritualSteps count = %d, want >= 3", len(body.Plan.RitualSteps))
	}
	if body.Stats == nil {
		t.Fatal("stats is nil")
	}
	if body.Stats.TotalNights != 20 {
		t.Fatalf("stats.totalNights = %d, want 20", body.Stats.TotalNights)
	}
}

func TestSleepPlanNoData(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{sessions: nil}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"de"}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.Code)
	}
	var body sleepPlanResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if body.Status != "no_data" {
		t.Fatalf("status = %q, want no_data", body.Status)
	}
	if body.LumaMessage == "" {
		t.Fatal("no_data should include a lumaMessage")
	}
}

func TestSleepPlanExpiredSession(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{
		restoreErr: &mifit.Error{Kind: mifit.KindConfig, Op: "restore", Err: errors.New("expired")},
	}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"de"}`)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", resp.Code)
	}
}

func TestSleepPlanFetchAuthError(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{
		fetchErr: &mifit.Error{Kind: mifit.KindAuth, Op: "fetch sleep", Err: errors.New("auth expired")},
	}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"de"}`)
	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", resp.Code)
	}
}

func TestSleepPlanMissingSession(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{sessions: makeSessions(5)}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"","cookies":""},"region":"de"}`)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.Code)
	}
}

func TestSleepPlanInvalidRegion(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{sessions: makeSessions(5)}
	fakeProvider := &fakeSleepPlanProvider{response: validLLMResponse()}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"mars"}`)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.Code)
	}
}

func TestSleepPlanLLMError(t *testing.T) {
	fakeClient := &fakeSleepPlanClient{sessions: makeSessions(10)}
	fakeProvider := &fakeSleepPlanProvider{err: errors.New("LLM timeout")}
	server := sleepPlanTestServer(fakeClient, fakeProvider)

	resp := postSleepPlan(t, server,
		`{"mifitSession":{"security":"dGVzdA==","cookies":"token=abc"},"region":"de"}`)
	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", resp.Code)
	}
}

// --- Response validation tests ---

func TestParseSleepPlanResponseValidation(t *testing.T) {
	agg := aggregateSleepMonth(makeSessions(10))

	tests := []struct {
		name    string
		model   map[string]any
		wantErr bool
	}{
		{
			name:    "valid response",
			model:   validLLMResponse(),
			wantErr: false,
		},
		{
			name: "missing lumaMessage",
			model: map[string]any{
				"bedTime": "23:00", "wakeTime": "07:00",
				"ritualSteps": []any{"a", "b", "c"}, "reason": "ok",
			},
			wantErr: true,
		},
		{
			name: "invalid bedTime",
			model: map[string]any{
				"lumaMessage": "hello", "bedTime": "25:00", "wakeTime": "07:00",
				"ritualSteps": []any{"a", "b", "c"}, "reason": "ok",
			},
			wantErr: true,
		},
		{
			name: "too few ritualSteps",
			model: map[string]any{
				"lumaMessage": "hello", "bedTime": "23:00", "wakeTime": "07:00",
				"ritualSteps": []any{"a", "b"}, "reason": "ok",
			},
			wantErr: true,
		},
		{
			name: "too many ritualSteps accepted as truncated",
			model: map[string]any{
				"lumaMessage": "hello", "bedTime": "23:00", "wakeTime": "07:00",
				"ritualSteps": []any{"a", "b", "c", "d", "e", "f"},
				"reason":      "ok",
			},
			wantErr: true, // >5 fails validation
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseSleepPlanResponse(tt.model, agg)
			if (err != nil) != tt.wantErr {
				t.Fatalf("err = %v, wantErr = %t", err, tt.wantErr)
			}
		})
	}
}

// --- Utility tests ---

func TestMinutesToClock(t *testing.T) {
	tests := []struct {
		min  float64
		want string
	}{
		{-60, "23:00"},  // 23:00 = 1380 min = -60 from midnight
		{0, "00:00"},    // midnight
		{90, "01:30"},   // 01:30
		{450, "07:30"},  // 07:30
		{-120, "22:00"}, // 22:00
	}
	for _, tt := range tests {
		got := minutesToClock(tt.min)
		if got != tt.want {
			t.Errorf("minutesToClock(%f) = %q, want %q", tt.min, got, tt.want)
		}
	}
}

func TestBedTimeMinutes(t *testing.T) {
	tests := []struct {
		hour, min int
		want      float64
	}{
		{23, 0, -60},  // 23:00 -> -60 (before midnight)
		{0, 30, 30},   // 00:30 -> 30 (after midnight)
		{1, 0, 60},    // 01:00 -> 60
		{22, 30, -90}, // 22:30 -> -90
	}
	for _, tt := range tests {
		tm := time.Date(2025, 6, 15, tt.hour, tt.min, 0, 0, time.UTC)
		got := bedTimeMinutes(tm)
		if got != tt.want {
			t.Errorf("bedTimeMinutes(%02d:%02d) = %f, want %f", tt.hour, tt.min, got, tt.want)
		}
	}
}
