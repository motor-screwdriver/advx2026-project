package main

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	rateWindow = 10 * time.Minute
	rateLimit  = 40
)

type errorResponse struct {
	Error string `json:"error"`
}

type rateBucket struct {
	count    int
	resetsAt time.Time
}

// rateLimiter is a fixed-window per-client-IP limiter, mirroring the in-memory
// buckets of app/api/oracle+api.ts.
type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]rateBucket
	window  time.Duration
	limit   int
	now     func() time.Time
}

func newRateLimiter(window time.Duration, limit int) *rateLimiter {
	return &rateLimiter{
		buckets: make(map[string]rateBucket),
		window:  window,
		limit:   limit,
		now:     time.Now,
	}
}

func (l *rateLimiter) allow(id string) bool {
	now := l.now()
	l.mu.Lock()
	defer l.mu.Unlock()
	current, ok := l.buckets[id]
	if !ok || !current.resetsAt.After(now) {
		l.buckets[id] = rateBucket{count: 1, resetsAt: now.Add(l.window)}
		return true
	}
	if current.count >= l.limit {
		return false
	}
	current.count++
	l.buckets[id] = current
	return true
}

// clientID identifies a caller by the first X-Forwarded-For entry, falling
// back to the remote address host.
func clientID(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		first, _, _ := strings.Cut(forwarded, ",")
		return strings.TrimSpace(first)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

// Server wires the oracle endpoint, rate limiting and provider factory.
type Server struct {
	providerFactory func() (AiProvider, error)
	limiter         *rateLimiter
	handler         http.Handler
}

func newServer(providerFactory func() (AiProvider, error)) *Server {
	s := &Server{
		providerFactory: providerFactory,
		limiter:         newRateLimiter(rateWindow, rateLimit),
	}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/oracle", s.handleOracle)
	mux.HandleFunc("GET /healthz", s.handleHealthz)
	s.handler = corsMiddleware(mux)
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.handler.ServeHTTP(w, r)
}

func (s *Server) handleOracle(w http.ResponseWriter, r *http.Request) {
	if !s.limiter.allow(clientID(r)) {
		writeJSON(w, http.StatusTooManyRequests, errorResponse{Error: "Too many requests. Try again shortly."})
		return
	}
	// A legit transcript is 16 turns x 400 chars, so 64 KiB is generous; the
	// rate limiter above already bounded request frequency, this bounds memory.
	payload, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64*1024))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "The oracle is unavailable."})
		return
	}
	var body any
	if err := json.Unmarshal(payload, &body); err != nil {
		writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "The oracle is unavailable."})
		return
	}
	response, err := buildOracleResponse(r.Context(), body, s.providerFactory)
	if err != nil {
		var inputErr *OracleInputError
		var unavailableErr *OracleUnavailableError
		switch {
		case errors.As(err, &inputErr):
			log.Printf("oracle 400 client=%s: %v", clientID(r), err)
			writeJSON(w, http.StatusBadRequest, errorResponse{Error: inputErr.msg})
		case errors.As(err, &unavailableErr):
			// The generic body hides the cause from the user; log the real
			// upstream error (e.g. "OpenRouter 402: ...") so it is diagnosable.
			log.Printf("oracle 503 client=%s: %v", clientID(r), err)
			writeJSON(w, http.StatusServiceUnavailable, errorResponse{Error: "The oracle is unavailable."})
		default:
			log.Printf("oracle 500 client=%s: %v", clientID(r), err)
			writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "The oracle is unavailable."})
		}
		return
	}
	log.Printf("oracle 200 client=%s", clientID(r))
	writeJSON(w, http.StatusOK, response)
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = io.WriteString(w, "ok")
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// corsMiddleware lets the web dev build (a different origin) call the API:
// preflight answers 204 and every /api/ response carries Allow-Origin.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			if r.Method == http.MethodOptions {
				w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
