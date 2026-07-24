---
kind: logging_system
name: Ad-hoc console logging with per-module tag prefixes
category: logging_system
scope:
  - '**'
source_files:
  - src/systems/eink.ts
  - src/systems/einkCard.tsx
  - src/systems/nfc.ts
  - src/systems/notifications.ts
  - src/systems/share.ts
---

The repository does not use a dedicated logging framework or structured logger. All runtime output goes through the native `console.log` calls scattered across feature modules, primarily under `src/systems/`. There is no centralized logger initialization, log-level configuration, log rotation, or sink abstraction.

Observed patterns:

- Every module that logs prefixes messages with a bracketed tag identifying the subsystem, e.g. `[eink]`, `[nfc]`, `[share]`. This is the only consistent convention for distinguishing sources.
- Logging is used exclusively for diagnostic and debugging information — HTTP request results, NFC scan outcomes, share failures, and feature-flag gating (e.g. `FLAGS.eink`).
- Failures are intentionally silent to callers: each function wraps I/O in try/catch and returns a boolean or null, while emitting a `console.log` describing the failure. The comment in `eink.ts` states explicitly: "Every failure is silent (try/catch + log): the game never depends on the device or the network."
- No `console.error`, `console.warn`, or `console.debug` usage was found; all output uses `console.log` regardless of severity.
- There is no environment-based filtering (no dev/prod toggle), no log aggregation, and no test-time assertion helpers for log output.

Key files where logging occurs:

- `src/systems/eink.ts` — e-ink Dot Quote push client; most heavily logged subsystem.
- `src/systems/einkCard.tsx` — card capture helper; logs capture failures.
- `src/systems/nfc.ts` — NFC tag reader; logs availability and scan results.
- `src/systems/notifications.ts` — local notification scheduler; documents why it avoids remote push to prevent `console.errors` on Android Expo Go.
- `src/systems/share.ts` — OS share sheet wrapper; logs share failures silently.

Constraints enforced by code structure:

- External integrations (NFC, notifications, sharing, e-ink) are wrapped so that any exception is caught and logged but never thrown, keeping the core game functional when these features are unavailable.
