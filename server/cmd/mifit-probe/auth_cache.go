package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

const authCacheVersion = 1

type authCacheFile struct {
	Version  int                    `json:"version"`
	Provider string                 `json:"provider"`
	Region   string                 `json:"region"`
	SavedAt  time.Time              `json:"saved_at"`
	Session  mifit.MiFitnessSession `json:"session"`
}

func resolveAuthCache(opts options) (string, bool, error) {
	if opts.noAuthCache {
		return "", false, nil
	}
	if opts.authCache != "" {
		return filepath.Clean(opts.authCache), true, nil
	}
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", false, &mifit.Error{
			Kind: mifit.KindConfig, Op: "locate Xiaomi session cache", Err: err,
		}
	}
	return filepath.Join(configDir, "8bit-sleep", "mifit-auth.json"), true, nil
}

func loadAuthCache(path, _ string) (authCacheFile, error) {
	file, err := os.Open(path)
	if err != nil {
		return authCacheFile{}, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return authCacheFile{}, err
	}
	if !info.Mode().IsRegular() {
		return authCacheFile{}, errors.New("authorization cache is not a regular file")
	}
	if info.Mode().Perm()&0o077 != 0 {
		return authCacheFile{}, fmt.Errorf(
			"authorization cache permissions are %04o, expected 0600",
			info.Mode().Perm(),
		)
	}
	var cache authCacheFile
	decoder := json.NewDecoder(io.LimitReader(file, 64<<10))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&cache); err != nil {
		return authCacheFile{}, fmt.Errorf("decode authorization cache: %w", err)
	}
	if cache.Version != authCacheVersion ||
		cache.Provider != mifit.ProviderMiFitness {
		return authCacheFile{}, errors.New("unsupported authorization cache format")
	}
	return cache, nil
}

func saveAuthCache(path, region string, session mifit.MiFitnessSession) error {
	cache := authCacheFile{
		Version: authCacheVersion, Provider: mifit.ProviderMiFitness,
		Region: strings.ToLower(region), SavedAt: time.Now().UTC(), Session: session,
	}
	data, err := json.MarshalIndent(cache, "", "  ")
	if err != nil {
		return fmt.Errorf("encode authorization cache: %w", err)
	}
	data = append(data, '\n')
	directory := filepath.Dir(path)
	if err := os.MkdirAll(directory, 0o700); err != nil {
		return fmt.Errorf("create authorization cache directory: %w", err)
	}
	temp, err := os.CreateTemp(directory, ".mifit-auth-*")
	if err != nil {
		return fmt.Errorf("create temporary authorization cache: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)
	if err := temp.Chmod(0o600); err != nil {
		_ = temp.Close()
		return fmt.Errorf("protect authorization cache: %w", err)
	}
	if _, err := temp.Write(data); err != nil {
		_ = temp.Close()
		return fmt.Errorf("write authorization cache: %w", err)
	}
	if err := temp.Sync(); err != nil {
		_ = temp.Close()
		return fmt.Errorf("sync authorization cache: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("close authorization cache: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("install authorization cache: %w", err)
	}
	return os.Chmod(path, 0o600)
}
