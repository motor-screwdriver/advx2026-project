package main

import (
	"context"
	"errors"
	"log"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

const (
	maxTurns                  = 16
	maxTurnChars              = 400
	maxUserTurnsBeforeReading = 5
	maxMessageChars           = 320
	maxSuggestionChars        = 40
	maxReasonChars            = 160
)

// Default prose swapped in when numeric times or durations leak into the
// model's prose; the game renders the window itself, so prose with digits
// risks contradicting the displayed times. Word-form recaps of the traveler's
// own words ("eight hours") stay allowed. Ported from src/ui/strings.ts.
const defaultReadingMessage = "The embers have spoken. This window was read from your own tale."
const defaultReadingReason = "It follows the rhythm of the days you described, with a steady morning anchor."

// OracleInputError marks malformed client input (HTTP 400).
type OracleInputError struct{ msg string }

func (e *OracleInputError) Error() string { return e.msg }

// OracleUnavailableError marks provider or parsing failures (HTTP 503).
type OracleUnavailableError struct{ msg string }

func (e *OracleUnavailableError) Error() string { return e.msg }

// ChatTurn is one turn of the client-kept conversation transcript.
type ChatTurn struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

// SleepRecommendation is the divined sleep window in night-line minutes.
type SleepRecommendation struct {
	BedMin  int    `json:"bedMin"`
	WakeMin int    `json:"wakeMin"`
	Reason  string `json:"reason"`
}

// OracleReply is the oracle's answer for one turn.
type OracleReply struct {
	Message        string               `json:"message"`
	Suggestions    []string             `json:"suggestions"`
	Recommendation *SleepRecommendation `json:"recommendation"`
}

// OracleResponse is the wire response for POST /api/oracle.
type OracleResponse struct {
	Reply OracleReply `json:"reply"`
}

var clockPattern = regexp.MustCompile(`^(\d{1,2}):(\d{2})$`)

func cleanText(value string) string {
	cleaned := strings.Map(func(r rune) rune {
		if r <= 0x1f || r == 0x7f {
			return ' '
		}
		return r
	}, value)
	cleaned = strings.ReplaceAll(cleaned, "[[", "(")
	cleaned = strings.ReplaceAll(cleaned, "]]", ")")
	cleaned = strings.TrimSpace(cleaned)
	return truncateRunes(cleaned, maxTurnChars)
}

func truncateRunes(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}

func parseTurns(body any) ([]ChatTurn, error) {
	obj, _ := body.(map[string]any)
	rawTurns, isArray := obj["turns"].([]any)
	if !isArray || len(rawTurns) > maxTurns {
		return nil, &OracleInputError{msg: "turns must be an array of at most 16 entries"}
	}
	turns := make([]ChatTurn, 0, len(rawTurns))
	for _, item := range rawTurns {
		turn, _ := item.(map[string]any)
		role, _ := turn["role"].(string)
		text, isString := turn["text"].(string)
		if (role != "oracle" && role != "user") || !isString || strings.TrimSpace(text) == "" {
			return nil, &OracleInputError{msg: "each turn needs a role and non-empty text"}
		}
		turns = append(turns, ChatTurn{Role: role, Text: cleanText(text)})
	}
	return turns, nil
}

func toMessages(turns []ChatTurn) []ChatMessage {
	messages := make([]ChatMessage, 0, len(turns)+1)
	for _, turn := range turns {
		role := "user"
		if turn.Role == "oracle" {
			role = "assistant"
		}
		messages = append(messages, ChatMessage{Role: role, Content: turn.Text})
	}
	if len(messages) == 0 {
		return []ChatMessage{{Role: "user", Content: OracleOpeningDirection}}
	}
	userTurns := 0
	for _, turn := range turns {
		if turn.Role == "user" {
			userTurns++
		}
	}
	if userTurns >= maxUserTurnsBeforeReading {
		messages = append(messages, ChatMessage{Role: "user", Content: OracleFinalizeDirection})
	}
	return messages
}

// ascii normalizes model prose to printable ASCII: curly quotes and dashes to
// their ASCII twins, everything else non-ASCII stripped, trimmed and capped.
// It reports false for non-strings and for results that end up empty.
func ascii(value any, maxLength int) (string, bool) {
	s, ok := value.(string)
	if !ok {
		return "", false
	}
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		switch r {
		case '‘', '’':
			b.WriteByte('\'')
		case '“', '”':
			b.WriteByte('"')
		case '–', '—':
			b.WriteByte('-')
		default:
			if r >= 0x20 && r <= 0x7e {
				b.WriteRune(r)
			}
		}
	}
	clean := truncateRunes(strings.TrimSpace(b.String()), maxLength)
	if clean == "" {
		return "", false
	}
	return clean, true
}

