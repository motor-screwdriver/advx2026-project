package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// App carries shared dependencies (the DB pool) into HTTP handlers.
type App struct {
	pool *pgxpool.Pool
}

func (a *App) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /", handleRoot)
	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("POST /raids", a.createRaid)
	mux.HandleFunc("GET /raids/{code}", a.findRaid)
	mux.HandleFunc("GET /raids/{id}/members", a.getMembers)
	mux.HandleFunc("PUT /raids/{id}/members", a.putMember)
	mux.HandleFunc("DELETE /raids/{id}/members/{deviceId}", a.deleteMember)
	mux.HandleFunc("GET /raids/{id}/nights", a.getNights)
	mux.HandleFunc("PUT /raids/{id}/nights", a.putNight)
}

func (a *App) createRaid(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	var body struct {
		Code string `json:"code"`
	}
	if !decode(w, r, &body) || body.Code == "" {
		writeJSON(w, http.StatusBadRequest, errBody("code required"))
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	raid, err := insertRaid(ctx, a.pool, body.Code)
	if err != nil {
		fail(w, "insert raid", err)
		return
	}
	writeJSON(w, http.StatusCreated, raid)
}

func (a *App) findRaid(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	raid, err := raidByCode(ctx, a.pool, r.PathValue("code"))
	if isNotFound(err) {
		writeJSON(w, http.StatusNotFound, errBody("raid not found"))
		return
	}
	if err != nil {
		fail(w, "find raid", err)
		return
	}
	writeJSON(w, http.StatusOK, raid)
}

func (a *App) getMembers(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	members, err := listMembers(ctx, a.pool, r.PathValue("id"))
	if err != nil {
		fail(w, "list members", err)
		return
	}
	writeJSON(w, http.StatusOK, members)
}

func (a *App) putMember(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	var m Member
	if !decode(w, r, &m) {
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	if err := upsertMember(ctx, a.pool, r.PathValue("id"), m); err != nil {
		fail(w, "upsert member", err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (a *App) deleteMember(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	if err := removeMember(ctx, a.pool, r.PathValue("id"), r.PathValue("deviceId")); err != nil {
		fail(w, "remove member", err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (a *App) getNights(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	since := r.URL.Query().Get("since")
	if since == "" {
		since = "1970-01-01"
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	nights, err := listNights(ctx, a.pool, r.PathValue("id"), since)
	if err != nil {
		fail(w, "list nights", err)
		return
	}
	writeJSON(w, http.StatusOK, nights)
}

func (a *App) putNight(w http.ResponseWriter, r *http.Request) {
	if !a.ready(w) {
		return
	}
	var n Night
	if !decode(w, r, &n) {
		return
	}
	ctx, cancel := reqCtx(r)
	defer cancel()
	if err := upsertNight(ctx, a.pool, r.PathValue("id"), n); err != nil {
		fail(w, "upsert night", err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

// ready guards raid endpoints when no database is configured.
func (a *App) ready(w http.ResponseWriter) bool {
	if a.pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, errBody("database not configured"))
		return false
	}
	return true
}

func reqCtx(r *http.Request) (ctx context.Context, cancel context.CancelFunc) {
	return context.WithTimeout(r.Context(), 6*time.Second)
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeJSON(w, http.StatusBadRequest, errBody("invalid json body"))
		return false
	}
	return true
}

func fail(w http.ResponseWriter, what string, err error) {
	log.Printf("%s: %v", what, err)
	writeJSON(w, http.StatusInternalServerError, errBody("internal error"))
}

func errBody(msg string) map[string]string {
	return map[string]string{"error": msg}
}
