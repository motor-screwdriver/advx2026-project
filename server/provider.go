package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const openRouterURL = "https://openrouter.ai/api/v1/chat/completions"
const defaultModel = "openrouter/free"
const defaultMaxTokens = 300

// requestTimeout: free-tier models can take 30s+ for a structured reply; keep
// this under the client timeout.
const requestTimeout = 60 * time.Second

// ChatMessage is one message in the model conversation.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// StructuredCompletionInput is a single structured completion request.
type StructuredCompletionInput struct {
	System     string
	Messages   []ChatMessage
	SchemaName string
	Schema     map[string]any
}

// AiProvider is a structured-completion backend.
type AiProvider interface {
	Complete(ctx context.Context, input StructuredCompletionInput) (any, error)
}

// AiResponseError means the model answered, but not with parseable JSON —
// worth one nudge retry.
type AiResponseError struct{ msg string }

func (e *AiResponseError) Error() string { return e.msg }

// OpenRouterConfig holds the OpenRouter connection settings.
type OpenRouterConfig struct {
	APIKey    string
	Model     string
	AppURL    string
	MaxTokens int
}

// OpenRouterProvider talks to the OpenRouter chat-completions API.
type OpenRouterProvider struct {
	config OpenRouterConfig
	url    string
	client *http.Client
}

func newOpenRouterProvider(config OpenRouterConfig) *OpenRouterProvider {
	return &OpenRouterProvider{
		config: config,
		url:    openRouterURL,
		client: &http.Client{Timeout: requestTimeout},
	}
}

func (p *OpenRouterProvider) Complete(ctx context.Context, input StructuredCompletionInput) (any, error) {
	maxTokens := p.config.MaxTokens
	if maxTokens <= 0 {
		maxTokens = defaultMaxTokens
	}
	messages := make([]ChatMessage, 0, len(input.Messages)+1)
	messages = append(messages, ChatMessage{Role: "system", Content: input.System})
	messages = append(messages, input.Messages...)
	requestBody := map[string]any{
		"model":    p.config.Model,
		"messages": messages,
		"response_format": map[string]any{
			"type": "json_schema",
			"json_schema": map[string]any{
				"name":   input.SchemaName,
				"strict": true,
				"schema": input.Schema,
			},
		},
		"temperature": 0.8,
		"max_tokens":  maxTokens,
		"stream":      false,
	}
	payload, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.url, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-OpenRouter-Title", "8bit Sleep")
	if p.config.AppURL != "" {
		req.Header.Set("HTTP-Referer", p.config.AppURL)
	}
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		detail := []rune(string(body))
		if len(detail) > 240 {
			detail = detail[:240]
		}
		return nil, fmt.Errorf("OpenRouter %d: %s", resp.StatusCode, string(detail))
	}
	content, err := responseContent(body)
	if err != nil {
		return nil, err
	}
	return parseJSONContent(content)
}

func responseContent(payload []byte) (string, error) {
	var raw any
	if err := json.Unmarshal(payload, &raw); err != nil {
		return "", errors.New("OpenRouter returned an invalid response")
	}
	obj, ok := raw.(map[string]any)
	if !ok {
		return "", errors.New("OpenRouter returned an invalid response")
	}
	choices, ok := obj["choices"].([]any)
	if !ok || len(choices) == 0 {
		return "", errors.New("OpenRouter returned no choices")
	}
	first, ok := choices[0].(map[string]any)
	if !ok {
		return "", errors.New("OpenRouter returned no choices")
	}
	message, ok := first["message"].(map[string]any)
	if !ok {
		return "", errors.New("OpenRouter returned no message")
	}
	content, ok := message["content"].(string)
	if !ok || strings.TrimSpace(content) == "" {
		return "", errors.New("OpenRouter returned empty content")
	}
	return content, nil
}

// parseJSONContent parses the model's JSON reply. Strict schemas keep replies
// clean most of the time, but weaker models sometimes wrap the object in prose
// or a code fence, so fall back to extracting the outermost brace span.
func parseJSONContent(content string) (any, error) {
	var value any
	if err := json.Unmarshal([]byte(content), &value); err == nil {
		return value, nil
	}
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start == -1 || end <= start {
		return nil, &AiResponseError{msg: "OpenRouter returned no JSON object"}
	}
	if err := json.Unmarshal([]byte(content[start:end+1]), &value); err != nil {
		return nil, &AiResponseError{msg: "OpenRouter returned malformed JSON"}
	}
	return value, nil
}

func createAiProvider() (AiProvider, error) {
	provider, set := os.LookupEnv("AI_PROVIDER")
	if !set {
		provider = "openrouter"
	}
	if provider != "openrouter" {
		return nil, fmt.Errorf("Unsupported AI provider: %s", provider)
	}
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		return nil, errors.New("OPENROUTER_API_KEY is not configured")
	}
	config := OpenRouterConfig{
		APIKey: apiKey,
		Model:  defaultModel,
		AppURL: os.Getenv("AI_APP_URL"),
	}
	if model, set := os.LookupEnv("AI_MODEL"); set && model != "" {
		config.Model = model
	}
	if maxTokens, err := strconv.Atoi(os.Getenv("AI_MAX_TOKENS")); err == nil && maxTokens > 0 {
		config.MaxTokens = maxTokens
	}
	return newOpenRouterProvider(config), nil
}
