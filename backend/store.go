package main

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Raid mirrors the raids table; dates are rendered as text for the JSON client.
type Raid struct {
	ID        string `json:"id"`
	Code      string `json:"code"`
	CreatedAt string `json:"created_at"`
}

// Member is one hero in a raid (raid_members row).
type Member struct {
	DeviceID string `json:"device_id"`
	HeroType string `json:"hero_type"`
	HeroName string `json:"hero_name"`
	HP       int    `json:"hp"`
}

// Night is one player's last-night result shared with the raid.
type Night struct {
	DeviceID string `json:"device_id"`
	Date     string `json:"date"`
	Score    int    `json:"score"`
	Outcome  string `json:"outcome"`
}

func insertRaid(ctx context.Context, pool *pgxpool.Pool, code string) (Raid, error) {
	var r Raid
	err := pool.QueryRow(ctx,
		`INSERT INTO raids (code) VALUES ($1)
		 RETURNING id, code, created_at::text`, code).
		Scan(&r.ID, &r.Code, &r.CreatedAt)
	return r, err
}

func raidByCode(ctx context.Context, pool *pgxpool.Pool, code string) (Raid, error) {
	var r Raid
	err := pool.QueryRow(ctx,
		`SELECT id, code, created_at::text FROM raids WHERE code = $1`, code).
		Scan(&r.ID, &r.Code, &r.CreatedAt)
	return r, err
}

func listMembers(ctx context.Context, pool *pgxpool.Pool, raidID string) ([]Member, error) {
	rows, err := pool.Query(ctx,
		`SELECT device_id, hero_type, hero_name, hp
		 FROM raid_members WHERE raid_id = $1 ORDER BY device_id`, raidID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	members := []Member{}
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.DeviceID, &m.HeroType, &m.HeroName, &m.HP); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func upsertMember(ctx context.Context, pool *pgxpool.Pool, raidID string, m Member) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO raid_members (raid_id, device_id, hero_type, hero_name, hp)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (raid_id, device_id) DO UPDATE
		 SET hero_type = EXCLUDED.hero_type,
		     hero_name = EXCLUDED.hero_name,
		     hp        = EXCLUDED.hp`,
		raidID, m.DeviceID, m.HeroType, m.HeroName, m.HP)
	return err
}

func removeMember(ctx context.Context, pool *pgxpool.Pool, raidID, deviceID string) error {
	_, err := pool.Exec(ctx,
		`DELETE FROM raid_members WHERE raid_id = $1 AND device_id = $2`,
		raidID, deviceID)
	return err
}

func listNights(ctx context.Context, pool *pgxpool.Pool, raidID, since string) ([]Night, error) {
	rows, err := pool.Query(ctx,
		`SELECT device_id, date::text, score, outcome
		 FROM night_results
		 WHERE raid_id = $1 AND date > $2::date
		 ORDER BY date DESC`, raidID, since)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	nights := []Night{}
	for rows.Next() {
		var n Night
		if err := rows.Scan(&n.DeviceID, &n.Date, &n.Score, &n.Outcome); err != nil {
			return nil, err
		}
		nights = append(nights, n)
	}
	return nights, rows.Err()
}

func upsertNight(ctx context.Context, pool *pgxpool.Pool, raidID string, n Night) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO night_results (raid_id, device_id, date, score, outcome)
		 VALUES ($1, $2, $3::date, $4, $5)
		 ON CONFLICT (device_id, raid_id, date) DO UPDATE
		 SET score = EXCLUDED.score, outcome = EXCLUDED.outcome`,
		raidID, n.DeviceID, n.Date, n.Score, n.Outcome)
	return err
}

// isNotFound reports whether an error is pgx's "no rows" sentinel.
func isNotFound(err error) bool {
	return err == pgx.ErrNoRows
}
