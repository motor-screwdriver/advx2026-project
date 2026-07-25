package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

const miFitnessRequestTimeout = 45 * time.Second

var miFitnessRequestSeq atomic.Uint64

type miFitnessClient interface {
	Login(context.Context, string, string) error
	BeginEmailVerification(context.Context) error
	CompleteEmailVerification(context.Context, string) error
	ExportSession() (mifit.MiFitnessSession, error)
}

type miFitnessClientFactory func(region string) (miFitnessClient, error)

type miFitnessChallenge struct {
	client    miFitnessClient
	region    string
	expiresAt time.Time
}

type miFitnessChallengeStore struct {
	mu         sync.Mutex
	challenges map[string]miFitnessChallenge
	ttl        time.Duration
	now        func() time.Time
}

type miFitnessLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Region   string `json:"region"`
}

type miFitnessVerifyEmailRequest struct {
	ChallengeID string `json:"challengeId"`
	Code        string `json:"code"`
}

type miFitnessAuthResponse struct {
	Status      string                  `json:"status"`
	ChallengeID string                  `json:"challengeId,omitempty"`
	Region      string                  `json:"region"`
	Session     *mifit.MiFitnessSession `json:"session,omitempty"`
}

func newRealMiFitnessClient(region string) (miFitnessClient, error) {
	return mifit.NewMiFitness(mifit.MiFitnessConfig{
		Region: region, HTTPClient: newMiFitnessHTTPClient(),
	})
}

func newMiFitnessHTTPClient() *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.DialContext = (&net.Dialer{
		Timeout: 20 * time.Second, KeepAlive: 30 * time.Second,
	}).DialContext
	transport.TLSHandshakeTimeout = 30 * time.Second
	transport.ResponseHeaderTimeout = 30 * time.Second
	return &http.Client{Transport: transport, Timeout: miFitnessRequestTimeout}
}

func newMiFitnessChallengeStore(ttl time.Duration) *miFitnessChallengeStore {
	return &miFitnessChallengeStore{
		challenges: map[string]miFitnessChallenge{},
		ttl:        ttl,
		now:        time.Now,
	}
}

func (s *miFitnessChallengeStore) put(client miFitnessClient, region string) string {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.purgeExpiredLocked()
	id := randomChallengeID()
	s.challenges[id] = miFitnessChallenge{
		client: client, region: region, expiresAt: s.now().Add(s.ttl),
	}
	return id
}

func (s *miFitnessChallengeStore) get(id string) (miFitnessChallenge, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	challenge, ok := s.challenges[id]
	if !ok || !challenge.expiresAt.After(s.now()) {
		delete(s.challenges, id)
		return miFitnessChallenge{}, false
	}
	return challenge, true
}

func (s *miFitnessChallengeStore) delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.challenges, id)
}

func (s *miFitnessChallengeStore) purgeExpiredLocked() {
	now := s.now()
	for id, challenge := range s.challenges {
		if !challenge.expiresAt.After(now) {
			delete(s.challenges, id)
		}
	}
}

func (s *Server) handleMiFitnessLogin(w http.ResponseWriter, r *http.Request) {
	id := miFitnessRequestSeq.Add(1)
	start := time.Now()
	var body miFitnessLoginRequest
	if !readMiFitnessJSON(w, r, &body) {
		log.Printf("mifit login bad json: id=%d client=%s", id, clientID(r))
		return
	}
	region, ok := normalizeMiFitnessRegion(body.Region)
	if !ok {
		log.Printf("mifit login bad region: id=%d client=%s raw_region=%q",
			id, clientID(r), body.Region)
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Unsupported Mi Fitness region."})
		return
	}
	if strings.TrimSpace(body.Username) == "" || body.Password == "" {
		log.Printf("mifit login missing credentials: id=%d client=%s region=%s",
			id, clientID(r), region)
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Xiaomi login and password are required."})
		return
	}
	log.Printf("mifit login request: id=%d client=%s origin=%s region=%s",
		id, clientID(r), r.Header.Get("Origin"), region)
	client, err := s.mifitFactory(region)
	if err != nil {
		writeMiFitnessError(w, "create Mi Fitness client", err)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), miFitnessRequestTimeout)
	defer cancel()
	if err := client.Login(ctx, strings.TrimSpace(body.Username), body.Password); err != nil {
		var verification *mifit.VerificationRequiredError
		if !errors.As(err, &verification) {
			writeMiFitnessError(w, "login to Xiaomi", err)
			return
		}
		if err := client.BeginEmailVerification(ctx); err != nil {
			writeMiFitnessError(w, "request Xiaomi email code", err)
			return
		}
		challengeID := s.mifitChallenges.put(client, region)
		log.Printf("mifit login requires email verification: id=%d region=%s latency=%s",
			id, region, time.Since(start).Round(time.Millisecond))
		writeJSON(w, http.StatusOK, miFitnessAuthResponse{
			Status: "email_verification_required", ChallengeID: challengeID, Region: region,
		})
		return
	}
	writeConnectedMiFitness(w, region, client)
	log.Printf("mifit login connected: id=%d region=%s latency=%s",
		id, region, time.Since(start).Round(time.Millisecond))
}

