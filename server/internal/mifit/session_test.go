package mifit

import (
	"strings"
	"testing"
)

func TestMiFitnessSessionRoundTrip(t *testing.T) {
	source, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	source.security = []byte("session-security")
	source.cookies = "serviceToken=secret-token"
	session, err := source.ExportSession()
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(session.Security, "session-security") {
		t.Fatal("security should be base64 encoded")
	}

	target, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	if err := target.RestoreSession(session); err != nil {
		t.Fatal(err)
	}
	if string(target.security) != "session-security" ||
		target.cookies != "serviceToken=secret-token" {
		t.Fatalf("unexpected restored session: %+v", target)
	}
}

func TestMiFitnessSessionRejectsCookieNewline(t *testing.T) {
	client, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	err = client.RestoreSession(MiFitnessSession{
		Security: "c2VjcmV0", Cookies: "serviceToken=ok\nInjected=value",
	})
	if KindOf(err) != KindConfig {
		t.Fatalf("expected config error, got %v", err)
	}
}
