---
kind: build_system
name: Expo + pnpm Build, CI, and Asset Pipeline
category: build_system
scope:
  - '**'
source_files:
  - package.json
  - app.json
  - metro.config.js
  - .github/workflows/build-app.yml
  - jest.config.js
  - tsconfig.json
  - tools/generate_audio.py
  - tools/pixellab_gen.py
  - tools/manifest_lib.py
  - assets/manifest.ts
  - .husky/pre-commit
  - eslint.config.js
  - pnpm-workspace.yaml
---

This project uses an Expo Router React Native application built with pnpm, with a GitHub Actions CI pipeline that produces Android APKs and iOS simulator builds. Development and testing are driven by npm scripts, Jest for pure TypeScript engine tests, and a Python-based asset pipeline that procedurally generates pixel-art sprites and chiptune audio.

**What system/approach is used**

- **Package manager**: pnpm (v9) with a single-root workspace (`pnpm-workspace.yaml`). Dependencies are declared in `package.json`; lockfile is `pnpm-lock.yaml`.
- **Framework & bundler**: Expo (~54) with Metro (`metro.config.js`) as the bundler; `expo-router` provides file-based routing under `app/`. The app entry point is `expo-router/entry`.
- **Native build**: `expo prebuild` generates native projects, then Gradle (`./gradlew assembleRelease`) builds Android APKs and `xcodebuild` builds iOS `.app` bundles for the simulator.
- **CI/CD**: GitHub Actions workflow `.github/workflows/build-app.yml` triggers on semver tags or `workflow_dispatch`, resolves version from either the tag or `package.json`, syncs it into both `package.json` and `app.json`, then runs the Android and iOS jobs in parallel.
- **Testing**: Jest (`ts-jest`, node environment) runs all `src/**/__tests__/**/*.test.ts(x)` files against pure TypeScript code; no RNW/Jest setup is needed because the engine is UI-free.
- **Asset pipeline**: A Python toolchain under `tools/` procedurally generates WAV audio (`generate_audio.py`) and pixel-art assets via PixelLab AI (`pixellab_gen.py`), then writes a machine-readable manifest (`assets/manifest.data.json`) and regenerates a typed `assets/manifest.ts` consumed by the UI layer.

**Key files and packages**

- `package.json` — dependencies, devDependencies, and npm scripts (`start`, `android`, `ios`, `web`, `lint`, `format`, `typecheck`, `test`, `check`, `prepare`).
- `app.json` — Expo app metadata (name, slug, version, bundle identifiers, splash, plugins).
- `metro.config.js` — custom resolver that forces zustand's CJS build on web to avoid `import.meta.env` parsing errors.
- `.github/workflows/build-app.yml` — CI job definitions for Android and iOS builds, version synchronization, artifact upload.
- `jest.config.js` + `jest.setup.ts` — ts-jest configuration pointing at `src` roots.
- `tsconfig.json` — extends `expo/tsconfig.base` with strict mode and jest types.
- `tools/generate_audio.py` — deterministic chiptune generator producing 22050 Hz mono u8 PCM WAV files under `assets/audio/`.
- `tools/pixellab_gen.py` — CLI wrapper around the PixelLab REST API for text-to-pixel-art and animation generation.
- `tools/manifest_lib.py` — reads/writes `assets/manifest.data.json` and regenerates `assets/manifest.ts` with typed exports (`SPRITES`, `SCENES`, `ICONS`, `ATMO`, `AUDIO`).
- `assets/manifest.ts` — generated TypeScript module that is the single source of truth for UI asset references.
- `.husky/pre-commit` — runs `lint-staged` on every commit.

**Architecture and conventions**

- **Versioning**: Version is a single source of truth stored in `package.json` and mirrored into `app.expo.version` in `app.json`. The CI script synchronizes these two files before building, so tagged releases propagate the version automatically.
- **Build targets**: Three platforms are supported through Expo: Android (APK release), iOS (simulator `.app`), and Web (Metro bundling). Each has its own `expo start` / `prebuild` path.
- **Asset ownership**: All game assets (sprites, scenes, icons, atmosphere tiles, audio) are produced by the Python pipeline and referenced exclusively through `assets/manifest.ts`. The manifest comment explicitly states this is the only supported way for UI code to reference assets.
- **Boundary enforcement**: ESLint boundaries plugin enforces architectural layers (`contracts` → `engine` → `state` → `ui`/`screens`/`systems`/`app`) so that lower layers cannot import higher ones. This is enforced at lint time, not build time.
- **Test isolation**: Engine and state code is pure TypeScript and tested with plain Node/Jest; no React Native runtime is required for tests.

**Conventions and constraints**

- **pnpm-only installs**: CI uses `pnpm install --frozen-lockfile`, and the workspace config disables the unrs-resolver build.
- **Node/Java versions**: CI pins Node 22, Java 17 (Temurin), and Android SDK via `android-actions/setup-android@v3`.
- **Audio budget**: The audio generator enforces a 500 KB per-file limit, peak normalization to ~76% full scale, and seamless loop seams verified at build time.
- **File size limits**: ESLint enforces max 250 lines per file and 60 lines per function to keep modules agent-friendly (NFR-10).
- **Pre-commit hooks**: Husky runs `lint-staged` on every commit, which applies ESLint and Prettier to staged files.
- **No manual manifest edits**: `assets/manifest.ts` is marked generated and must be regenerated by rerunning the pipeline; direct edits are discouraged by comments and the `as const satisfies Record<...>` type assertion.
- **Web-specific metro workaround**: The resolver override for zustand is scoped strictly to the `web` platform to avoid breaking native builds.
