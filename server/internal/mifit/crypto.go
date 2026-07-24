package mifit

import (
	"crypto/rand"
	"crypto/rc4"  // Xiaomi's wire protocol requires RC4; it is not used for storage.
	"crypto/sha1" // #nosec G505 -- protocol compatibility, not password hashing.
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"net/url"
	"time"
)

func generateNonce(now time.Time) ([]byte, error) {
	nonce := make([]byte, 12)
	if _, err := rand.Read(nonce[:8]); err != nil {
		return nil, err
	}
	binary.BigEndian.PutUint32(nonce[8:], uint32(now.Unix()/60))
	return nonce, nil
}

func signedNonce(security, nonce []byte) []byte {
	sum := sha256.New()
	_, _ = sum.Write(security)
	_, _ = sum.Write(nonce)
	return sum.Sum(nil)
}

// rc4Crypt drops the first 1024 keystream bytes, matching Mi Fitness.
func rc4Crypt(key, payload []byte) ([]byte, error) {
	cipher, err := rc4.NewCipher(key) // #nosec G503 -- required by Xiaomi.
	if err != nil {
		return nil, err
	}
	discard := make([]byte, 1024)
	cipher.XORKeyStream(discard, discard)
	out := make([]byte, len(payload))
	cipher.XORKeyStream(out, payload)
	return out, nil
}

func requestSignature(method, path string, values url.Values, nonce []byte) string {
	source := fmt.Sprintf("%s&%s&data=%s", method, path, values.Get("data"))
	if values.Has("rc4_hash__") {
		source += "&rc4_hash__=" + values.Get("rc4_hash__")
	}
	source += "&" + base64.StdEncoding.EncodeToString(nonce)
	sum := sha1.Sum([]byte(source)) // #nosec G505 -- Xiaomi protocol signature.
	return base64.StdEncoding.EncodeToString(sum[:])
}
