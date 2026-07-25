package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"slices"
	"strings"
)

// MorningContext carries the night outcome data sent by the client so the
// opening direction can tell the model what kind of night the traveler had.
type MorningContext struct {
	Outcome string `json:"outcome"` // PERFECT, GOOD, BAD, TERRIBLE, MISSED
	HpDelta int    `json:"hpDelta"`
	Xp      int    `json:"xp"`
}

// MorningOracleRequest is the wire request for POST /api/morning-oracle.
type MorningOracleRequest struct {
	Turns   []ChatTurn     `json:"turns"`
	Context MorningContext `json:"context"`
}

// morningOpeningDirection formats the stage direction with the night context.
func morningOpeningDirection(ctx MorningContext) string {
	outcome := strings.ToUpper(ctx.Outcome)
	if outcome == "" {
		outcome = "UNKNOWN"
	}
	return fmt.Sprintf(MorningOpeningTemplate, outcome, ctx.HpDelta, ctx.Xp)
}

func parseMorningBody(body any) ([]ChatTurn, MorningContext, error) {
	obj, _ := body.(map[string]any)
	if obj == nil {
		return nil, MorningContext{}, &OracleInputError{msg: "request body must be a JSON object"}
	}

	// Parse context
	var mctx MorningContext
	if ctxObj, ok := obj["context"].(map[string]any); ok {
		if outcome, ok := ctxObj["outcome"].(string); ok {
			mctx.Outcome = outcome
		}
		if hpDelta, ok := ctxObj["hpDelta"].(float64); ok {
			mctx.HpDelta = int(hpDelta)
		}
		if xp, ok := ctxObj["xp"].(float64); ok {
			mctx.Xp = int(xp)
		}
	}

	// Parse turns (reuse existing logic)
	rawTurns, isArray := obj["turns"].([]any)
	if !isArray || len(rawTurns) > maxTurns {
		return nil, MorningContext{}, &OracleInputError{msg: "turns must be an array of at most 16 entries"}
	}
	turns := make([]ChatTurn, 0, len(rawTurns))
	for _, item := range rawTurns {
		turn, _ := item.(map[string]any)
		role, _ := turn["role"].(string)
		text, isString := turn["text"].(string)
		if (role != "oracle" && role != "user") || !isString || strings.TrimSpace(text) == "" {
			return nil, MorningContext{}, &OracleInputError{msg: "each turn needs a role and non-empty text"}
		}
		turns = append(turns, ChatTurn{Role: role, Text: cleanText(text)})
	}
	return turns, mctx, nil
}

func toMorningMessages(turns []ChatTurn, mctx MorningContext) []ChatMessage {
	messages := make([]ChatMessage, 0, len(turns)+1)
	for _, turn := range turns {
		role := "user"
		if turn.Role == "oracle" {
			role = "assistant"
		}
		messages = append(messages, ChatMessage{Role: role, Content: turn.Text})
	}
	if len(messages) == 0 {
		// First call: inject the opening direction with night context
		return []ChatMessage{{Role: "user", Content: morningOpeningDirection(mctx)}}
	}
	return messages
}

func morningModelResponse(raw any) (*OracleResponse, error) {
	model, _ := raw.(map[string]any)
	message, ok := ascii(model["message"], maxMessageChars)
	if !ok {
		return nil, &OracleUnavailableError{msg: "model returned no message"}
	}
	// Morning oracle never returns recommendations
	return &OracleResponse{Reply: OracleReply{
		Message:        message,
		Suggestions:    parseSuggestions(model["suggestions"]),
		Recommendation: nil,
	}}, nil
}

func completeMorningOnce(ctx context.Context, provider AiProvider, messages []ChatMessage) (any, error) {
	return provider.Complete(ctx, StructuredCompletionInput{
		System:     MorningOracleSystemPrompt,
		Messages:   messages,
		SchemaName: "morning_oracle_reply",
		Schema:     MorningModelSchema,
	})
}

func buildMorningOracleResponse(ctx context.Context, body any, newProvider func() (AiProvider, error)) (*OracleResponse, error) {
	turns, mctx, err := parseMorningBody(body)
	if err != nil {
		return nil, err
	}
	log.Printf("morning-oracle turns: id=%s count=%d outcome=%s", requestID(ctx), len(turns), mctx.Outcome)
	for i, turn := range turns {
		log.Printf("morning-oracle input: id=%s turn=%d role=%s chars=%d text=%q", requestID(ctx), i, turn.Role, len([]rune(turn.Text)), turn.Text)
	}
	provider, err := newProvider()
	if err != nil {
		return nil, toUnavailable(err)
	}
	messages := toMorningMessages(turns, mctx)
	raw, err := completeMorningOnce(ctx, provider, messages)
	if err == nil {
		response, err := morningModelResponse(raw)
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
	log.Printf("morning-oracle nudge: id=%s reason=%v", requestID(ctx), err)
	nudged := append(slices.Clone(messages), ChatMessage{Role: "user", Content: OracleJSONNudge})
	raw, err = completeMorningOnce(ctx, provider, nudged)
	if err != nil {
		return nil, toUnavailable(err)
	}
	response, err := morningModelResponse(raw)
	if err != nil {
		return nil, toUnavailable(err)
	}
	return response, nil
}
