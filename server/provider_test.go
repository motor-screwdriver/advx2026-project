package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

var providerInput = StructuredCompletionInput{
	System:     "sys",
	Messages:   []ChatMessage{{Role: "user", Content: "hi"}},
	SchemaName: "test",
	Schema:     map[string]any{"type": "object"},
}

// testProvider points an OpenRouterProvider at a local test server, the Go
// equivalent of the TS suite's fetch mock.
func testProvider(t *testing.T, handler http.HandlerFunc) *OpenRouterProvider {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	provider := newOpenRouterProvider(OpenRouterConfig{APIKey: "k", Model: "m"})
	provider.url = server.URL
	return provider
}

func contentHandler(content string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []any{map[string]any{"message": map[string]any{"content": content}}},
		})
	}
}

func TestProviderParsesCleanJSON(t *testing.T) {
	provider := testProvider(t, contentHandler(`{"message":"hello"}`))
	result, err := provider.Complete(context.Background(), providerInput)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	obj, ok := result.(map[string]any)
	if !ok || obj["message"] != "hello" {
		t.Fatalf("result = %#v, want message hello", result)
	}
}

func TestProviderExtractsJSONWrappedInProse(t *testing.T) {
	provider := testProvider(t, contentHandler(`The hearth crackles! {"message":"hello"} Safe travels.`))
	result, err := provider.Complete(context.Background(), providerInput)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	obj, ok := result.(map[string]any)
	if !ok || obj["message"] != "hello" {
		t.Fatalf("result = %#v, want message hello", result)
	}
}

func TestProviderExtractsJSONFromCodeFence(t *testing.T) {
	provider := testProvider(t, contentHandler("```json\n{\"message\":\"hello\"}\n```"))
	result, err := provider.Complete(context.Background(), providerInput)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	obj, ok := result.(map[string]any)
	if !ok || obj["message"] != "hello" {
		t.Fatalf("result = %#v, want message hello", result)
	}
}

func TestProviderThrowsWhenNoJSONObject(t *testing.T) {
	provider := testProvider(t, contentHandler("Just prose, no object."))
	_, err := provider.Complete(context.Background(), providerInput)
	if err == nil {
		t.Fatal("expected an error")
	}
	var responseErr *AiResponseError
	if !errors.As(err, &responseErr) {
		t.Fatalf("error = %T %v, want AiResponseError (retry-worthy)", err, err)
	}
}

func TestProviderSendsExpectedRequest(t *testing.T) {
	var (
		gotMethod  string
		gotAuth    string
		gotTitle   string
		gotReferer string
		gotCT      string
		gotBody    map[string]any
	)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		gotAuth = r.Header.Get("Authorization")
		gotTitle = r.Header.Get("X-OpenRouter-Title")
		gotReferer = r.Header.Get("HTTP-Referer")
		gotCT = r.Header.Get("Content-Type")
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []any{map[string]any{"message": map[string]any{"content": `{"message":"ok"}`}}},
		})
	}))
	t.Cleanup(server.Close)
	provider := newOpenRouterProvider(OpenRouterConfig{APIKey: "k", Model: "m", AppURL: "https://example.test/app"})
	provider.url = server.URL

	if _, err := provider.Complete(context.Background(), providerInput); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotMethod != http.MethodPost {
		t.Fatalf("method = %q", gotMethod)
	}
	if gotAuth != "Bearer k" {
		t.Fatalf("Authorization = %q", gotAuth)
	}
	if gotTitle != "8bit Sleep" {
		t.Fatalf("X-OpenRouter-Title = %q", gotTitle)
	}
	if gotReferer != "https://example.test/app" {
		t.Fatalf("HTTP-Referer = %q", gotReferer)
	}
	if gotCT != "application/json" {
		t.Fatalf("Content-Type = %q", gotCT)
	}
	if gotBody["model"] != "m" {
		t.Fatalf("model = %v", gotBody["model"])
	}
	if gotBody["temperature"] != 0.8 {
		t.Fatalf("temperature = %v", gotBody["temperature"])
	}
	if gotBody["max_tokens"] != float64(300) {
		t.Fatalf("max_tokens = %v, want default 300", gotBody["max_tokens"])
	}
	if gotBody["stream"] != false {
		t.Fatalf("stream = %v", gotBody["stream"])
	}
	format, _ := gotBody["response_format"].(map[string]any)
	if format["type"] != "json_schema" {
		t.Fatalf("response_format.type = %v", format["type"])
	}
	schema, _ := format["json_schema"].(map[string]any)
	if schema["name"] != "test" || schema["strict"] != true {
		t.Fatalf("json_schema = %v", schema)
	}
	if schema["schema"] == nil {
		t.Fatal("json_schema.schema missing")
	}
	messages, _ := gotBody["messages"].([]any)
	if len(messages) != 2 {
		t.Fatalf("messages = %v", messages)
	}
	first, _ := messages[0].(map[string]any)
	if first["role"] != "system" || first["content"] != "sys" {
		t.Fatalf("first message = %v", first)
	}
	second, _ := messages[1].(map[string]any)
	if second["role"] != "user" || second["content"] != "hi" {
		t.Fatalf("second message = %v", second)
	}
}

func TestProviderErrorStatusIsNotRetryable(t *testing.T) {
	provider := testProvider(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		_, _ = w.Write([]byte("upstream broke"))
	})
	_, err := provider.Complete(context.Background(), providerInput)
	if err == nil {
		t.Fatal("expected an error")
	}
	var responseErr *AiResponseError
	if errors.As(err, &responseErr) {
		t.Fatalf("HTTP failures must not be retry-worthy, got %v", err)
	}
}
