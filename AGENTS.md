# AGENTS.md — rules for AI coding agents

You are one of 4 agent+human pairs, each owning a module. Read `README.md` and
`docs/8bit Sleep — пайплайн разработки команды.md` first.

## Hard rules

1. Touch only your own folders (ownership map in `README.md`). `src/contracts/`
   is frozen — never edit it without an explicit team decision.
2. `npm run check` (lint + typecheck + jest) must pass after every change.
   ESLint enforces `max-lines: 250` per file and `max-lines-per-function: 60` —
   split files early instead of fighting the limit later.
3. Respect the import boundaries in `eslint.config.js` (contracts → nothing,
   engine → no UI, screens → no `engine`/`sync`, `app/` → routes only).
4. All user-facing text goes to `src/ui/strings.ts`, English only.
5. Unfinished features hide behind `FLAGS` in `src/contracts/flags.ts`.
   `main` must always boot in Expo Go.
6. Trunk-based git: pull before work, commit small and often, no branches.
7. Never upgrade the Expo SDK past the store Expo Go's supported SDK
   (`expoGoSdkVersion` in https://api.expo.dev/v2/versions) — the QR demo
   on judges' phones depends on it.

## Commands

- `npm start` — Expo dev server (verify your screen/module manually after
  every generation; "the agent said it works" ≠ it works).
- `npm run check` — full verification gate.
- `npm test` — engine tests only (ts-jest, node environment).