func (s *Server) handleMiFitnessVerifyEmail(w http.ResponseWriter, r *http.Request) {
	id := miFitnessRequestSeq.Add(1)
	start := time.Now()
	var body miFitnessVerifyEmailRequest
	if !readMiFitnessJSON(w, r, &body) {
		log.Printf("mifit verify bad json: id=%d client=%s", id, clientID(r))
		return
	}
	challengeID := strings.TrimSpace(body.ChallengeID)
	if challengeID == "" || strings.TrimSpace(body.Code) == "" {
		log.Printf("mifit verify missing fields: id=%d client=%s", id, clientID(r))
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Challenge ID and email code are required."})
		return
	}
	challenge, ok := s.mifitChallenges.get(challengeID)
	if !ok {
		log.Printf("mifit verify expired challenge: id=%d client=%s", id, clientID(r))
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Xiaomi verification expired. Please login again."})
		return
	}
	log.Printf("mifit verify request: id=%d client=%s origin=%s region=%s",
		id, clientID(r), r.Header.Get("Origin"), challenge.region)
	ctx, cancel := context.WithTimeout(r.Context(), miFitnessRequestTimeout)
	defer cancel()
	if err := challenge.client.CompleteEmailVerification(ctx, body.Code); err != nil {
		writeMiFitnessError(w, "verify Xiaomi email code", err)
		return
	}
	s.mifitChallenges.delete(challengeID)
	writeConnectedMiFitness(w, challenge.region, challenge.client)
	log.Printf("mifit verify connected: id=%d region=%s latency=%s",
		id, challenge.region, time.Since(start).Round(time.Millisecond))
}

func readMiFitnessJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	payload, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64*1024))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Request body is too large."})
		return false
	}
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dest); err != nil {
		writeJSON(w, http.StatusBadRequest, errorResponse{Error: "Malformed request JSON."})
		return false
	}
	return true
}

func writeConnectedMiFitness(w http.ResponseWriter, region string, client miFitnessClient) {
	session, err := client.ExportSession()
	if err != nil {
		writeMiFitnessError(w, "export Xiaomi session", err)
		return
	}
	writeJSON(w, http.StatusOK, miFitnessAuthResponse{
		Status: "connected", Region: region, Session: &session,
	})
}

func writeMiFitnessError(w http.ResponseWriter, op string, err error) {
	status := http.StatusInternalServerError
	message := "Xiaomi login is unavailable."
	switch mifit.KindOf(err) {
	case mifit.KindConfig:
		status, message = http.StatusBadRequest, "Invalid Xiaomi login request."
	case mifit.KindAuth:
		status, message = http.StatusUnauthorized, "Xiaomi authentication failed."
	case mifit.KindTransport:
		status, message = http.StatusBadGateway, "Xiaomi service is unavailable."
	case mifit.KindDecode:
		status, message = http.StatusBadGateway, "Xiaomi returned an unexpected response."
	}
	log.Printf("mifit auth error: op=%s kind=%d err=%v", op, mifit.KindOf(err), err)
	writeJSON(w, status, errorResponse{Error: message})
}

func normalizeMiFitnessRegion(raw string) (string, bool) {
	region := strings.ToLower(strings.TrimSpace(raw))
	switch region {
	case "de", "cn", "ru", "i2", "sg", "us":
		return region, true
	default:
		return "", false
	}
}

func randomChallengeID() string {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return base64.RawURLEncoding.EncodeToString(raw[:])
}
