---
kind: external_dependency
name: NFC tag reading via react-native-nfc-manager
slug: react-native-nfc-manager
category: external_dependency
category_hints:
  - vendor_identity
scope:
  - '**'
source_files:
  - package.json
---

Used for NFC interactions (e.g., tapping an NFC tag opens the app via the `eightbitsleep://` URI scheme defined in app.json). Declared as a dependency but not part of the race-condition fix scope.
