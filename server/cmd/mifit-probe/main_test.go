package main

import (
	"errors"
	"testing"
	"time"

	"eightbit-sleep-server/internal/mifit"
)

func TestDateRangeDefaultsToFourteenCalendarDays(t *testing.T) {
	location, err := time.LoadLocation("Europe/Moscow")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 7, 24, 15, 0, 0, 0, location)
	from, to, err := dateRange(options{}, location, now)
	if err != nil {
		t.Fatal(err)
	}
	if got := from.Format(time.RFC3339); got != "2026-07-11T00:00:00+03:00" {
		t.Fatalf("from = %s", got)
	}
	if got := to.Format(time.RFC3339); got != "2026-07-24T23:59:59+03:00" {
		t.Fatalf("to = %s", got)
	}
}

func TestDateRangeRejectsReverseRange(t *testing.T) {
	_, _, err := dateRange(options{
		from: "2026-07-24", to: "2026-07-20",
	}, time.UTC, time.Now())
	if err == nil {
		t.Fatal("expected range error")
	}
}

func TestExitCodesFollowErrorKind(t *testing.T) {
	cases := []struct {
		kind mifit.ErrorKind
		want int
	}{
		{mifit.KindConfig, exitConfig},
		{mifit.KindAuth, exitAuth},
		{mifit.KindTransport, exitTransport},
		{mifit.KindDecode, exitDecode},
	}
	for _, test := range cases {
		err := &mifit.Error{Kind: test.kind, Op: "test", Err: errors.New("failure")}
		if got := exitFor(err); got != test.want {
			t.Fatalf("kind %d: got %d want %d", test.kind, got, test.want)
		}
	}
}