func parseSuggestions(value any) []string {
	items, isArray := value.([]any)
	if !isArray {
		return []string{}
	}
	suggestions := make([]string, 0, 3)
	for _, item := range items {
		if clean, ok := ascii(item, maxSuggestionChars); ok {
			suggestions = append(suggestions, clean)
		}
	}
	if len(suggestions) > 3 {
		suggestions = suggestions[:3]
	}
	return suggestions
}

// toNightline converts a model-proposed 24-hour clock string into night-line
// minutes (counted from noon), snapped to the 15-minute grid. The model speaks
// in clock times because LLMs are unreliable at minute arithmetic.
func toNightline(value any) (int, bool) {
	clock, ok := value.(string)
	if !ok {
		return 0, false
	}
	match := clockPattern.FindStringSubmatch(strings.TrimSpace(clock))
	if match == nil {
		return 0, false
	}
	hours, _ := strconv.Atoi(match[1])
	minutes, _ := strconv.Atoi(match[2])
	if hours > 23 || minutes > 59 {
		return 0, false
	}
	nightline := (hours*60 + minutes - 720 + 1440) % 1440
	return (nightline + 7) / 15 * 15, true
}

func parseRecommendation(model map[string]any) *SleepRecommendation {
	bedMin, bedOK := toNightline(model["bedTime"])
	rawWake, wakeOK := toNightline(model["wakeTime"])
	if !bedOK || !wakeOK {
		return nil
	}
	wakeMin := rawWake
	if wakeMin == 0 {
		wakeMin = 1440
	}
	duration := wakeMin - bedMin
	if bedMin < 360 || bedMin > 900 || wakeMin < 720 || duration < 420 || duration > 720 {
		return nil
	}
	reason, ok := ascii(model["reason"], maxReasonChars)
	if !ok || hasDigit(reason) {
		reason = defaultReadingReason
	}
	return &SleepRecommendation{BedMin: bedMin, WakeMin: wakeMin, Reason: reason}
}

func modelResponse(raw any) (*OracleResponse, error) {
	model, _ := raw.(map[string]any)
	message, ok := ascii(model["message"], maxMessageChars)
	if !ok {
		return nil, &OracleUnavailableError{msg: "model returned no message"}
	}
	recommendation := parseRecommendation(model)
	if recommendation == nil {
		return &OracleResponse{Reply: OracleReply{
			Message:        message,
			Suggestions:    parseSuggestions(model["suggestions"]),
			Recommendation: nil,
		}}, nil
	}
	if hasDigit(message) {
		message = defaultReadingMessage
	}
	return &OracleResponse{Reply: OracleReply{
		Message:        message,
		Suggestions:    []string{},
		Recommendation: recommendation,
	}}, nil
}

// hasDigit mirrors the /\d/ schedule-leak test.
func hasDigit(s string) bool {
	return strings.ContainsAny(s, "0123456789")
}

func completeOnce(ctx context.Context, provider AiProvider, messages []ChatMessage) (any, error) {
	return provider.Complete(ctx, StructuredCompletionInput{
		System:     OracleSystemPrompt,
		Messages:   messages,
		SchemaName: "sleep_oracle_reply",
		Schema:     OracleModelSchema,
	})
}

func toUnavailable(err error) *OracleUnavailableError {
	return &OracleUnavailableError{msg: err.Error()}
}

func buildOracleResponse(ctx context.Context, body any, newProvider func() (AiProvider, error)) (*OracleResponse, error) {
	turns, err := parseTurns(body)
	if err != nil {
		return nil, err
	}
	log.Printf("oracle turns: id=%s count=%d", requestID(ctx), len(turns))
	provider, err := newProvider()
	if err != nil {
		return nil, toUnavailable(err)
	}
	messages := toMessages(turns)
	raw, err := completeOnce(ctx, provider, messages)
	if err == nil {
		response, err := modelResponse(raw)
		if err != nil {
			return nil, toUnavailable(err)
		}
		return response, nil
	}
	var responseErr *AiResponseError
	if !errors.As(err, &responseErr) {
		return nil, toUnavailable(err)
	}
	// The model answered in prose: nudge it back to the JSON contract once.
	log.Printf("oracle nudge: id=%s reason=%v", requestID(ctx), err)
	nudged := append(slices.Clone(messages), ChatMessage{Role: "user", Content: OracleJSONNudge})
	raw, err = completeOnce(ctx, provider, nudged)
	if err != nil {
		return nil, toUnavailable(err)
	}
	response, err := modelResponse(raw)
	if err != nil {
		return nil, toUnavailable(err)
	}
	return response, nil
}
