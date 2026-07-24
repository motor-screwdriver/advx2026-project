package main

import (
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8091"
	}
	if os.Getenv("OPENROUTER_API_KEY") == "" {
		log.Println("warning: OPENROUTER_API_KEY is not set; /api/oracle will answer 503")
	}
	addr := "127.0.0.1:" + port
	// WriteTimeout must outlast the upstream provider timeout (60s).
	server := &http.Server{
		Addr:              addr,
		Handler:           newServer(createAiProvider),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      90 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("8bit Sleep oracle server listening on http://%s", addr)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
