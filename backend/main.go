package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	ctx := context.Background()

	app := &App{}
	if url := os.Getenv("DATABASE_URL"); url != "" {
		pool, err := newPool(ctx, url)
		if err != nil {
			log.Fatalf("db connect: %v", err)
		}
		defer pool.Close()
		if err := migrate(ctx, pool); err != nil {
			log.Fatalf("db migrate: %v", err)
		}
		app.pool = pool
		log.Print("postgres ready")
	} else {
		log.Print("DATABASE_URL unset — raid endpoints return 503")
	}

	mux := http.NewServeMux()
	app.routes(mux)

	addr := ":" + envOr("PORT", "8080")
	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func handleRoot(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "8bit-sleep-backend",
		"status":  "ok",
	})
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("write response: %v", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
