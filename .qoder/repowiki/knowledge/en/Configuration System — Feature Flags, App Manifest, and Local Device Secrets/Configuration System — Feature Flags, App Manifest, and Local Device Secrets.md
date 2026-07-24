---
kind: configuration_system
name: Configuration System — Feature Flags, App Manifest, and Local Device Secrets
category: configuration_system
scope:
  - '**'
source_files:
  - app.json
  - src/contracts/flags.ts
  - src/systems/einkConfig.ts
  - src/state/store.ts
  - src/systems/eink.ts
  - src/screens/SettingsScreen.tsx
---

The 8bit Sleep app uses a lightweight, TypeScript-native configuration approach with three complementary layers: an Expo manifest for build-time metadata, a compile-time feature-flag registry, and runtime local storage for user-provided device secrets. There is no centralized config loader or environment-variable framework; each concern lives in its own small module.

**1. Build-time app manifest (app.json)**

- `app.json` is the single source of truth for Expo/React Native build configuration: app name, slug, version, deep-link scheme (`eightbitsleep`), orientation, colors, platform-specific bundle identifiers, plugins (expo-router, expo-audio, react-native-nfc-manager), splash image, and web favicon.
- The NFC scheme defined here is consumed at runtime by `src/systems/eink.ts` (`APP_LINK = 'eightbitsleep://'`) so that tapping a Quote e-ink device opens the app.
- No `.env` files are used; all build-time values are embedded directly in this JSON file.

**2. Feature flags (src/contracts/flags.ts)**

- A single `FLAGS` object with `as const` fields (`levels`, `chests`, `healthSync`, `eink`, `selfieFace`, `artGallery`) acts as the application's feature toggle system.
- Consumers gate behavior inline (e.g., `if (!FLAGS.eink) return false` in `eink.ts`, conditional rendering of the Eink panel in `SettingsScreen.tsx`).
- The comment documents the intent: unfinished work hides behind these flags so "main always boots." Changing a flag value is the only way to enable/disable a feature at runtime.
- Flag names are typed via `FlagName = keyof typeof FLAGS`, giving compile-time safety to consumers.

**3. Runtime user/device configuration (src/systems/einkConfig.ts)**

- E-ink device credentials (`deviceId`, `apiKey`) are entered once in Settings, validated, and persisted to `AsyncStorage` under the key `'8bit-sleep/eink-config'`.
- `getEinkConfig()` returns `null` when no config exists or parsing fails; `setEinkConfig()` writes the full object. Both functions are async and wrapped in try/catch to fail silently.
- `parseDeviceId()` accepts either a raw ID or a full Dot NFC URL, extracting just the trailing segment — this normalizes input from both manual entry and NFC scan.
- This config is never serialized outside the device except as part of an `Authorization: Bearer <apiKey>` header on Dot API calls.

**4. Game state persistence (src/state/store.ts)**

- The main game store uses Zustand with the `persist` middleware backed by `AsyncStorage` via `createJSONStorage`. The store key is `'8bit-sleep/game'`.
- `partialize` selects which slices are persisted (`game`, `meta`, `pendingBedTime`, `pendingWakeTime`, `pendingChest`, `lastEvaluation`), keeping transient UI state out of storage.
- `onRehydrateStorage` sets a `hydrated` flag so the app can defer navigation until state is restored.
- This is the only persistent data layer besides the e-ink device config; there is no separate settings store.

**5. Demo mode toggle (hidden gesture)**

- Demo mode is not a flag in `FLAGS`; it is a boolean field inside `GameState.demoMode` toggled through a hidden 5-tap gesture on the Settings screen within a 1500 ms window.
- When enabled, a snapshot of the store is taken before demo actions run, and `[Reset]` restores the snapshot byte-for-byte, preserving real user data.

**Conventions and constraints observed**

- Configuration is split by concern rather than centralized: build metadata → `app.json`, feature toggles → `src/contracts/flags.ts`, user secrets → `AsyncStorage` via dedicated modules.
- All external dependencies (Dot API base URL, NFC scheme, debounce/timeout constants) are declared as module-level `const` values near their usage site rather than loaded from a shared config file.
- Failures to load or parse configuration return `null` or `false` and are logged but never thrown, ensuring the app remains usable even without device config.
- Feature flags are the sole mechanism for enabling/disabling optional integrations; code paths check `FLAGS.<name>` before executing any related logic.
