package mifit

import (
	"encoding/base64"
	"net/http"
	"net/url"
	"testing"
)

func TestRC4VectorAndRoundTrip(t *testing.T) {
	key := []byte("0123456789abcdef0123456789abcdef")
	plain := []byte(`{"key":"sleep"}`)
	encrypted, err := rc4Crypt(key, plain)
	if err != nil {
		t.Fatal(err)
	}
	if got := base64.StdEncoding.EncodeToString(encrypted); got != "5WPV1WqT7NU5pXFQSaz7" {
		t.Fatalf("unexpected vector: %s", got)
	}
	decrypted, err := rc4Crypt(key, encrypted)
	if err != nil {
		t.Fatal(err)
	}
	if string(decrypted) != string(plain) {
		t.Fatalf("round trip: got %q", decrypted)
	}
}

func TestSignatureVector(t *testing.T) {
	key := []byte("0123456789abcdef0123456789abcdef")
	values := url.Values{"data": {`{"key":"sleep"}`}}
	got := requestSignature(http.MethodPost, miFitnessAPIPath, values, key)
	if got != "mjHmnvcEw/WcXAwGrYNuQuxBlGI=" {
		t.Fatalf("unexpected signature: %s", got)
	}
}

func TestSignedNonceVector(t *testing.T) {
	got := base64.StdEncoding.EncodeToString(signedNonce([]byte("security"), []byte("nonce")))
	if got != "tNfoaeifqEL840oNVDy1wWxcSezI23TbtXCTt8FH1Rs=" {
		t.Fatalf("unexpected signed nonce: %s", got)
	}
}
