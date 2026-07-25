package mifit

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

var identityResultURL = regexp.MustCompile(
	`https://account\.xiaomi\.com/identity/result/check\?[^"'\\\s<]+`,
)

func (c *MiFitnessClient) identityCall(
	ctx context.Context, method, rawURL string, query, form url.Values, noRedirect bool,
) (*http.Response, []byte, error) {
	target, err := c.resolveAccountURL(rawURL)
	if err != nil {
		return nil, nil, err
	}
	values := target.Query()
	for key, items := range query {
		for _, item := range items {
			values.Add(key, item)
		}
	}
	target.RawQuery = values.Encode()
	var requestBody io.Reader
	if form != nil {
		requestBody = strings.NewReader(form.Encode())
	}
	req, err := http.NewRequestWithContext(ctx, method, target.String(), requestBody)
	if err != nil {
		return nil, nil, wrap(KindConfig, "build Xiaomi identity request", err)
	}
	req.Header.Set("User-Agent", "Android-16-3.55.0i-8bit-sleep")
	if form != nil {
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	client := *c.http
	if noRedirect {
		client.CheckRedirect = func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		}
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, nil, wrap(KindTransport, "call Xiaomi identity", err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return nil, nil, wrap(KindTransport, "read Xiaomi identity response", err)
	}
	if res.StatusCode < 200 || res.StatusCode >= 400 {
		return nil, nil, httpStatusError("call Xiaomi identity", res.StatusCode)
	}
	return res, body, nil
}

func (c *MiFitnessClient) resolveAccountURL(raw string) (*url.URL, error) {
	target, err := url.Parse(raw)
	if err != nil {
		return nil, wrap(KindDecode, "parse Xiaomi identity URL", err)
	}
	if !target.IsAbs() {
		base, baseErr := url.Parse(c.accountBase)
		if baseErr != nil {
			return nil, wrap(KindConfig, "parse Xiaomi account base", baseErr)
		}
		target = base.ResolveReference(target)
	}
	if !c.allowedLoginLocation(target) {
		return nil, wrap(KindAuth, "validate Xiaomi identity URL",
			errors.New("non-Xiaomi location rejected"))
	}
	return target, nil
}

func (c *MiFitnessClient) accountCookie(name string) string {
	if c.http.Jar == nil {
		return ""
	}
	for _, raw := range []string{
		c.verificationURL,
		c.accountBase + "/identity/auth/sendEmailTicket",
		c.accountBase,
	} {
		target, err := url.Parse(raw)
		if err != nil {
			continue
		}
		for _, cookie := range c.http.Jar.Cookies(target) {
			if cookie.Name == name {
				return cookie.Value
			}
		}
	}
	return ""
}

func identityResponseError(op string, body []byte) error {
	trimmed := bytes.TrimSpace(body)
	trimmed = bytes.TrimPrefix(trimmed, []byte(xiaomiLoginPrefix))
	if len(trimmed) == 0 {
		return nil
	}
	var response struct {
		Code        int    `json:"code"`
		Description string `json:"description"`
	}
	if err := json.Unmarshal(trimmed, &response); err != nil {
		// verifyEmail is known to return an empty or HTML response in some
		// regions. The redirect/result endpoints are validated afterwards.
		return nil
	}
	if response.Code != 0 {
		return wrap(KindAuth, op,
			fmt.Errorf("Xiaomi rejected the request (code=%d description=%q)",
				response.Code, response.Description))
	}
	return nil
}

func identityLocation(res *http.Response, body []byte) string {
	if location := res.Header.Get("Location"); location != "" {
		return location
	}
	trimmed := bytes.TrimPrefix(bytes.TrimSpace(body), []byte(xiaomiLoginPrefix))
	var response struct {
		Location string `json:"location"`
	}
	if json.Unmarshal(trimmed, &response) == nil && response.Location != "" {
		return response.Location
	}
	return identityResultURL.FindString(string(body))
}

func firstHTTPSURL(body []byte) string {
	for _, field := range strings.Fields(string(body)) {
		candidate := strings.Trim(field, "\"'<>")
		if strings.HasPrefix(candidate, "https://") {
			return candidate
		}
	}
	return ""
}

func cloneValues(source url.Values) url.Values {
	result := make(url.Values, len(source))
	for key, values := range source {
		result[key] = append([]string(nil), values...)
	}
	return result
}
