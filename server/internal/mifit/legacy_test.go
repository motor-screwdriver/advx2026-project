package mifit

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHuamiLegacyLoginAndSleepRequest(t *testing.T) {
	const start = int64(1_700_000_000)
	summary, err := json.Marshal(map[string]any{
		"tz": 10800,
		"slp": map[string]any{
			"st": start, "ed": start + 450*60, "dp": 180, "lt": 240,
			"stage": []map[string]any{
				{"start": 1430, "stop": 10, "mode": 4},
				{"start": 10, "end": 70, "mode": 5},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasPrefix(r.URL.Path, "/registrations/"):
			if err := r.ParseForm(); err != nil {
				t.Error(err)
			}
			if r.Form.Get("password") != "legacy-secret" ||
				r.Form.Get("client_id") != "HuaMi" {
				t.Errorf("unexpected auth form")
			}
			w.Header().Set("Location",
				server.URL+"/callback?access=access-token&country_code=CN")
			w.WriteHeader(http.StatusFound)
		case r.URL.Path == "/v2/client/login":
			if err := r.ParseForm(); err != nil {
				t.Error(err)
			}
			if r.Form.Get("app_name") != "com.xiaomi.hm.health" ||
				r.Form.Get("code") != "access-token" ||
				r.Form.Get("country_code") != "CN" {
				t.Errorf("unexpected credential form: %v", r.Form)
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"token_info": map[string]any{
					"app_token": "app-token", "user_id": 77,
				},
			})
		case r.URL.Path == "/v1/data/band_data.json":
			if r.Header.Get("apptoken") != "app-token" ||
				r.URL.Query().Get("userid") != "77" ||
				r.URL.Query().Get("query_type") != "summary" {
				t.Errorf("unexpected data request")
			}
			_ = json.NewEncoder(w).Encode(map[string]any{
				"data": []map[string]any{{
					"date_time": "2026-07-23",
					"summary":   base64.StdEncoding.EncodeToString(summary),
				}},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	client := NewHuamiLegacy(HuamiLegacyConfig{
		HTTPClient: server.Client(), AuthBase: server.URL,
		AccountBase: server.URL, DataBase: server.URL,
	})
	if err := client.Login(context.Background(), "person@example.com", "legacy-secret"); err != nil {
		t.Fatal(err)
	}
	sessions, err := client.FetchSleep(context.Background(),
		time.Date(2026, 7, 20, 0, 0, 0, 0, time.UTC),
		time.Date(2026, 7, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatal(err)
	}
	if len(sessions) != 1 {
		t.Fatalf("sessions: %d", len(sessions))
	}
	got := sessions[0]
	if got.Provider != ProviderHuamiLegacy || got.DurationMinutes != 420 ||
		got.AwakeMinutes != 30 || got.UTCOffsetSeconds != 10800 {
		t.Fatalf("unexpected session: %+v", got)
	}
	if len(got.Stages) != 2 || got.Stages[0].Minutes != 20 ||
		got.Stages[1].Name != "deep" {
		t.Fatalf("unexpected stages: %+v", got.Stages)
	}
}

func TestHuamiLegacyMalformedSummary(t *testing.T) {
	_, _, err := parseLegacyDay("2026-07-23", "not-base64")
	if err == nil {
		t.Fatal("expected base64 error")
	}
}

func TestHuamiLegacyDayWithoutSleep(t *testing.T) {
	raw := base64.StdEncoding.EncodeToString([]byte(`{"tz":10800,"stp":{"ttl":42}}`))
	_, ok, err := parseLegacyDay("2026-07-23", raw)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("step-only day must not become a sleep session")
	}
}

func TestHuamiLegacyMissingRedirectToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Location", serverSafeLocation("/callback?country_code=CN"))
		w.WriteHeader(http.StatusFound)
	}))
	defer server.Close()
	client := NewHuamiLegacy(HuamiLegacyConfig{
		HTTPClient: server.Client(), AuthBase: server.URL,
	})
	err := client.Login(context.Background(), "person@example.com", "secret")
	if KindOf(err) != KindAuth {
		t.Fatalf("expected auth error, got %v", err)
	}
}

// A syntactically valid absolute URL is enough for the missing-token branch.
func serverSafeLocation(path string) string {
	return "https://example.invalid" + path
}
