// Package mifit contains diagnostic clients for Xiaomi Mi Fitness and the
// legacy Huami/Zepp Life API. It deliberately has no dependency on the HTTP
// server so the probe can later be reused behind authenticated endpoints.
package mifit

import (
	"context"
	"time"
)

const (
	ProviderMiFitness   = "mifitness"
	ProviderHuamiLegacy = "huami-legacy"
)

// SleepStage is one summarized phase in a sleep session.
type SleepStage struct {
	Name    string `json:"name"`
	Minutes int    `json:"minutes"`
}

// SleepSession is the provider-neutral result consumed by the probe and,
// after the spike is validated, by the application's backend.
type SleepSession struct {
	Provider         string       `json:"provider"`
	ExternalID       string       `json:"external_id"`
	Start            time.Time    `json:"start"`
	End              time.Time    `json:"end"`
	DurationMinutes  int          `json:"duration_minutes"`
	AwakeMinutes     int          `json:"awake_minutes"`
	Score            *int         `json:"score,omitempty"`
	IsNap            bool         `json:"is_nap"`
	Timezone         string       `json:"timezone"`
	UTCOffsetSeconds int          `json:"utc_offset_seconds"`
	Stages           []SleepStage `json:"stages,omitempty"`
}

// Provider is the common read-only surface implemented by both APIs.
type Provider interface {
	Name() string
	FetchSleep(context.Context, time.Time, time.Time) ([]SleepSession, error)
}
