---
kind: dependency_management
name: pnpm-based React Native dependency management with Expo ecosystem
category: dependency_management
scope:
  - '**'
source_files:
  - package.json
  - pnpm-workspace.yaml
  - .npmrc
  - pnpm-lock.yaml
---

The project uses pnpm as its package manager for a single-package React Native/Expo application. Dependencies are declared in `package.json` and locked via `pnpm-lock.yaml` (lockfileVersion 9.0), ensuring reproducible installs across the team.

**Package manager and workspace**: pnpm is configured through `pnpm-workspace.yaml`, which declares the root directory as the only package (`packages: ["."]`). The workspace enables pnpm-specific settings such as `allowBuilds.unrs-resolver: false` and `minimumReleaseAgeExclude` for `ts-jest@29.4.12`, indicating controlled resolution behavior and an exception for a specific dev dependency release age.

**Dependency declarations**: All runtime dependencies (React, React Native, Expo SDK packages like `expo-router`, `expo-audio`, `expo-notifications`, `zustand`, `react-native-nfc-manager`) and development dependencies (TypeScript, Jest, ESLint, Prettier, Husky) are listed under `dependencies` and `devDependencies` in `package.json`. Versions use a mix of tilde ranges (`~54.0.36`) for patch-safe updates and caret ranges (`^3.17.2`, `^5.0.14`) for minor/patch flexibility.

**Peer dependency handling**: `.npmrc` sets `legacy-peer-deps=true` with an explicit comment explaining that expo-router ships web-only peers (via @radix-ui → react-dom) that a mobile-only app does not install; this legacy resolution keeps `npm install` working for the team even when using pnpm.

**Lockfile strategy**: The `pnpm-lock.yaml` file is committed to version control and contains exact resolved versions with integrity hashes for every transitive dependency. It records peer dependency relationships explicitly (e.g., `expo@54.0.36(@babel/core@...)(expo-router@...)`), making builds deterministic.

**No vendoring or private registry**: There is no `vendor/` directory, no `.npmrc` registry/authToken configuration, and no private npm registry setup — all packages are pulled from the public npm registry. Python tooling under `tools/` manages assets but is separate from the Node.js dependency graph.

**Scripts and workflow**: Standard Expo scripts (`start`, `android`, `ios`, `web`) plus lint/typecheck/test commands are defined. The `prepare` script runs `husky` to set up git hooks, integrating dependency-related tooling into the commit workflow.
