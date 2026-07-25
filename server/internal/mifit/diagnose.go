package mifit

import (
	"context"
	"time"
)

// MiFitnessDiagnostic contains only response metadata, never health values or
// authorization secrets. It is intended for reverse-API troubleshooting.
type MiFitnessDiagnostic struct {
	Endpoint string `json:"endpoint"`
	Key      string `json:"key"`
	Count    int    `json:"count"`
	HasMore  bool   `json:"has_more,omitempty"`
	Error    string `json:"error,omitempty"`
}

// MiFitnessRegionDiagnostic contains only per-IDC response metadata.
type MiFitnessRegionDiagnostic struct {
	Region  string `json:"region"`
	BaseURL string `json:"base_url"`
	Count   *int   `json:"count,omitempty"`
	HasMore bool   `json:"has_more,omitempty"`
	Error   string `json:"error,omitempty"`
}

// DiagnoseSleepRegions makes one sleep request to every supported Mi Fitness
// IDC. Xiaomi Account country does not reliably identify the data region.
func (c *MiFitnessClient) DiagnoseSleepRegions(
	ctx context.Context, from, to time.Time,
) []MiFitnessRegionDiagnostic {
	regions := []string{"cn", "de", "i2", "ru", "sg", "us"}
	results := make([]MiFitnessRegionDiagnostic, 0, len(regions))
	for _, region := range regions {
		baseURL, _ := miFitnessBaseURL(region)
		requestCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
		result := c.diagnoseSleepRegion(requestCtx, region, baseURL, from, to)
		cancel()
		results = append(results, result)
	}
	return results
}

func (c *MiFitnessClient) diagnoseSleepRegion(
	ctx context.Context, region, baseURL string, from, to time.Time,
) MiFitnessRegionDiagnostic {
	probe := *c
	probe.region, probe.healthBase = region, baseURL
	var page modernPage
	err := probe.request(ctx, miFitnessAPIPath, map[string]any{
		"start_time": from.Unix(), "end_time": to.Unix(), "key": "sleep",
	}, &page)
	result := MiFitnessRegionDiagnostic{Region: region, BaseURL: baseURL}
	if err != nil {
		result.Error = err.Error()
		return result
	}
	count := len(page.DataList)
	result.Count, result.HasMore = &count, page.HasMore
	return result
}

// DiagnoseSleepSources compares the raw fitness endpoint with likely
// aggregated endpoints. Unknown routes are reported rather than treated as a
// successful sleep export.
func (c *MiFitnessClient) DiagnoseSleepSources(
	ctx context.Context, from, to time.Time,
) []MiFitnessDiagnostic {
	type probe struct {
		path   string
		key    string
		params map[string]any
	}
	base := map[string]any{
		"start_time": from.Unix(), "end_time": to.Unix(),
	}
	makeParams := func(key string, aggregated bool) map[string]any {
		params := make(map[string]any, len(base)+3)
		for name, value := range base {
			params[name] = value
		}
		params["key"] = key
		if aggregated {
			params["tag"], params["limit"] = "daily_report", 90
		}
		return params
	}
	probes := []probe{
		{miFitnessAPIPath, "sleep", makeParams("sleep", false)},
		{miFitnessAPIPath, "steps", makeParams("steps", false)},
		{miFitnessAPIPath, "heart_rate", makeParams("heart_rate", false)},
		{"/app/v1/data/get_aggregated_data_by_time", "sleep", makeParams("sleep", true)},
		{"/app/v1/data/get_aggregated_data", "sleep", makeParams("sleep", true)},
	}
	results := make([]MiFitnessDiagnostic, 0, len(probes))
	for _, candidate := range probes {
		var page modernPage
		err := c.request(ctx, candidate.path, candidate.params, &page)
		result := MiFitnessDiagnostic{
			Endpoint: candidate.path, Key: candidate.key,
			Count: len(page.DataList), HasMore: page.HasMore,
		}
		if err != nil {
			result.Error = err.Error()
		}
		results = append(results, result)
	}
	return results
}
