package mifit

import (
	"encoding/json"
	"testing"
	"time"
)

func TestParseModernSleepVariants(t *testing.T) {
	value := `{
		"device_bedtime":"1761000000",
		"out_bed_timestamp":1761028800,
		"duration":470,
		"sleep_awake_duration":10,
		"sleep_score":0,
		"is_nap":false,
		"items":[
			{"start_time":1761000000,"end_time":1761003600,"state":1},
			{"start_time":1761003600,"end_time":1761007200,"state":5},
			{"start_time":1761007200,"end_time":1761007500,"state":4}
		]
	}`
	sessions, err := parseModernSleep([]modernDataItem{{
		SID: "band", Time: 1761028800, Value: json.RawMessage(strconvQuote(value)),
		ZoneOffset: 3 * 3600, ZoneName: "Europe/Moscow",
	}})
	if err != nil {
		t.Fatal(err)
	}
	if len(sessions) != 1 {
		t.Fatalf("sessions: %d", len(sessions))
	}
	got := sessions[0]
	if got.DurationMinutes != 470 || got.AwakeMinutes != 10 || got.Score == nil || *got.Score != 0 {
		t.Fatalf("unexpected summary: %+v", got)
	}
	if got.Start.Format(time.RFC3339) != "2025-10-21T01:40:00+03:00" {
		t.Fatalf("unexpected start: %s", got.Start.Format(time.RFC3339))
	}
	if len(got.Stages) != 3 || got.Stages[0].Name != "deep" ||
		got.Stages[1].Name != "rem" || got.Stages[2].Name != "awake" {
		t.Fatalf("unexpected stages: %+v", got.Stages)
	}
}

func TestParseModernObjectAndFallbacks(t *testing.T) {
	value := json.RawMessage(`{
		"bed_timestamp":1761000000,
		"wake_up_time":1761028800,
		"isNap":"true"
	}`)
	sessions, err := parseModernSleep([]modernDataItem{{
		Time: 1761028800, Value: value, ZoneOffset: -5 * 3600,
	}})
	if err != nil {
		t.Fatal(err)
	}
	if sessions[0].DurationMinutes != 480 || !sessions[0].IsNap {
		t.Fatalf("unexpected session: %+v", sessions[0])
	}
	if sessions[0].Timezone != "UTC-05:00" {
		t.Fatalf("unexpected timezone: %s", sessions[0].Timezone)
	}
}

func TestParseModernMalformedValue(t *testing.T) {
	_, err := parseModernSleep([]modernDataItem{
		{Time: 1, Value: json.RawMessage(`"{bad json"`)},
	})
	if KindOf(err) != KindDecode {
		t.Fatalf("expected decode error, got %v", err)
	}
}

func strconvQuote(value string) string {
	raw, _ := json.Marshal(value)
	return string(raw)
}
