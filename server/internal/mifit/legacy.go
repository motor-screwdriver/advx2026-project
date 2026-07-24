package mifit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

const (
	huamiAuthBase    = "https://api-user.huami.com"
	huamiAccountBase = "https://account.huami.com"
	huamiDataBase    = "https://api-mifit.huami.com"
)

type HuamiLegacyConfig struct {
	HTTPClient  *http.Client
	AuthBase    string // test override
	AccountBase string // test override
	DataBase    string // test override
}

type HuamiLegacyClient struct {
	http        *http.Client
	authBase    string
	accountBase string
	dataBase    string
	appToken    string
	userID      string
}

func NewHuamiLegacy(config HuamiLegacyConfig) *HuamiLegacyClient {
	client := config.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 30 * time.Second}
	}
	return &HuamiLegacyClient{
		http:        client,
		authBase:    valueOr(config.AuthBase, huamiAuthBase),
		accountBase: valueOr(config.AccountBase, huamiAccountBase),
		dataBase:    valueOr(config.DataBase, huamiDataBase),
	}
}

func (c *HuamiLegacyClient) Name() string { return ProviderHuamiLegacy }

// Login reproduces micw/hacking-mifit-api. It targets Mi Fit/Zepp Life,
// not the modern com.xiaomi.wearable Mi Fitness application.
func (c *HuamiLegacyClient) Login(ctx context.Context, email, password string) error {
	if email == "" || password == "" {
		return wrap(KindConfig, "Huami login", errors.New("email and password are required"))
	}
	form := url.Values{
		"state": {"REDIRECTION"}, "client_id": {"HuaMi"},
		"redirect_uri": {"https://s3-us-west-2.amazonws.com/hm-registration/successsignin.html"},
		"token":        {"access"}, "password": {password},
	}
	endpoint := c.authBase + "/registrations/" + url.PathEscape(email) + "/tokens"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint,
		strings.NewReader(form.Encode()))
	if err != nil {
		return wrap(KindConfig, "build Huami token request", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := *c.http
	client.CheckRedirect = func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	}
	res, err := client.Do(req)
	if err != nil {
		return wrap(KindTransport, "request Huami access token", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 400 {
		return httpStatusError("request Huami access token", res.StatusCode)
	}
	location, err := url.Parse(res.Header.Get("Location"))
	if err != nil || location.RawQuery == "" {
		return wrap(KindDecode, "decode Huami access token", errors.New("redirect missing"))
	}
	access := location.Query().Get("access")
	country := location.Query().Get("country_code")
	if access == "" || country == "" {
		return wrap(KindAuth, "Huami authentication",
			errors.New("access or country_code missing"))
	}
	return c.exchangeAccessToken(ctx, access, country)
}

func (c *HuamiLegacyClient) exchangeAccessToken(
	ctx context.Context, access, country string,
) error {
	form := url.Values{
		"app_name": {"com.xiaomi.hm.health"},
		"dn": {"account.huami.com,api-user.huami.com,api-watch.huami.com," +
			"api-analytics.huami.com,app-analytics.huami.com,api-mifit.huami.com"},
		"device_id": {"02:00:00:00:00:00"}, "device_model": {"android_phone"},
		"app_version": {"4.0.9"}, "allow_registration": {"false"},
		"third_name": {"huami"}, "grant_type": {"access_token"},
		"country_code": {country}, "code": {access},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		c.accountBase+"/v2/client/login", strings.NewReader(form.Encode()))
	if err != nil {
		return wrap(KindConfig, "build Huami credential request", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := c.http.Do(req)
	if err != nil {
		return wrap(KindTransport, "request Huami credentials", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return httpStatusError("request Huami credentials", res.StatusCode)
	}
	var response struct {
		TokenInfo struct {
			AppToken string      `json:"app_token"`
			UserID   json.Number `json:"user_id"`
		} `json:"token_info"`
		Error string `json:"error"`
	}
	decoder := json.NewDecoder(io.LimitReader(res.Body, 1<<20))
	decoder.UseNumber()
	if err := decoder.Decode(&response); err != nil {
		return wrap(KindDecode, "decode Huami credentials", err)
	}
	c.appToken = response.TokenInfo.AppToken
	c.userID = response.TokenInfo.UserID.String()
	if c.appToken == "" || c.userID == "" {
		message := "app token or user id missing"
		if response.Error != "" {
			message = response.Error
		}
		return wrap(KindAuth, "Huami authentication", errors.New(message))
	}
	return nil
}

func (c *HuamiLegacyClient) FetchSleep(
	ctx context.Context, from, to time.Time,
) ([]SleepSession, error) {
	if c.appToken == "" || c.userID == "" {
		return nil, wrap(KindAuth, "fetch Huami sleep", errors.New("not authenticated"))
	}
	if to.Before(from) {
		return nil, wrap(KindConfig, "fetch Huami sleep", errors.New("invalid date range"))
	}
	query := url.Values{
		"query_type": {"summary"}, "device_type": {"android_phone"},
		"userid": {c.userID}, "from_date": {from.Format("2006-01-02")},
		"to_date": {to.Format("2006-01-02")},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		c.dataBase+"/v1/data/band_data.json?"+query.Encode(), nil)
	if err != nil {
		return nil, wrap(KindConfig, "build Huami data request", err)
	}
	req.Header.Set("apptoken", c.appToken)
	res, err := c.http.Do(req)
	if err != nil {
		return nil, wrap(KindTransport, "call Huami data API", err)
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, httpStatusError("call Huami data API", res.StatusCode)
	}
	var response struct {
		Data []struct {
			Date    string `json:"date_time"`
			Summary string `json:"summary"`
		} `json:"data"`
	}
	if err := json.NewDecoder(io.LimitReader(res.Body, 8<<20)).Decode(&response); err != nil {
		return nil, wrap(KindDecode, "decode Huami data response", err)
	}
	sessions := make([]SleepSession, 0, len(response.Data))
	for index, day := range response.Data {
		session, ok, err := parseLegacyDay(day.Date, day.Summary)
		if err != nil {
			return nil, wrap(KindDecode, "decode Huami sleep",
				fmt.Errorf("day %d: %w", index, err))
		}
		if ok {
			sessions = append(sessions, session)
		}
	}
	sort.Slice(sessions, func(i, j int) bool { return sessions[i].Start.Before(sessions[j].Start) })
	return sessions, nil
}

func valueOr(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return strings.TrimRight(value, "/")
}
