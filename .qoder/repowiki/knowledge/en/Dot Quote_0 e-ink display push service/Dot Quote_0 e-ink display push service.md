---
kind: external_dependency
name: Dot Quote/0 e-ink display push service
slug: dot-quote-zero
category: external_dependency
category_hints:
  - vendor_identity
  - auth_protocol
scope:
  - '**'
source_files:
  - src/systems/eink.ts
  - README.md
---

Pushes hero cards and stats text to Dot Quote/0 devices via the public Dot cloud API at https://dot.mindreset.tech/api/authV2/open/device/{deviceId}/{path}. Authentication uses Bearer token (`Authorization: Bearer <apiKey>`). All failures are silent (try/catch + log); pushes are debounced 5 s. Two endpoints are used: POST image (296×152 pixel-perfect B&W, ditherType NONE) and POST text (pixel font FusionPixel12). A fallback curl command is documented for booth insurance if the API misbehaves on-site.
