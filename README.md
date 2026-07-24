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
screens never import `engine` directly.

## AI oracle backend (Go)

First-run onboarding is a conversation with Luma (tavern-style sleep oracle).
The client POSTs chat turns to `/api/oracle`; the only backend is the Go
service in `server/` (stdlib only, OpenRouter key + system prompt stay
server-side). Wire contract: `src/contracts/aiOnboarding.ts`.

Local client development runs against the deployed backend — set
`EXPO_PUBLIC_API_ORIGIN` in `.env` (see `.env.example`). Backend changes:

```bash
cd server && go test ./...    # toolchain note: see below
```

## Deploy (CI only)

`.github/workflows/deploy-server.yml` deploys on manual dispatch only
(Actions → Deploy server → Run workflow, from any branch): `go vet` +
`go test`, cross-builds a static linux/amd64 binary, exports the static web
client (`dist/`), then rsyncs both to the server and restarts systemd. Caddy terminates TLS (Let's Encrypt) and proxies `/api/*`
to the Go service on `127.0.0.1:8091` (8091, not 8080 — that port belongs to
another dockerized service on the host); static client lives in
`/opt/8bit-sleep/client`, env in `/opt/8bit-sleep/server.env` (chmod 600).

Required GitHub secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`,
`OPENROUTER_API_KEY`; optional: `DEPLOY_DOMAIN` (when a real domain replaces
the `<DEPLOY_HOST>.sslip.io` one). The API origin is derived from those in
the workflows — no separate GitHub variable needed. The server needs ports
80/443 open for the Let's Encrypt HTTP challenge. First deploy provisions
Caddy + the systemd unit via `tools/deploy/setup-server.sh` (idempotent).

A Go toolchain lives in `tools/.go/` locally (gitignored): prefix commands
with `tools/.go/go/bin/` or add it to PATH.

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
