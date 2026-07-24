package mifit

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

// BeginEmailVerification requests a one-time code using the notification
// context returned by Xiaomi. It deliberately stays in the same cookie jar as
// Login; opening notificationURL in another browser loses that session.
func (c *MiFitnessClient) BeginEmailVerification(ctx context.Context) error {
	if c.verificationURL == "" {
		return wrap(KindAuth, "start Xiaomi email verification",
			errors.New("no pending verification"))
	}
	target, err := url.Parse(c.verificationURL)
	if err != nil || !c.allowedLoginLocation(target) {
		return wrap(KindDecode, "validate Xiaomi verification URL",
			errors.New("invalid verification URL"))
	}
	contextValue := target.Query().Get("context")
	if contextValue == "" {
		return wrap(KindDecode, "decode Xiaomi verification URL",
			errors.New("context is missing"))
	}
	if _, body, err := c.identityCall(ctx, http.MethodGet, target.String(), nil, nil, false); err != nil {
		return err
	} else if len(body) == 0 {
		// The page body is irrelevant, but reading it ensures cookies are stored.
	}

	common := url.Values{
		"sid": {"miothealth"}, "context": {contextValue}, "_locale": {"en_US"},
	}
	if _, _, err := c.identityCall(ctx, http.MethodGet,
		c.accountBase+"/identity/list", common, nil, false); err != nil {
		return err
	}
	query := cloneValues(common)
	query.Set("_dc", strconv.FormatInt(c.now().UnixMilli(), 10))
	query.Set("mask", "0")
	form := url.Values{
		"retry": {"0"}, "icode": {""}, "_json": {"true"},
		"ick": {c.accountCookie("ick")},
	}
	_, body, err := c.identityCall(ctx, http.MethodPost,
		c.accountBase+"/identity/auth/sendEmailTicket", query, form, false)
	if err != nil {
		return err
	}
	if err := identityResponseError("request Xiaomi email code", body); err != nil {
		return err
	}
	c.verificationContext = contextValue
	return nil
}

// CompleteEmailVerification exchanges the code sent by Xiaomi for ssecurity
// and the Health Cloud serviceToken. The code is never retained.
func (c *MiFitnessClient) CompleteEmailVerification(ctx context.Context, code string) error {
	if c.verificationContext == "" {
		return wrap(KindAuth, "complete Xiaomi email verification",
			errors.New("email verification was not started"))
	}
	if strings.TrimSpace(code) == "" {
		return wrap(KindConfig, "complete Xiaomi email verification",
			errors.New("verification code is required"))
	}
	query := url.Values{
		"_flag": {"8"}, "_json": {"true"}, "sid": {"miothealth"},
		"context": {c.verificationContext}, "mask": {"0"}, "_locale": {"en_US"},
	}
	form := url.Values{
		"_flag": {"8"}, "ticket": {strings.TrimSpace(code)}, "trust": {"false"},
		"_json": {"true"}, "ick": {c.accountCookie("ick")},
	}
	res, body, err := c.identityCall(ctx, http.MethodPost,
		c.accountBase+"/identity/auth/verifyEmail", query, form, true)
	if err != nil {
		return err
	}
	if err := identityResponseError("verify Xiaomi email code", body); err != nil {
		return err
	}
	finishLocation := identityLocation(res, body)
	if finishLocation == "" {
		finishLocation, err = c.verificationResult(ctx)
		if err != nil {
			return err
		}
	}
	endLocation, err := c.resolveVerificationEnd(ctx, finishLocation)
	if err != nil {
		return err
	}
	return c.exchangeVerificationEnd(ctx, endLocation)
}

func (c *MiFitnessClient) verificationResult(ctx context.Context) (string, error) {
	query := url.Values{
		"sid": {"miothealth"}, "context": {c.verificationContext}, "_locale": {"en_US"},
	}
	res, body, err := c.identityCall(ctx, http.MethodGet,
		c.accountBase+"/identity/result/check", query, nil, true)
	if err != nil {
		return "", err
	}
	location := identityLocation(res, body)
	if location == "" {
		return "", wrap(KindAuth, "finish Xiaomi email verification",
			errors.New("result location is missing"))
	}
	return location, nil
}

func (c *MiFitnessClient) resolveVerificationEnd(
	ctx context.Context, location string,
) (string, error) {
	target, err := c.resolveAccountURL(location)
	if err != nil {
		return "", err
	}
	if !strings.Contains(target.Path, "/identity/result/check") {
		return target.String(), nil
	}
	res, body, err := c.identityCall(ctx, http.MethodGet, target.String(), nil, nil, true)
	if err != nil {
		return "", err
	}
	end := identityLocation(res, body)
	if end == "" {
		return "", wrap(KindAuth, "finish Xiaomi email verification",
			errors.New("Auth2 end location is missing"))
	}
	resolved, err := c.resolveAccountURL(end)
	if err != nil {
		return "", err
	}
	return resolved.String(), nil
}

func (c *MiFitnessClient) exchangeVerificationEnd(ctx context.Context, location string) error {
	res, body, err := c.identityCall(ctx, http.MethodGet, location, nil, nil, true)
	if err != nil {
		return err
	}
	if res.StatusCode == http.StatusOK && bytes.Contains(body, []byte("Xiaomi Account - Tips")) {
		res, body, err = c.identityCall(ctx, http.MethodGet, location, nil, nil, true)
		if err != nil {
			return err
		}
	}
	var extension struct {
		Security string `json:"ssecurity"`
	}
	if err := json.Unmarshal([]byte(res.Header.Get("extension-pragma")), &extension); err != nil ||
		extension.Security == "" {
		return wrap(KindAuth, "finish Xiaomi email verification",
			errors.New("ssecurity header is missing"))
	}
	security, err := base64.StdEncoding.DecodeString(extension.Security)
	if err != nil {
		return wrap(KindDecode, "decode Xiaomi verification security", err)
	}
	stsLocation := res.Header.Get("Location")
	if stsLocation == "" {
		stsLocation = firstHTTPSURL(body)
	}
	if stsLocation == "" {
		return wrap(KindAuth, "finish Xiaomi email verification",
			errors.New("Health Cloud STS location is missing"))
	}
	stsTarget, err := c.resolveAccountURL(stsLocation)
	if err != nil {
		return err
	}
	c.security = security
	if err := c.finishLogin(ctx, stsTarget.String()); err != nil {
		return err
	}
	c.verificationURL, c.verificationContext = "", ""
	return nil
}
