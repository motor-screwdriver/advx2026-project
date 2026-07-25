package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestServer(provider AiProvider) *Server {
	return newServer(func() (AiProvider, error) { return provider, nil })
}

func postOracle(t *testing.T, server *Server, ip string, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/oracle", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if ip != "" {
		req.Header.Set("X-Forwarded-For", ip)
	}
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)
	return recorder
}

func TestRateLimit429After40Requests(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	ip := "203.0.113.7"
	for i := 1; i <= 40; i++ {
		resp := postOracle(t, server, ip, `{"turns":[]}`)
		if resp.Code != http.StatusOK {
			t.Fatalf("request %d: status = %d, want 200", i, resp.Code)
		}
	}
	resp := postOracle(t, server, ip, `{"turns":[]}`)
	if resp.Code != http.StatusTooManyRequests {
		t.Fatalf("41st request: status = %d, want 429", resp.Code)
	}
	var body errorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("429 body is not JSON: %v", err)
	}
	if body.Error != "Too many requests. Try again shortly." {
		t.Fatalf("429 error = %q", body.Error)
	}
	if resp.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("429 response missing Cache-Control: no-store")
	}
	// A different client IP is unaffected.
	if resp := postOracle(t, server, "203.0.113.8", `{"turns":[]}`); resp.Code != http.StatusOK {
		t.Fatalf("other IP: status = %d, want 200", resp.Code)
	}
}

func TestCORSPreflight(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	req := httptest.NewRequest(http.MethodOptions, "/api/oracle", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("preflight status = %d, want 204", recorder.Code)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Allow-Origin = %q", got)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Methods"); got != "POST, OPTIONS" {
		t.Fatalf("Allow-Methods = %q", got)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Headers"); got != "Content-Type, Authorization" {
		t.Fatalf("Allow-Headers = %q", got)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Private-Network"); got != "true" {
		t.Fatalf("Allow-Private-Network = %q", got)
	}
}

func TestCORSAllowOriginOnPost(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	resp := postOracle(t, server, "", `{"turns":[]}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.Code)
	}
	if got := resp.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Allow-Origin = %q", got)
	}
	if got := resp.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q", got)
	}
	var body struct {
		Reply struct {
			Message        string               `json:"message"`
			Suggestions    []string             `json:"suggestions"`
			Recommendation *SleepRecommendation `json:"recommendation"`
		} `json:"reply"`
	}
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("200 body is not JSON: %v", err)
	}
	if !strings.Contains(body.Reply.Message, "scholar") {
		t.Fatalf("message = %q", body.Reply.Message)
	}
	if len(body.Reply.Suggestions) != 2 {
		t.Fatalf("suggestions = %v", body.Reply.Suggestions)
	}
	if body.Reply.Recommendation != nil {
		t.Fatalf("recommendation = %+v", body.Reply.Recommendation)
	}
}

func TestHealthz(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)
	if recorder.Code != http.StatusOK {
		t.Fatalf("healthz status = %d, want 200", recorder.Code)
	}
	if body, _ := io.ReadAll(recorder.Body); string(body) != "ok" {
		t.Fatalf("healthz body = %q, want ok", body)
	}
}

func TestBadTurns400(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	resp := postOracle(t, server, "", `{"turns":"nope"}`)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.Code)
	}
	var body errorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("400 body is not JSON: %v", err)
	}
	if body.Error != "turns must be an array of at most 16 entries" {
		t.Fatalf("error = %q", body.Error)
	}
	if got := resp.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q", got)
	}
}

func TestMalformedJSONBody500(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	resp := postOracle(t, server, "", `not json`)
	if resp.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", resp.Code)
	}
	var body errorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("500 body is not JSON: %v", err)
	}
	if body.Error != "The oracle is unavailable." {
		t.Fatalf("error = %q", body.Error)
	}
}

func TestMissingAPIKey503(t *testing.T) {
	t.Setenv("AI_PROVIDER", "openrouter")
	t.Setenv("OPENROUTER_API_KEY", "")
	server := newServer(createAiProvider)
	resp := postOracle(t, server, "", `{"turns":[]}`)
	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", resp.Code)
	}
	var body errorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("503 body is not JSON: %v", err)
	}
	if body.Error != "The oracle is unavailable." {
		t.Fatalf("error = %q", body.Error)
	}
}

func TestUnsupportedProvider503(t *testing.T) {
	t.Setenv("AI_PROVIDER", "anthropic")
	t.Setenv("OPENROUTER_API_KEY", "k")
	server := newServer(createAiProvider)
	resp := postOracle(t, server, "", `{"turns":[]}`)
	if resp.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", resp.Code)
	}
}
