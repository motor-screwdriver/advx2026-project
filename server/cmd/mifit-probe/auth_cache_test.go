package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"eightbit-sleep-server/internal/mifit"
)

func TestAuthCacheRoundTripAndPermissions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nested", "auth.json")
	session := mifit.MiFitnessSession{
		Security: "c2VjcmV0", Cookies: "serviceToken=session-token",
	}
	if err := saveAuthCache(path, "cn", session); err != nil {
		t.Fatal(err)
	}
	info, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("permissions = %04o, want 0600", got)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(raw), "password") ||
		strings.Contains(string(raw), "verification_code") {
		t.Fatalf("forbidden credentials in cache: %s", raw)
	}
	cache, err := loadAuthCache(path, "cn")
	if err != nil {
		t.Fatal(err)
	}
	if cache.Session != session || cache.Provider != mifit.ProviderMiFitness {
		t.Fatalf("unexpected cache: %+v", cache)
	}
}

func TestAuthCacheCanBeReusedAcrossRegions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "auth.json")
	if err := saveAuthCache(path, "cn", mifit.MiFitnessSession{
		Security: "c2VjcmV0", Cookies: "serviceToken=session-token",
	}); err != nil {
		t.Fatal(err)
	}
	cache, err := loadAuthCache(path, "ru")
	if err != nil {
		t.Fatal(err)
	}
	if cache.Region != "cn" {
		t.Fatalf("saved region metadata changed: %q", cache.Region)
	}
}

func TestAuthCacheRejectsLoosePermissions(t *testing.T) {
	path := filepath.Join(t.TempDir(), "auth.json")
	if err := saveAuthCache(path, "cn", mifit.MiFitnessSession{
		Security: "c2VjcmV0", Cookies: "serviceToken=session-token",
	}); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := loadAuthCache(path, "cn"); err == nil {
		t.Fatal("expected insecure permissions error")
	}
}
