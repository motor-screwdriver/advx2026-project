# 8bit Sleep

A pixel-art tamagotchi (Soul Knight style) where your hero stays alive only while
**you** sleep. 7 hearts = 7 days of the week. Bad nights deal damage; 0 HP = death
with one resurrection attempt per 7 days. A perfect week = level up + loot chest.

## Stack

- Expo **SDK 54** + React Native + TypeScript, Expo Router (`app/` = thin routes).
  Do NOT upgrade the Expo SDK beyond what the store Expo Go app supports —
  the hackathon demo runs by scanning a QR with store Expo Go (check
  `expoGoSdkVersion` at https://api.expo.dev/v2/versions before bumping).
- Zustand + AsyncStorage (state/persistence, offline-first, no accounts)
- Expo Notifications (local only)
- Jest + ts-jest (engine tests)
- Raids later (P2): the app's own Go + Postgres backend (`backend/`,
  `compose.yaml`); `src/sync/` is the fail-soft client.

## Run

```bash
pnpm install
pnpm start          # Expo dev server — scan the QR with Expo Go
```

## Verify

```bash
pnpm run check      # = lint (eslint + boundaries) + typecheck (tsc) + jest
```

`pnpm run check` must be green before every commit. No file may exceed 250 lines
and no function 60 lines — ESLint enforces both.

Import boundaries are enforced by `eslint-plugin-boundaries` (see
`eslint.config.js`): contracts imports nothing, engine never imports UI,
screens never import `sync` or `engine` directly.

## Git rules (trunk-based)

- Everyone works on `main`. No branches, no pull requests.
- `git pull` before starting work. Commit small and often.
- Commit only inside your own folders. Unfinished work hides behind
  `FLAGS` in `src/contracts/flags.ts` — `main` must always boot.

## Systems (Dev D)

- **Notifications** (`src/systems/notifications.ts`): daily bedtime reminder at
  bedMin − 60 (hero-persona copy pool) + morning summary at wakeMin + 15 when
  not checked in yet. Local pushes only; denial is graceful. Re-synced on app
  open, window change and every night result via `initSystems()`.
- **Demo mode** (`src/systems/demoMode.ts` + `DemoPanel.tsx`): hidden 5-tap
  gesture on the Settings version label → floating panel
  [PERFECT] [BAD] [DEATH] [RESET]. Nights run through the real store (the true
  morning-scene/death flow); [RESET] restores the pre-demo snapshot.
- **E-ink** (`src/systems/eink.ts`, FLAGS.eink): Dot Quote/0 hero + stats cards
  pushed from the phone after night results / resurrection / level-ups / equips
  (5 s debounce, all failures silent). Setup: flip `FLAGS.eink`, enter device ID
  - API key in Settings → "Send test card".
- **Sharing** (`src/systems/share.ts`): `shareViewAsPng(ref, title)` captures any
  view (Mosaic) via react-native-view-shot → expo-sharing.
- **Health auto-detect**: CUT — see the spike note in `src/systems/healthSync.ts`
  (needs a dev build; the demo must stay on store Expo Go). Manual check-in stays.

### E-ink fallback (booth insurance)

If the Dot API misbehaves on-site, push a static card from a laptop — the booth
never goes dark:

```bash
curl -X POST https://dot.mindreset.tech/api/authV2/open/device/DEVICE_ID/image \
  -H 'Authorization: Bearer dot_app_KEY' -H 'Content-Type: application/json' \
  -d '{"image": "<base64 PNG>", "border": 1, "ditherType": "NONE"}'
```

## Raids (P2, FLAGS.raids)

The app's own **Go + Postgres backend** (`backend/`, run via `compose.yaml`) —
no third-party service. Anonymous (device ID), plain REST/JSON over fetch — no
SDK. Sync on app open + pull-to-refresh only, no realtime. Unreachable backend =
silent offline, solo play unaffected. Env: `EXPO_PUBLIC_API_URL` points the app
at the backend reachable from the phone (see `.env.example`). Client API in
`src/sync/`: `createRaid`, `joinRaid`, `leaveRaid`, `syncNow`, campfire math in
`campfire.ts`.

Run the backend + database:

```bash
cp .env.example .env          # set POSTGRES_PASSWORD
docker compose up -d          # postgres + backend on :8080
curl localhost:8080/health    # -> {"status":"ok"}
```

The backend creates its tables on boot (`backend/db.go`). REST surface:
`POST /raids`, `GET /raids/{code}`, `GET|PUT /raids/{id}/members`,
`DELETE /raids/{id}/members/{deviceId}`, `GET|PUT /raids/{id}/nights`.

Schema (created automatically by `migrate`):

```sql
CREATE TABLE raids (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE raid_members (raid_id uuid REFERENCES raids(id) ON DELETE CASCADE,
  device_id text, hero_type text, hero_name text, hp int,
  PRIMARY KEY (raid_id, device_id));
CREATE TABLE night_results (device_id text, raid_id uuid REFERENCES raids(id)
  ON DELETE CASCADE, date date, score int, outcome text,
  PRIMARY KEY (device_id, raid_id, date));
```
