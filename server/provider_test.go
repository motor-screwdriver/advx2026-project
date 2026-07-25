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
	Schema:     json.RawMessage(`{"type": "object"}`),
}

// testProvider points an OpenAIProvider at a local test server, the Go
// equivalent of the TS suite's fetch mock.
func testProvider(t *testing.T, handler http.HandlerFunc) *OpenAIProvider {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	provider := newOpenAIProvider(LLMConfig{APIKey: "k", BaseURL: server.URL, Model: "m"})
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
		gotMethod string
		gotPath   string
		gotAuth   string
		gotCT     string
		gotBody   map[string]any
	)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		gotPath = r.URL.Path
		gotAuth = r.Header.Get("Authorization")
		gotCT = r.Header.Get("Content-Type")
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []any{map[string]any{"message": map[string]any{"content": `{"message":"ok"}`}}},
		})
	}))
	t.Cleanup(server.Close)
	provider := newOpenAIProvider(LLMConfig{APIKey: "k", BaseURL: server.URL + "/v1/", Model: "m"})

	if _, err := provider.Complete(context.Background(), providerInput); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotMethod != http.MethodPost {
		t.Fatalf("method = %q", gotMethod)
	}
	if gotPath != "/v1/chat/completions" {
		t.Fatalf("path = %q, want /v1/chat/completions", gotPath)
	}
	if gotAuth != "Bearer k" {
		t.Fatalf("Authorization = %q", gotAuth)
	}
	if gotCT != "application/json" {
		t.Fatalf("Content-Type = %q", gotCT)
	}
	if gotBody["model"] != "m" {
		t.Fatalf("model = %v", gotBody["model"])
	}
	if gotBody["temperature"] != 0.7 {
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
