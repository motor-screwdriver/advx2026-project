package mifit

import (
	"bytes"
	"context"
	"crypto/md5" // #nosec G501 -- Xiaomi login protocol requires uppercase MD5.
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"sort"
	"strings"
	"time"
)

const (
	xiaomiAccountBase = "https://account.xiaomi.com"
	xiaomiLoginPrefix = "&&&START&&&"
	miFitnessAPIPath  = "/app/v1/data/get_fitness_data_by_time"
)

type MiFitnessConfig struct {
	Region      string
	HTTPClient  *http.Client
	AccountBase string // test override
	HealthBase  string // test override
	Now         func() time.Time
}

type MiFitnessClient struct {
	http                *http.Client
	accountBase         string
	healthBase          string
	region              string
	now                 func() time.Time
	userID              int64
	passToken           string
	security            []byte
	cookies             string
	deviceID            string
	verificationURL     string
	verificationContext string
}

func NewMiFitness(config MiFitnessConfig) (*MiFitnessClient, error) {
	region := strings.ToLower(config.Region)
	if region == "" {
		region = "cn"
	}
	healthBase, err := miFitnessBaseURL(region)
	if err != nil {
		return nil, err
	}
	if config.HealthBase != "" {
		healthBase = strings.TrimRight(config.HealthBase, "/")
	}
	client := config.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
	clientCopy := *client
	if clientCopy.Jar == nil {
		clientCopy.Jar, _ = cookiejar.New(nil)
	}
	accountBase := config.AccountBase
	if accountBase == "" {
		accountBase = xiaomiAccountBase
	}
	now := config.Now
	if now == nil {
		now = time.Now
	}
	return &MiFitnessClient{
		http: &clientCopy, accountBase: strings.TrimRight(accountBase, "/"),
		healthBase: healthBase, region: region, now: now, deviceID: randomDeviceID(16),
	}, nil
}

func (c *MiFitnessClient) Name() string { return ProviderMiFitness }

// Login exchanges email/password for session credentials. The password is
// only used to build this request and is never retained by the client.
func (c *MiFitnessClient) Login(ctx context.Context, username, password string) error {
	if username == "" || password == "" {
		return wrap(KindConfig, "xiaomi login", errors.New("username and password are required"))
	}
	identityCookie := "userId=" + username
	first, err := c.loginStart(ctx, identityCookie)
	if err != nil {
		return err
	}
	hash := fmt.Sprintf("%X", md5.Sum([]byte(password)))
	form := url.Values{
		"_json": {"true"}, "hash": {hash}, "sid": {first.SID},
		"callback": {first.Callback}, "_sign": {first.Sign},
		"qs": {first.QS}, "user": {username},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.accountBase+"/pass/serviceLoginAuth2", strings.NewReader(form.Encode()))
	if err != nil {
		return wrap(KindConfig, "xiaomi login request", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Cookie", c.accountCookies(identityCookie))
	req.Header.Set("User-Agent", "Android-16-3.55.0i-8bit-sleep")
	payload, err := c.doLogin(req)
	if err != nil {
		return err
	}
	return c.acceptLogin(ctx, payload)
}

// LoginWithToken avoids password login when Xiaomi requires a browser
// challenge. userID/passToken can be obtained from an account.xiaomi.com
// browser session and must be treated as secrets.
func (c *MiFitnessClient) LoginWithToken(ctx context.Context, userID, passToken string) error {
	if userID == "" || passToken == "" {
		return wrap(KindConfig, "xiaomi token login",
			errors.New("user id and pass token are required"))
	}
	payload, err := c.loginStart(ctx, "userId="+userID+"; passToken="+passToken)
	if err != nil {
		return err
	}
	return c.acceptLogin(ctx, payload.raw)
}

func (c *MiFitnessClient) FetchSleep(
	ctx context.Context, from, to time.Time,
) ([]SleepSession, error) {
	if len(c.security) == 0 || c.cookies == "" {
		return nil, wrap(KindAuth, "fetch Mi Fitness sleep", errors.New("not authenticated"))
	}
	if to.Before(from) {
		return nil, wrap(KindConfig, "fetch Mi Fitness sleep", errors.New("invalid date range"))
	}
	var items []modernDataItem
	nextKey := ""
	seen := map[string]bool{}
	for page := 0; page < 100; page++ {
		params := map[string]any{
			"start_time": from.Unix(), "end_time": to.Unix(), "key": "sleep",
		}
		if nextKey != "" {
			params["next_key"] = nextKey
		}
		var result modernPage
		if err := c.request(ctx, miFitnessAPIPath, params, &result); err != nil {
			return nil, err
		}
		items = append(items, result.DataList...)
		if !result.HasMore || result.NextKey == "" {
			sessions, err := parseModernSleep(items)
			sort.Slice(sessions, func(i, j int) bool { return sessions[i].Start.Before(sessions[j].Start) })
			return sessions, err
		}
		if seen[result.NextKey] {
			return nil, wrap(KindDecode, "paginate Mi Fitness sleep",
				errors.New("repeated next_key"))
		}
		seen[result.NextKey] = true
		nextKey = result.NextKey
	}
	return nil, wrap(KindDecode, "paginate Mi Fitness sleep", errors.New("page limit exceeded"))
}

type loginStart struct {
	QS       string `json:"qs"`
	Sign     string `json:"_sign"`
	SID      string `json:"sid"`
	Callback string `json:"callback"`
	raw      json.RawMessage
}

func (c *MiFitnessClient) loginStart(ctx context.Context, cookie string) (*loginStart, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		c.accountBase+"/pass/serviceLogin?_json=true&sid=miothealth", nil)
	if err != nil {
		return nil, wrap(KindConfig, "start Xiaomi login", err)
	}
	if cookie != "" {
		req.Header.Set("Cookie", c.accountCookies(cookie))
	}
	req.Header.Set("User-Agent", "Android-16-3.55.0i-8bit-sleep")
	raw, err := c.doLogin(req)
	if err != nil {
		return nil, err
	}
	var result loginStart
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, wrap(KindDecode, "decode Xiaomi login", err)
	}
	result.raw = raw
	return &result, nil
}

func (c *MiFitnessClient) doLogin(req *http.Request) (json.RawMessage, error) {
	res, err := c.http.Do(req)
	if err != nil {
		return nil, wrap(KindTransport, "call Xiaomi account", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, httpStatusError("call Xiaomi account", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if err != nil {
		return nil, wrap(KindTransport, "read Xiaomi login", err)
	}
	if !bytes.HasPrefix(body, []byte(xiaomiLoginPrefix)) {
		return nil, wrap(KindDecode, "decode Xiaomi login",
			errors.New("unexpected response prefix"))
	}
	return body[len(xiaomiLoginPrefix):], nil
}
