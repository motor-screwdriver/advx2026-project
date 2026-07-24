---
kind: external_dependency
name: Zustand state store with AsyncStorage persistence
slug: zustand
category: external_dependency
category_hints:
  - sdk_real_api
scope:
  - '**'
source_files:
  - package.json
  - src/state/store.ts
---

State management uses Zustand (v5) backed by @react-native-async-storage/async-storage for offline-first persistence without accounts. The store actions must be idempotent — the race-condition fix made `checkIn` only valid in the correct direction (bed while awake, wake while asleep), and `runNightTurn` returns a neutral no-op when nothing is pending.
