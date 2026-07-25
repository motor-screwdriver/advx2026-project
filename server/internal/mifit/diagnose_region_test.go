package mifit

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestDiagnoseSleepRegionReturnsMetadataOnly(t *testing.T) {
	security := []byte("0123456789abcdef")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		params, key := decodeHealthRequest(t, r, security)
		if params["key"] != "sleep" {
			t.Errorf("key = %v", params["key"])
		}
		writeHealthJSON(t, w, key, map[string]any{
			"data_list": []map[string]any{
				{"value": `{"private":"must-not-be-returned"}`},
				{"value": `{"private":"must-not-be-returned"}`},
			},
			"has_more": true, "next_key": "secret-cursor",
		})
	}))
	defer server.Close()

	client, err := NewMiFitness(MiFitnessConfig{
		Region: "cn", HTTPClient: server.Client(), HealthBase: server.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	client.security, client.cookies = security, "serviceToken=test"
	result := client.diagnoseSleepRegion(
		context.Background(), "cn", server.URL, time.Unix(1, 0), time.Unix(2, 0),
	)
	if result.Region != "cn" || result.Count == nil || *result.Count != 2 ||
		!result.HasMore || result.Error != "" {
		t.Fatalf("unexpected diagnostic: %+v", result)
	}
}
