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
- Supabase later (raids, P2) — `src/sync/` is an empty placeholder for now

## Run

```bash
npm install
npm start          # Expo dev server — scan the QR with Expo Go
```

## Verify

```bash
npm run check      # = lint (eslint + boundaries) + typecheck (tsc) + jest
```

`npm run check` must be green before every commit. No file may exceed 250 lines
and no function 60 lines — ESLint enforces both.

## Folder ownership (one developer per folder)

| Folder | Owner | Contents |
|---|---|---|
| `src/contracts/` | **shared, frozen** | `types.ts`, `events.ts`, `flags.ts`, `mock.ts`. Changed only after a full-team huddle. |
| `src/engine/` | Dev B | Pure game logic + tests. No React/Expo imports. |
| `src/state/` | Dev B | Zustand store, persistence. |
| `src/screens/` | Dev A | All screens. Reach the engine only via `state`/`contracts`. |
| `src/ui/` | Dev A | Reusable components, `theme.ts`, `strings.ts` (all user-facing text). |
| `src/systems/` | Dev D | Notifications, demo mode, sharing, e-ink. |
| `src/sync/` | Dev D | Supabase raids (P2). Empty for now. |
| `app/` | Dev A | Expo Router routes — thin wrappers over `src/screens/`. |
| `assets/` | Dev C | Sprites, scenes, audio, fonts. |
| `tools/` | Dev C | Asset pipeline scripts (pixelation, palette). |

Import boundaries are enforced by `eslint-plugin-boundaries` (see
`eslint.config.js`): contracts imports nothing, engine never imports UI,
screens never import `sync` or `engine` directly.

## Git rules (trunk-based)

- Everyone works on `main`. No branches, no pull requests.
- `git pull` before starting work. Commit small and often.
- Commit only inside your own folders. Unfinished work hides behind
  `FLAGS` in `src/contracts/flags.ts` — `main` must always boot.
