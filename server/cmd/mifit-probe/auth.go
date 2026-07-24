package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"eightbit-sleep-server/internal/mifit"
	"golang.org/x/term"
)

func newProbeHTTPClient() *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.DialContext = (&net.Dialer{
		Timeout: 20 * time.Second, KeepAlive: 30 * time.Second,
	}).DialContext
	transport.TLSHandshakeTimeout = 30 * time.Second
	transport.ResponseHeaderTimeout = 30 * time.Second
	return &http.Client{Transport: transport, Timeout: 45 * time.Second}
}

func authenticate(
	ctx context.Context, opts options, httpClient *http.Client,
) (mifit.Provider, bool, error) {
	switch opts.provider {
	case mifit.ProviderMiFitness:
		return authenticateMiFitness(ctx, opts, httpClient)
	case mifit.ProviderHuamiLegacy:
		client := mifit.NewHuamiLegacy(mifit.HuamiLegacyConfig{HTTPClient: httpClient})
		email, err := textSecret("MIFIT_LEGACY_EMAIL", "Zepp Life email: ", false)
		if err != nil {
			return nil, false, err
		}
		password, err := textSecret("MIFIT_LEGACY_PASSWORD", "Zepp Life password: ", true)
		if err != nil {
			return nil, false, err
		}
		return client, false, client.Login(ctx, email, password)
	default:
		return nil, false, &mifit.Error{Kind: mifit.KindConfig, Op: "select provider",
			Err: fmt.Errorf("unsupported provider %q", opts.provider)}
	}
}

func authenticateMiFitness(
	ctx context.Context, opts options, httpClient *http.Client,
) (*mifit.MiFitnessClient, bool, error) {
	client, err := mifit.NewMiFitness(mifit.MiFitnessConfig{
		Region: opts.region, HTTPClient: httpClient,
	})
	if err != nil {
		return nil, false, err
	}
	cachePath, cacheEnabled, err := resolveAuthCache(opts)
	if err != nil {
		return client, false, err
	}
	if cacheEnabled && !opts.reauth {
		cache, loadErr := loadAuthCache(cachePath, opts.region)
		switch {
		case loadErr == nil:
			if err := client.RestoreSession(cache.Session); err != nil {
				return client, false, err
			}
			fmt.Fprintf(os.Stderr, "Using saved Xiaomi session: %s\n", cachePath)
			return client, true, nil
		case !errors.Is(loadErr, os.ErrNotExist):
			return client, false, &mifit.Error{
				Kind: mifit.KindConfig, Op: "load Xiaomi session",
				Err: fmt.Errorf("%w; rerun with --reauth to replace it", loadErr),
			}
		}
	}

	if err := loginMiFitness(ctx, client); err != nil {
		return client, false, err
	}
	if cacheEnabled {
		session, exportErr := client.ExportSession()
		if exportErr != nil {
			return client, false, exportErr
		}
		if saveErr := saveAuthCache(cachePath, opts.region, session); saveErr != nil {
			return client, false, &mifit.Error{
				Kind: mifit.KindConfig, Op: "save Xiaomi session", Err: saveErr,
			}
		}
		fmt.Fprintf(os.Stderr, "Saved Xiaomi session: %s\n", cachePath)
	}
	return client, false, nil
}

func loginMiFitness(ctx context.Context, client *mifit.MiFitnessClient) error {
	userID, passToken := os.Getenv("MIFIT_USER_ID"), os.Getenv("MIFIT_PASS_TOKEN")
	if userID != "" || passToken != "" {
		return client.LoginWithToken(ctx, userID, passToken)
	}
	username, err := textSecret("MIFIT_USERNAME", "Xiaomi login: ", false)
	if err != nil {
		return err
	}
	password, err := textSecret("MIFIT_PASSWORD", "Xiaomi password: ", true)
	if err != nil {
		return err
	}
	if err := client.Login(ctx, username, password); err != nil {
		var verification *mifit.VerificationRequiredError
		if !errors.As(err, &verification) {
			return err
		}
		fmt.Fprintln(os.Stderr,
			"Xiaomi requires email verification; requesting a one-time code...")
		if err := client.BeginEmailVerification(ctx); err != nil {
			return err
		}
		code, codeErr := textSecret(
			"MIFIT_VERIFICATION_CODE", "Xiaomi email code: ", false,
		)
		if codeErr != nil {
			return codeErr
		}
		return client.CompleteEmailVerification(ctx, code)
	}
	return nil
}

func textSecret(envName, prompt string, hidden bool) (string, error) {
	if value := os.Getenv(envName); value != "" {
		return value, nil
	}
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		return "", &mifit.Error{Kind: mifit.KindConfig, Op: "read credentials",
			Err: fmt.Errorf("%s is required in non-interactive mode", envName)}
	}
	fmt.Fprint(os.Stderr, prompt)
	if hidden {
		value, err := term.ReadPassword(fd)
		fmt.Fprintln(os.Stderr)
		if err != nil {
			return "", &mifit.Error{Kind: mifit.KindConfig, Op: "read hidden credential", Err: err}
		}
		return strings.TrimSpace(string(value)), nil
	}
	value, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil {
		return "", &mifit.Error{Kind: mifit.KindConfig, Op: "read credential", Err: err}
	}
	return strings.TrimSpace(value), nil
}
