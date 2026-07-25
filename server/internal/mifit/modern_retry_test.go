package mifit

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestMiFitnessRetriesOneHealthTimeout(t *testing.T) {
	security := []byte("0123456789abcdef")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, key := decodeHealthRequest(t, r, security)
		writeHealthJSON(t, w, key, map[string]any{
			"data_list": []any{}, "has_more": false, "next_key": "",
		})
	}))
	defer server.Close()
	baseTransport := server.Client().Transport
	flaky := &timeoutOnceTransport{next: baseTransport}
	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HealthBase: server.URL,
		HTTPClient: &http.Client{Transport: flaky, Timeout: time.Second},
	})
	if err != nil {
		t.Fatal(err)
	}
	client.security, client.cookies = security, "serviceToken=test"
	sessions, err := client.FetchSleep(
		context.Background(), time.Unix(1, 0), time.Unix(2, 0),
	)
	if err != nil {
		t.Fatal(err)
	}
	if len(sessions) != 0 || flaky.calls != 2 {
		t.Fatalf("sessions=%d calls=%d", len(sessions), flaky.calls)
	}
}

type timeoutOnceTransport struct {
	next  http.RoundTripper
	calls int
}

func (t *timeoutOnceTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	t.calls++
	if t.calls == 1 {
		return nil, &net.DNSError{Err: "TLS handshake timeout", IsTimeout: true}
	}
	return t.next.RoundTrip(req)
}
