package mifit

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strings"
)

type loginCredentials struct {
	PassToken      string `json:"passToken"`
	Security       string `json:"ssecurity"`
	UserID         int64  `json:"userId"`
	Location       string `json:"location"`
	Code           int    `json:"code"`
	Description    string `json:"description"`
	ShortDesc      string `json:"desc"`
	Result         string `json:"result"`
	Captcha        string `json:"captchaUrl"`
	Notification   string `json:"notificationUrl"`
	SecurityStatus int    `json:"securityStatus"`
}

// VerificationRequiredError means Xiaomi accepted the password but requires
// an email confirmation before it will issue Health Cloud credentials.
type VerificationRequiredError struct{}

func (*VerificationRequiredError) Error() string {
	return "email verification required"
}

func (c *MiFitnessClient) acceptLogin(ctx context.Context, raw json.RawMessage) error {
	var auth loginCredentials
	if err := json.Unmarshal(raw, &auth); err != nil {
		return wrap(KindDecode, "decode Xiaomi credentials", err)
	}
	if auth.PassToken == "" || auth.Security == "" || auth.UserID == 0 || auth.Location == "" {
		challengeURL := auth.Notification
		if challengeURL == "" {
			challengeURL = auth.Captcha
		}
		if c.allowedChallengeURL(challengeURL) {
			if auth.Notification != "" {
				c.verificationURL = challengeURL
				return wrap(KindAuth, "Xiaomi authentication", &VerificationRequiredError{})
			}
			return wrap(KindAuth, "Xiaomi authentication",
				errors.New("captcha verification required; this probe supports email verification only"))
		}
		description := auth.Description
		if description == "" {
			description = auth.ShortDesc
		}
		var fields map[string]json.RawMessage
		_ = json.Unmarshal(raw, &fields)
		keys := make([]string, 0, len(fields))
		for key := range fields {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		return wrap(KindAuth, "Xiaomi authentication", fmt.Errorf(
			"session credentials missing (code=%d result=%q securityStatus=%d description=%q fields=%s)",
			auth.Code, auth.Result, auth.SecurityStatus, description, strings.Join(keys, ",")))
	}
	security, err := base64.StdEncoding.DecodeString(auth.Security)
	if err != nil {
		return wrap(KindDecode, "decode Xiaomi security", err)
	}
	c.passToken, c.security, c.userID = auth.PassToken, security, auth.UserID
	return c.finishLogin(ctx, auth.Location)
}

func (c *MiFitnessClient) accountCookies(extra string) string {
	parts := []string{
		"sdkVersion=accountsdk-18.8.15",
		"deviceId=" + c.deviceID,
	}
	if extra != "" {
		parts = append(parts, extra)
	}
	return strings.Join(parts, "; ")
}

func (c *MiFitnessClient) allowedChallengeURL(raw string) bool {
	target, err := url.Parse(raw)
	return err == nil && raw != "" && c.allowedLoginLocation(target)
}
