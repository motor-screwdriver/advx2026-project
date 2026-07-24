---
kind: external_dependency
name: Local-only notifications via expo-notifications
slug: expo-notifications
category: external_dependency
category_hints:
  - framework_behavior
scope:
  - '**'
source_files:
  - package.json
  - src/systems/notifications.ts
---

Uses expo-notifications exclusively for local scheduling: a daily bedtime reminder 60 min before bedMin and a one-shot morning summary at wakeMin+15 when not checked in. The module is lazy-loaded and skipped on web and Expo Go (SDK 53+ dropped remote push); all failures are graceful and the game works without notifications. Schedule is rebuilt from scratch on every relevant change via cancel-all + recreate.
