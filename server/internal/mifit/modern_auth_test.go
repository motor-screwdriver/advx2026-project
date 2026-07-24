package mifit

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"testing"
)

func TestMiFitnessLoginLocationValidation(t *testing.T) {
	client, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	allowed, _ := url.Parse("https://sts.api.io.mi.com/sts")
	blocked, _ := url.Parse("https://example.com/steal")
	if !client.allowedLoginLocation(allowed) {
		t.Fatal("Xiaomi STS location should be allowed")
	}
	if client.allowedLoginLocation(blocked) {
		t.Fatal("non-Xiaomi login location should be rejected")
	}
}

func TestMiFitnessReportsEmailVerification(t *testing.T) {
	client, err := NewMiFitness(MiFitnessConfig{Region: "cn"})
	if err != nil {
		t.Fatal(err)
	}
	raw := json.RawMessage(`{
		"code":0,
		"description":"成功",
		"securityStatus":1,
		"notificationUrl":"https://account.xiaomi.com/pass/auth/security/notification?id=123"
	}`)
	err = client.acceptLogin(context.Background(), raw)
	var verification *VerificationRequiredError
	if KindOf(err) != KindAuth || !errors.As(err, &verification) {
		t.Fatalf("unexpected challenge error: %v", err)
	}
	if client.verificationURL == "" {
		t.Fatal("verification URL was not retained")
	}
}
