package main

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// newPool opens a bounded connection pool to Postgres. A short connect
// deadline keeps a mis-configured DATABASE_URL from hanging startup.
func newPool(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 5

	dialCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	pool, err := pgxpool.NewWithConfig(dialCtx, cfg)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(dialCtx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

// migrate creates the raid tables if absent. Idempotent — safe on every boot.
func migrate(ctx context.Context, pool *pgxpool.Pool) error {
	const ddl = `
CREATE TABLE IF NOT EXISTS raids (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS raid_members (
  raid_id   uuid NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  hero_type text NOT NULL,
  hero_name text NOT NULL,
  hp        int  NOT NULL,
  PRIMARY KEY (raid_id, device_id)
);
CREATE TABLE IF NOT EXISTS night_results (
  device_id text NOT NULL,
  raid_id   uuid NOT NULL REFERENCES raids(id) ON DELETE CASCADE,
  date      date NOT NULL,
  score     int  NOT NULL,
  outcome   text NOT NULL,
  PRIMARY KEY (device_id, raid_id, date)
);`
	_, err := pool.Exec(ctx, ddl)
	return err
}
