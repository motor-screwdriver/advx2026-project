package mifit

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"sort"
	"strings"
)

func (c *MiFitnessClient) finishLogin(ctx context.Context, location string) error {
	target, err := url.Parse(location)
	if err != nil || !c.allowedLoginLocation(target) {
		return wrap(KindDecode, "validate Xiaomi login location",
			errors.New("invalid location"))
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		return wrap(KindConfig, "finish Xiaomi login", err)
	}
	client := *c.http
	client.CheckRedirect = func(req *http.Request, via []*http.Request) error {
		if len(via) >= 10 {
			return errors.New("too many Xiaomi STS redirects")
		}
		if !c.allowedLoginLocation(req.URL) {
			return errors.New("non-Xiaomi STS redirect rejected")
		}
		return nil
	}
	res, err := client.Do(req)
	if err != nil {
		return wrap(KindTransport, "finish Xiaomi login", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 400 {
		return httpStatusError("finish Xiaomi login", res.StatusCode)
	}
	cookieValues := map[string]string{}
	addCookies := func(items []*http.Cookie) {
		for _, cookie := range items {
			cookieValues[cookie.Name] = cookie.Value
		}
	}
	addCookies(res.Cookies())
	if c.http.Jar != nil {
		addCookies(c.http.Jar.Cookies(target))
		addCookies(c.http.Jar.Cookies(res.Request.URL))
		if healthURL, parseErr := url.Parse(c.healthBase); parseErr == nil {
			addCookies(c.http.Jar.Cookies(healthURL))
		}
	}
	if len(cookieValues) == 0 {
		return wrap(KindAuth, "finish Xiaomi login", errors.New("session cookies missing"))
	}
	cookies := make([]string, 0, len(cookieValues))
	for name, value := range cookieValues {
		cookies = append(cookies, name+"="+value)
	}
	sort.Strings(cookies)
	c.cookies = strings.Join(cookies, "; ")
	return nil
}

func (c *MiFitnessClient) allowedLoginLocation(target *url.URL) bool {
	if target.Scheme == "https" {
		host := strings.ToLower(target.Hostname())
		return host == "xiaomi.com" || strings.HasSuffix(host, ".xiaomi.com") ||
			host == "mi.com" || strings.HasSuffix(host, ".mi.com")
	}
	// Plain HTTP exists only for an injected local httptest account endpoint.
	account, err := url.Parse(c.accountBase)
	return err == nil && account.Scheme == "http" && target.Scheme == "http" &&
		account.Host == target.Host
}

func (c *MiFitnessClient) request(
	ctx context.Context, path string, params any, destination any,
) error {
	// "data" is the compact JSON payload understood by Xiaomi Health Cloud.
	data, err := json.Marshal(params)
	if err != nil {
		return wrap(KindConfig, "encode Mi Fitness request", err)
	}
	// The random nonce is combined with the login response's ssecurity. That
	// derived key signs, encrypts, and later decrypts this one request only.
	nonce, err := generateNonce(c.now())
	if err != nil {
		return wrap(KindConfig, "generate Mi Fitness nonce", err)
	}
	key := signedNonce(c.security, nonce)
	plain := url.Values{"data": {string(data)}}
	// rc4_hash__ signs plaintext before either form field is encrypted.
	plain.Set("rc4_hash__", requestSignature(http.MethodPost, path, plain, key))
	encrypted := make(url.Values, len(plain)+2)
	// Xiaomi expects data and rc4_hash__ independently RC4-encrypted/base64'd.
	for name, values := range plain {
		ciphertext, cryptErr := rc4Crypt(key, []byte(values[0]))
		if cryptErr != nil {
			return wrap(KindConfig, "encrypt Mi Fitness request", cryptErr)
		}
		encrypted.Set(name, base64.StdEncoding.EncodeToString(ciphertext))
	}
	// signature covers the encrypted fields; _nonce lets Xiaomi derive the
	// same per-request key. All three values are regular URL-encoded fields.
	encrypted.Set("signature", requestSignature(http.MethodPost, path, encrypted, key))
	encrypted.Set("_nonce", base64.StdEncoding.EncodeToString(nonce))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.healthBase+path,
		strings.NewReader(encrypted.Encode()))
	if err != nil {
		return wrap(KindConfig, "build Mi Fitness request", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Cookie", c.cookies)
	req.Header.Set("User-Agent", "Android-12-3.53.1-vivo-V2284A")
	req.Header.Set("region_tag", c.region)
	req.Header.Set("handleparams", "true")
	res, err := c.doHealthRequest(req)
	if err != nil {
		return wrap(KindTransport, "call Mi Fitness", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return httpStatusError("call Mi Fitness", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 8<<20))
	if err != nil {
		return wrap(KindTransport, "read Mi Fitness response", err)
	}
	ciphertext, err := base64.StdEncoding.DecodeString(strings.TrimSpace(string(body)))
	if err != nil {
		return wrap(KindDecode, "decode Mi Fitness base64", err)
	}
	plaintext, err := rc4Crypt(key, ciphertext)
	if err != nil {
		return wrap(KindDecode, "decrypt Mi Fitness response", err)
	}
	return decodeMiFitnessEnvelope(plaintext, destination)
}

func (c *MiFitnessClient) doHealthRequest(req *http.Request) (*http.Response, error) {
	res, err := c.http.Do(req)
	if err == nil || req.Context().Err() != nil || !retryableHealthError(err) ||
		req.GetBody == nil {
		return res, err
	}
	body, bodyErr := req.GetBody()
	if bodyErr != nil {
		return nil, err
	}
	retry := req.Clone(req.Context())
	retry.Body = body
	return c.http.Do(retry)
}

func retryableHealthError(err error) bool {
	var networkError net.Error
	return errors.As(err, &networkError) &&
		(networkError.Timeout() || networkError.Temporary())
}

func decodeMiFitnessEnvelope(plaintext []byte, destination any) error {
	var envelope struct {
		Code    int             `json:"code"`
		Message string          `json:"message"`
		Result  json.RawMessage `json:"result"`
	}
	if err := json.Unmarshal(plaintext, &envelope); err != nil {
		return wrap(KindDecode, "decode Mi Fitness response", err)
	}
	if envelope.Code != 0 {
		kind := KindTransport
		message := strings.ToLower(envelope.Message)
		if strings.Contains(message, "auth") || strings.Contains(message, "session") ||
			envelope.Code == -10001 {
			kind = KindAuth
		}
		return wrap(kind, "Mi Fitness API",
			fmt.Errorf("code %d: %s", envelope.Code, envelope.Message))
	}
	if err := json.Unmarshal(envelope.Result, destination); err != nil {
		return wrap(KindDecode, "decode Mi Fitness result", err)
	}
	return nil
}

func miFitnessBaseURL(region string) (string, error) {
	switch strings.ToLower(region) {
	case "", "cn":
		return "https://hlth.io.mi.com", nil
	case "de", "i2", "ru", "sg", "us":
		return "https://" + strings.ToLower(region) + ".hlth.io.mi.com", nil
	default:
		return "", wrap(KindConfig, "configure Mi Fitness",
			fmt.Errorf("unsupported region %q (use cn, de, i2, ru, sg, or us)", region))
	}
}

func randomDeviceID(length int) string {
	const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	raw := make([]byte, length)
	if _, err := rand.Read(raw); err != nil {
		return strings.Repeat("0", length)
	}
	for i := range raw {
		raw[i] = alphabet[int(raw[i])%len(alphabet)]
	}
	return string(raw)
}

func httpStatusError(op string, status int) error {
	kind := KindTransport
	if status == http.StatusUnauthorized || status == http.StatusForbidden {
		kind = KindAuth
	}
	return wrap(kind, op, fmt.Errorf("HTTP %d", status))
}

type modernPage struct {
	DataList []modernDataItem `json:"data_list"`
	HasMore  bool             `json:"has_more"`
	NextKey  string           `json:"next_key"`
}

type modernDataItem struct {
	SID        string          `json:"sid"`
	Time       int64           `json:"time"`
	Value      json.RawMessage `json:"value"`
	ZoneOffset int             `json:"zone_offset"`
	ZoneName   string          `json:"zone_name"`
}
