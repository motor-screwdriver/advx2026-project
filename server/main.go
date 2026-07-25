package main

import (
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	host := os.Getenv("HOST")
	if host == "" {
		host = "127.0.0.1"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if os.Getenv("AI_API_KEY") == "" {
		log.Println("warning: AI_API_KEY is not set; /api/oracle will answer 503")
	}
	addr := host + ":" + port
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
