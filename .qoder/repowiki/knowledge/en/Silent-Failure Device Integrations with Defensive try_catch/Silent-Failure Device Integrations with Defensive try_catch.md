---
kind: error_handling
name: Silent-Failure Device Integrations with Defensive try/catch
category: error_handling
scope:
  - '**'
source_files:
  - src/systems/eink.ts
  - src/systems/nfc.ts
  - src/systems/notifications.ts
  - src/systems/audio.ts
  - src/state/store.ts
---

The 8bit Sleep app does not define a custom error type system, sentinel errors, or centralized error middleware. Instead, error handling follows a consistent pattern of defensive try/catch blocks around every external/system call, with failures logged via `console.log` and returned as boolean/null values so the game continues to function without any optional feature.

**Approach: silent-failure for all non-core integrations**

- Every device/OS integration (e-ink push, NFC scanning, notifications, audio mode) is wrapped in try/catch that swallows exceptions and returns a safe default (`false`, `null`, or no-op). The e-ink module explicitly documents this: "Every failure is silent (try/catch + log): the game never depends on the device or the network."
- Async calls use `.catch(() => {})` patterns (e.g., `setAudioModeAsync(...).catch(() => {})`, `manager.cancelTechnologyRequest().catch(() => undefined)`), ensuring one failing async operation cannot crash the app.
- Native-only modules are lazy-loaded via dynamic `require()` guarded by `isRunningInExpoGo()` and `Platform.OS` checks, so missing APIs simply return `null` rather than throwing at import time.

**Where it lives**

- `src/systems/eink.ts` — HTTP POSTs to Dot cloud with AbortController timeout; all failures log `[eink] ... failed (silent)` and return `false`.
- `src/systems/nfc.ts` — NFC tag reading wrapped in try/catch; cancelled scans and malformed tags return `null`.
- `src/systems/notifications.ts` — AsyncStorage reads/writes and expo-notifications calls wrapped in try/catch; denied permissions are silently skipped.
- `src/systems/audio.ts` — Audio mode setup uses `.catch(() => {})`; sound toggle is a no-op when disabled.
- `src/state/store.ts` — Zustand persist middleware with AsyncStorage; rehydration completes even if storage fails.

**Engine code is pure and exception-free**
The core game engine (`src/engine/*`) contains no try/catch or throw statements — it is pure TypeScript functions that return new state objects or `null` to indicate inapplicability (e.g., `applyHourglass` returns `null` when conditions aren't met). Errors in game logic are represented as return values, not thrown exceptions.

**No global error boundaries or unhandled rejection handlers**
There are no `ErrorBoundary` components, `process.on('unhandledRejection')`, or centralized error logging. Each integration handles its own failures locally.
