---
kind: external_dependency
name: Expo SDK 54 runtime and Expo Go distribution
slug: expo
category: external_dependency
category_hints:
  - vendor_identity
  - client_constraint
scope:
  - '**'
source_files:
  - package.json
  - README.md
---

The project targets Expo SDK 54 with React Native + TypeScript; the demo is distributed by scanning a QR in the store Expo Go app. The README explicitly forbids upgrading beyond what the store Expo Go supports and points to https://api.expo.dev/v2/versions for the `expoGoSdkVersion` check before bumping. This constrains the maximum supported SDK version at runtime.
