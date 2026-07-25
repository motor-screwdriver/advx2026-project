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

type fakeMiFitnessClient struct {
	loginErr  error
	beginErr  error
	verifyErr error
	session   mifit.MiFitnessSession

	username string
	password string
	code     string
	began    bool
}

func (f *fakeMiFitnessClient) Login(_ context.Context, username, password string) error {
	f.username, f.password = username, password
	return f.loginErr
}

func (f *fakeMiFitnessClient) BeginEmailVerification(context.Context) error {
	f.began = true
	return f.beginErr
}

func (f *fakeMiFitnessClient) CompleteEmailVerification(_ context.Context, code string) error {
	f.code = code
	return f.verifyErr
}

func (f *fakeMiFitnessClient) ExportSession() (mifit.MiFitnessSession, error) {
	if f.session.Security == "" || f.session.Cookies == "" {
		return mifit.MiFitnessSession{}, &mifit.Error{
			Kind: mifit.KindAuth, Op: "export test session", Err: errors.New("missing"),
		}
	}
	return f.session, nil
}

func postMiFitness(t *testing.T, server *Server, path string, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	server.ServeHTTP(recorder, req)
	return recorder
}

func testMiFitnessServer(fake *fakeMiFitnessClient, gotRegion *string) *Server {
	server := newTestServer(providerWith(questionReply()))
	server.mifitFactory = func(region string) (miFitnessClient, error) {
		*gotRegion = region
		return fake, nil
	}
	return server
}

func TestMiFitnessLoginSuccessReturnsSession(t *testing.T) {
	fake := &fakeMiFitnessClient{session: mifit.MiFitnessSession{
		Security: "safe-security", Cookies: "serviceToken=safe-cookie",
	}}
	gotRegion := ""
	server := testMiFitnessServer(fake, &gotRegion)

	resp := postMiFitness(t, server, "/api/mifit/login",
		`{"username":" user@example.com ","password":"secret","region":"DE"}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", resp.Code, resp.Body.String())
	}
	var body miFitnessAuthResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if body.Status != "connected" || body.Region != "de" || body.Session == nil {
		t.Fatalf("response = %+v", body)
	}
	if gotRegion != "de" || fake.username != "user@example.com" || fake.password != "secret" {
		t.Fatalf("region/login/password = %q/%q/%q", gotRegion, fake.username, fake.password)
	}
	if strings.Contains(resp.Body.String(), "secret") {
		t.Fatalf("response leaked password: %s", resp.Body.String())
	}
}

func TestMiFitnessLoginEmailChallengeReturnsChallengeID(t *testing.T) {
	fake := &fakeMiFitnessClient{
		loginErr: &mifit.Error{
			Kind: mifit.KindAuth, Op: "Xiaomi authentication",
			Err: &mifit.VerificationRequiredError{},
		},
		session: mifit.MiFitnessSession{Security: "safe", Cookies: "safe"},
	}
	gotRegion := ""
	server := testMiFitnessServer(fake, &gotRegion)

	resp := postMiFitness(t, server, "/api/mifit/login",
		`{"username":"user@example.com","password":"secret","region":"ru"}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", resp.Code, resp.Body.String())
	}
	var body miFitnessAuthResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if body.Status != "email_verification_required" || body.ChallengeID == "" ||
		body.Region != "ru" || !fake.began {
		t.Fatalf("response = %+v began=%t", body, fake.began)
	}
	if _, ok := server.mifitChallenges.get(body.ChallengeID); !ok {
		t.Fatal("challenge was not stored")
	}
}

func TestMiFitnessVerifyEmailCompletesStoredChallenge(t *testing.T) {
	fake := &fakeMiFitnessClient{session: mifit.MiFitnessSession{
		Security: "safe-security", Cookies: "serviceToken=safe-cookie",
	}}
	server := newTestServer(providerWith(questionReply()))
	id := server.mifitChallenges.put(fake, "sg")

	resp := postMiFitness(t, server, "/api/mifit/verify-email",
		`{"challengeId":"`+id+`","code":" 123456 "}`)
	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", resp.Code, resp.Body.String())
	}
	var body miFitnessAuthResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if body.Status != "connected" || body.Region != "sg" || body.Session == nil {
		t.Fatalf("response = %+v", body)
	}
	if fake.code != " 123456 " {
		t.Fatalf("code = %q", fake.code)
	}
	if _, ok := server.mifitChallenges.get(id); ok {
		t.Fatal("challenge was not removed after success")
	}
}

func TestMiFitnessVerifyEmailRejectsExpiredChallenge(t *testing.T) {
	server := newTestServer(providerWith(questionReply()))
	store := newMiFitnessChallengeStore(10 * time.Minute)
	now := time.Date(2026, 7, 25, 12, 0, 0, 0, time.UTC)
	store.now = func() time.Time { return now }
	id := store.put(&fakeMiFitnessClient{}, "de")
	now = now.Add(11 * time.Minute)
	server.mifitChallenges = store

	resp := postMiFitness(t, server, "/api/mifit/verify-email",
		`{"challengeId":"`+id+`","code":"123456"}`)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.Code)
	}
	var body errorResponse
	if err := json.Unmarshal(resp.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON: %v", err)
	}
	if !strings.Contains(body.Error, "expired") {
		t.Fatalf("error = %q", body.Error)
	}
}

func TestMiFitnessLoginRejectsInvalidRegion(t *testing.T) {
	called := false
	server := newTestServer(providerWith(questionReply()))
	server.mifitFactory = func(string) (miFitnessClient, error) {
		called = true
		return &fakeMiFitnessClient{}, nil
	}

	resp := postMiFitness(t, server, "/api/mifit/login",
		`{"username":"user@example.com","password":"secret","region":"moon"}`)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", resp.Code)
	}
	if called {
		t.Fatal("factory should not be called for invalid region")
	}
}
