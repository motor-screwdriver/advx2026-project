package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

const (
	exitOK        = 0
	exitConfig    = 2
	exitAuth      = 3
	exitTransport = 4
	exitDecode    = 5
	exitNoSleep   = 6
)

type options struct {
	provider     string
	region       string
	from         string
	to           string
	timezone     string
	jsonOutput   bool
	requireSleep bool
	authCache    string
	reauth       bool
	noAuthCache  bool
	diagnose     bool
}

func main() {
	os.Exit(run())
}

func run() int {
	opts := parseFlags()
	location, err := time.LoadLocation(opts.timezone)
	if err != nil {
		return fail(exitConfig, fmt.Errorf("invalid timezone: %w", err))
	}
	from, to, err := dateRange(opts, location, time.Now())
	if err != nil {
		return fail(exitConfig, err)
	}
	httpClient := newProbeHTTPClient()
	provider, cached, err := authenticate(context.Background(), opts, httpClient)
	if err != nil {
		return fail(exitFor(err), err)
	}
	requestBudget := 100 * time.Second
	if opts.diagnose {
		requestBudget = 2 * time.Minute
	}
	ctx, cancel := context.WithTimeout(context.Background(), requestBudget)
	defer cancel()
	if opts.diagnose {
		client, ok := provider.(*mifit.MiFitnessClient)
		if !ok {
			return fail(exitConfig, errors.New("--diagnose supports only mifitness"))
		}
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(client.DiagnoseSleepSources(ctx, from, to)); err != nil {
			return fail(exitDecode, err)
		}
		return exitOK
	}
	sessions, err := provider.FetchSleep(ctx, from, to)
	if err != nil {
		if cached && mifit.KindOf(err) == mifit.KindAuth {
			err = fmt.Errorf("%w; saved session expired, rerun with --reauth", err)
		}
		return fail(exitFor(err), err)
	}
	for index := range sessions {
		sessions[index].Start = sessions[index].Start.In(location)
		sessions[index].End = sessions[index].End.In(location)
	}
	if len(sessions) == 0 && opts.requireSleep {
		return fail(exitNoSleep, errors.New("API returned no sleep sessions"))
	}
	if err := printSessions(provider.Name(), sessions, opts.jsonOutput); err != nil {
		return fail(exitDecode, err)
	}
	return exitOK
}

func parseFlags() options {
	var opts options
	flag.StringVar(&opts.provider, "provider", mifit.ProviderMiFitness,
		"mifitness or huami-legacy")
	flag.StringVar(&opts.region, "region", "cn",
		"Mi Fitness data region: cn, de, i2, ru, sg, or us")
	flag.StringVar(&opts.from, "from", "", "first date, YYYY-MM-DD (default: 13 days ago)")
	flag.StringVar(&opts.to, "to", "", "last date, YYYY-MM-DD (default: today)")
	flag.StringVar(&opts.timezone, "timezone", "Europe/Moscow", "IANA timezone for date boundaries")
	flag.BoolVar(&opts.jsonOutput, "json", false, "print normalized JSON")
	flag.BoolVar(&opts.requireSleep, "require-sleep", false,
		"exit 6 when the API returns no sleep")
	flag.StringVar(&opts.authCache, "auth-cache", os.Getenv("MIFIT_AUTH_CACHE"),
		"authorization cache file (default: user config directory)")
	flag.BoolVar(&opts.reauth, "reauth", false,
		"ignore the saved session and authenticate again")
	flag.BoolVar(&opts.noAuthCache, "no-auth-cache", false,
		"do not load or save Xiaomi authorization")
	flag.BoolVar(&opts.diagnose, "diagnose", false,
		"print safe Mi Fitness endpoint counts without health values")
	flag.Parse()
	return opts
}

func dateRange(opts options, location *time.Location, now time.Time) (time.Time, time.Time, error) {
	today := now.In(location)
	toDate := opts.to
	if toDate == "" {
		toDate = today.Format("2006-01-02")
	}
	fromDate := opts.from
	if fromDate == "" {
		fromDate = today.AddDate(0, 0, -13).Format("2006-01-02")
	}
	from, err := time.ParseInLocation("2006-01-02", fromDate, location)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid --from: %w", err)
	}
	toDay, err := time.ParseInLocation("2006-01-02", toDate, location)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid --to: %w", err)
	}
	to := toDay.AddDate(0, 0, 1).Add(-time.Second)
	if to.Before(from) {
		return time.Time{}, time.Time{}, errors.New("--to must not be before --from")
	}
	return from, to, nil
}

func printSessions(provider string, sessions []mifit.SleepSession, asJSON bool) error {
	if asJSON {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(sessions)
	}
	fmt.Printf("provider=%s sessions=%d\n", provider, len(sessions))
	if provider == mifit.ProviderHuamiLegacy {
		fmt.Println("warning: huami-legacy reads Zepp Life/Mi Fit, not modern Mi Fitness")
	}
	for _, session := range sessions {
		score := "-"
		if session.Score != nil {
			score = fmt.Sprint(*session.Score)
		}
		fmt.Printf("%s  %s -> %s  sleep=%dmin awake=%dmin score=%s nap=%t\n",
			session.ExternalID, session.Start.Format(time.RFC3339),
			session.End.Format(time.RFC3339), session.DurationMinutes,
			session.AwakeMinutes, score, session.IsNap)
	}
	return nil
}

func exitFor(err error) int {
	switch mifit.KindOf(err) {
	case mifit.KindConfig:
		return exitConfig
	case mifit.KindAuth:
		return exitAuth
	case mifit.KindDecode:
		return exitDecode
	default:
		return exitTransport
	}
}

func fail(code int, err error) int {
	fmt.Fprintln(os.Stderr, "error:", err)
	return code
}
