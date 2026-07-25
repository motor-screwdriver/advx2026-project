package mifit

import (
	"encoding/base64"
	"errors"
	"strings"
)

// MiFitnessSession is the minimum reusable Health Cloud authorization state.
// It contains secrets equivalent to a login session, but never a password or
// an email verification code.
type MiFitnessSession struct {
	Security string `json:"security"`
	Cookies  string `json:"cookies"`
}

// ExportSession returns authorization state suitable for a local 0600 cache.
func (c *MiFitnessClient) ExportSession() (MiFitnessSession, error) {
	if len(c.security) == 0 || c.cookies == "" {
		return MiFitnessSession{}, wrap(KindAuth, "export Mi Fitness session",
			errors.New("client is not authenticated"))
	}
	return MiFitnessSession{
		Security: base64.StdEncoding.EncodeToString(c.security),
		Cookies:  c.cookies,
	}, nil
}

// RestoreSession installs previously exported authorization state.
func (c *MiFitnessClient) RestoreSession(session MiFitnessSession) error {
	if session.Security == "" || session.Cookies == "" {
		return wrap(KindConfig, "restore Mi Fitness session",
			errors.New("security or cookies are missing"))
	}
	if strings.ContainsAny(session.Cookies, "\r\n") {
		return wrap(KindConfig, "restore Mi Fitness session",
			errors.New("invalid cookie data"))
	}
	security, err := base64.StdEncoding.DecodeString(session.Security)
	if err != nil || len(security) == 0 {
		return wrap(KindConfig, "restore Mi Fitness session",
			errors.New("invalid security data"))
	}
	c.security, c.cookies = security, session.Cookies
	return nil
}
