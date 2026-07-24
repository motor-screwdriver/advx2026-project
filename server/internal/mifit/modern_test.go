package mifit

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestMiFitnessPasswordLoginAndSleepRequest(t *testing.T) {
	security := []byte("0123456789abcdef0123456789abcdef")
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/pass/serviceLogin":
			if !strings.Contains(r.Header.Get("Cookie"), "userId=person@example.com") {
				t.Errorf("identity cookie missing: %q", r.Header.Get("Cookie"))
			}
			writeLoginJSON(t, w, map[string]any{
				"qs": "query", "_sign": "sign", "sid": "miothealth", "callback": "callback",
			})
		case "/pass/serviceLoginAuth2":
			assertPasswordForm(t, r)
			writeLoginJSON(t, w, map[string]any{
				"passToken": "pass-token",
				"ssecurity": base64.StdEncoding.EncodeToString(security),
				"userId":    42, "location": server.URL + "/sts",
			})
		case "/sts":
			http.SetCookie(w, &http.Cookie{Name: "serviceToken", Value: "service-token"})
			w.WriteHeader(http.StatusOK)
		case miFitnessAPIPath:
			if r.Header.Get("region_tag") != "cn" ||
				r.Header.Get("handleparams") != "true" {
				t.Errorf("missing Xiaomi routing headers: %v", r.Header)
			}
			params, key := decodeHealthRequest(t, r, security)
			if params["key"] != "sleep" {
				t.Errorf("key = %v", params["key"])
			}
			result := map[string]any{
				"data_list": []map[string]any{{
					"sid": "band", "time": 1761028800, "zone_offset": 10800,
					"zone_name": "Europe/Moscow",
					"value":     `{"bedtime":1761000000,"wake_up_time":1761028800,"duration":480}`,
				}},
				"has_more": false, "next_key": "",
			}
			writeHealthJSON(t, w, key, result)
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: server.Client(),
		AccountBase: server.URL, HealthBase: server.URL,
		Now: func() time.Time { return time.Unix(1_760_000_000, 0) },
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Login(context.Background(), "person@example.com", "secret"); err != nil {
		t.Fatal(err)
	}
	sessions, err := client.FetchSleep(context.Background(),
		time.Unix(1760900000, 0), time.Unix(1761100000, 0))
	if err != nil {
		t.Fatal(err)
	}
	if len(sessions) != 1 || sessions[0].ExternalID != "band_1761028800" {
		t.Fatalf("unexpected sessions: %+v", sessions)
	}
}

func TestMiFitnessTokenLogin(t *testing.T) {
	security := base64.StdEncoding.EncodeToString([]byte("0123456789abcdef"))
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/pass/serviceLogin":
			if got := r.Header.Get("Cookie"); !strings.Contains(got, "userId=42; passToken=token") {
				t.Errorf("cookie = %q", got)
			}
			writeLoginJSON(t, w, map[string]any{
				"passToken": "token", "ssecurity": security,
				"userId": 42, "location": server.URL + "/sts",
			})
		case "/sts":
			http.SetCookie(w, &http.Cookie{Name: "serviceToken", Value: "service"})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: server.Client(), AccountBase: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	if err := client.LoginWithToken(context.Background(), "42", "token"); err != nil {
		t.Fatal(err)
	}
}

func TestMiFitnessRejectsRepeatedCursor(t *testing.T) {
	security := []byte("0123456789abcdef")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, key := decodeHealthRequest(t, r, security)
		writeHealthJSON(t, w, key, map[string]any{
			"data_list": []any{}, "has_more": true, "next_key": "same",
		})
	}))
	defer server.Close()
	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: server.Client(), HealthBase: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	client.security, client.cookies = security, "serviceToken=test"
	_, err = client.FetchSleep(context.Background(), time.Unix(1, 0), time.Unix(2, 0))
	if KindOf(err) != KindDecode || !strings.Contains(err.Error(), "repeated next_key") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestMiFitnessTimeoutDoesNotExposePassword(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		time.Sleep(50 * time.Millisecond)
	}))
	defer server.Close()
	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: &http.Client{Timeout: 5 * time.Millisecond},
		AccountBase: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	err = client.Login(context.Background(), "person@example.com", "never-log-me")
	if KindOf(err) != KindTransport {
		t.Fatalf("expected transport error, got %v", err)
	}
	if strings.Contains(err.Error(), "never-log-me") {
		t.Fatalf("password leaked in error: %v", err)
	}
}

func assertPasswordForm(t *testing.T, r *http.Request) {
	t.Helper()
	if err := r.ParseForm(); err != nil {
		t.Error(err)
		return
	}
	if r.Form.Get("user") != "person@example.com" ||
		r.Form.Get("hash") != "5EBE2294ECD0E0F08EAB7690D2A6EE69" {
		t.Errorf("unexpected login form: user=%q hash=%q",
			r.Form.Get("user"), r.Form.Get("hash"))
	}
	if !strings.Contains(r.Header.Get("Cookie"), "deviceId=") {
		t.Errorf("device cookie missing")
	}
}

func decodeHealthRequest(t *testing.T, r *http.Request, security []byte) (map[string]any, []byte) {
	t.Helper()
	if r.Header.Get("Cookie") == "" {
		t.Errorf("session cookie missing")
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		t.Fatal(err)
	}
	form, err := url.ParseQuery(string(body))
	if err != nil {
		t.Fatal(err)
	}
	nonce, err := base64.StdEncoding.DecodeString(form.Get("_nonce"))
	if err != nil {
		t.Fatal(err)
	}
	key := signedNonce(security, nonce)
	if got, want := form.Get("signature"), requestSignature(http.MethodPost, r.URL.Path, form, key); got != want {
		t.Errorf("signature mismatch: got %q want %q", got, want)
	}
	plain := url.Values{}
	for _, name := range []string{"data", "rc4_hash__"} {
		raw, decodeErr := base64.StdEncoding.DecodeString(form.Get(name))
		if decodeErr != nil {
			t.Fatal(decodeErr)
		}
		value, cryptErr := rc4Crypt(key, raw)
		if cryptErr != nil {
			t.Fatal(cryptErr)
		}
		plain.Set(name, string(value))
	}
	hashInput := url.Values{"data": {plain.Get("data")}}
	if got, want := plain.Get("rc4_hash__"), requestSignature(http.MethodPost, r.URL.Path, hashInput, key); got != want {
		t.Errorf("rc4 hash mismatch: got %q want %q", got, want)
	}
	var params map[string]any
	if err := json.Unmarshal([]byte(plain.Get("data")), &params); err != nil {
		t.Fatal(err)
	}
	return params, key
}

func writeLoginJSON(t *testing.T, w http.ResponseWriter, value any) {
	t.Helper()
	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write(append([]byte(xiaomiLoginPrefix), raw...))
}

func writeHealthJSON(t *testing.T, w http.ResponseWriter, key []byte, result any) {
	t.Helper()
	raw, err := json.Marshal(map[string]any{
		"code": 0, "message": "ok", "result": result,
	})
	if err != nil {
		t.Fatal(err)
	}
	encrypted, err := rc4Crypt(key, raw)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = w.Write([]byte(base64.StdEncoding.EncodeToString(encrypted)))
}
