package mifit

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMiFitnessEmailVerificationFlow(t *testing.T) {
	security := []byte("verified-health-security")
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/fe/service/identity/authStart":
			http.SetCookie(w, &http.Cookie{Name: "ick", Value: "identity-cookie"})
			_, _ = w.Write([]byte("identity page"))
		case "/identity/list":
			assertIdentityQuery(t, r, "test-context")
			_, _ = w.Write([]byte(`{"options":["email"]}`))
		case "/identity/auth/sendEmailTicket":
			assertIdentityQuery(t, r, "test-context")
			assertIdentityForm(t, r, map[string]string{
				"ick": "identity-cookie", "retry": "0",
			})
			_, _ = w.Write([]byte(`{"code":0,"description":"ok"}`))
		case "/identity/auth/verifyEmail":
			assertIdentityQuery(t, r, "test-context")
			assertIdentityForm(t, r, map[string]string{
				"ick": "identity-cookie", "ticket": "123456",
			})
			_ = json.NewEncoder(w).Encode(map[string]any{
				"code": 0, "location": server.URL + "/identity/result/check?done=1",
			})
		case "/identity/result/check":
			http.Redirect(w, r, server.URL+"/pass/serviceLoginAuth2/end", http.StatusFound)
		case "/pass/serviceLoginAuth2/end":
			extension, _ := json.Marshal(map[string]string{
				"ssecurity": base64.StdEncoding.EncodeToString(security),
			})
			w.Header().Set("extension-pragma", string(extension))
			http.Redirect(w, r, server.URL+"/sts", http.StatusFound)
		case "/sts":
			http.SetCookie(w, &http.Cookie{Name: "serviceToken", Value: "verified-token"})
			_, _ = w.Write([]byte("ok"))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: server.Client(),
		AccountBase: server.URL, HealthBase: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	client.verificationURL = server.URL +
		"/fe/service/identity/authStart?sid=miothealth&context=test-context"
	if err := client.BeginEmailVerification(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := client.CompleteEmailVerification(context.Background(), "123456"); err != nil {
		t.Fatal(err)
	}
	if string(client.security) != string(security) ||
		!strings.Contains(client.cookies, "serviceToken=verified-token") {
		t.Fatalf("verification credentials not installed: security=%q cookies=%q",
			client.security, client.cookies)
	}
	if client.verificationURL != "" || client.verificationContext != "" {
		t.Fatal("verification context was not cleared")
	}
}

func TestMiFitnessEmailVerificationRejectsForeignRedirect(t *testing.T) {
	client, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	client.verificationContext = "context"
	err = client.exchangeVerificationEnd(context.Background(), "https://example.com/end")
	if KindOf(err) != KindAuth {
		t.Fatalf("expected auth error, got %v", err)
	}
}

func TestMiFitnessVerificationErrorIsDetectable(t *testing.T) {
	err := wrap(KindAuth, "login", &VerificationRequiredError{})
	var target *VerificationRequiredError
	if !errors.As(err, &target) {
		t.Fatal("verification error must survive wrapping")
	}
}

func assertIdentityQuery(t *testing.T, r *http.Request, contextValue string) {
	t.Helper()
	if r.URL.Query().Get("sid") != "miothealth" ||
		r.URL.Query().Get("context") != contextValue {
		t.Errorf("unexpected identity query: %s", r.URL.RawQuery)
	}
}

func assertIdentityForm(t *testing.T, r *http.Request, expected map[string]string) {
	t.Helper()
	if err := r.ParseForm(); err != nil {
		t.Fatal(err)
	}
	for name, want := range expected {
		if got := r.Form.Get(name); got != want {
			t.Errorf("%s = %q, want %q", name, got, want)
		}
	}
}
