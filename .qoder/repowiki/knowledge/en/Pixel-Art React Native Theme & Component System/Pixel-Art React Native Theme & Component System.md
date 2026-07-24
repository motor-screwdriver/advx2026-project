---
kind: frontend_style
name: Pixel-Art React Native Theme & Component System
category: frontend_style
scope:
  - '**'
source_files:
  - src/ui/theme.ts
  - src/ui/fonts.ts
  - src/ui/Screen.tsx
  - src/ui/PixelPanel.tsx
  - src/ui/PixelButton.tsx
  - src/ui/PixelSprite.tsx
  - src/ui/DayNightBackground.tsx
  - src/ui/animations.ts
  - app/_layout.tsx
---

The app uses a dedicated pixel-art themed UI layer built on React Native StyleSheet, centered around a centralized design-token system and a small library of reusable pixel-accurate components.

**System and approach**

- Styling is done with React Native `StyleSheet.create` in each component; there is no CSS-in-JS library, Tailwind, or external styling framework.
- A single `theme.ts` file defines all design tokens: the "Cozy tavern" color palette (warm wood, parchment cream, honey gold, soft coral, leaf green), type scale based on Press Start 2P, spacing multiplier, border radius, and border width. Colors avoid pure black/white for low-glare bedroom use.
- Fonts are loaded once via `expo-font` in `fonts.ts` using the token name `press-start`, with graceful fallback to system font on failure.
- The root layout (`app/_layout.tsx`) applies the background color globally through Expo Router's Stack `contentStyle` and wraps every screen in a `GameProvider` context.

**Key files and packages**

- `src/ui/theme.ts` — design tokens (colors, type scale, spacing, borders)
- `src/ui/fonts.ts` — Press Start 2P font loader hook
- `src/ui/Screen.tsx` — base screen wrapper (SafeAreaView, optional scroll, gold title + rule)
- `src/ui/PixelPanel.tsx` — chunky panel frame with brass top bevel
- `src/ui/PixelButton.tsx` — inset pressable button with press/scale/disabled states
- `src/ui/PixelSprite.tsx` — sprite strip renderer with frame clipping and optional looping animation
- `src/ui/DayNightBackground.tsx` — full-bleed animated sky/hills/grass scene driven by phase visuals
- `src/ui/animations.ts` — lightweight Animated helpers (bob, shake, pop, fade-in) all using native driver
- `app/_layout.tsx` — global theme application and GameProvider bootstrap

**Architecture and conventions**

- Every UI component lives under `src/ui/` and imports exclusively from `./theme` for visual values — no hard-coded colors or sizes.
- Components expose a minimal props interface and compose via `style` / `contentStyle` prop patterns so consumers can extend layouts without breaking the pixel frame.
- Animations are kept simple and performant: `Animated.timing` / `Animated.spring` with `useNativeDriver: true`, no physics libraries.
- Scene backgrounds are composable sub-components (`SceneSun`, `SceneClouds`, `SceneGrass`, `Hills`, `Stars`) that read phase data from `timeOfDay.ts` and window dimensions for responsive layout.
- Sprite rendering uses pre-upscaled horizontal strips from the manifest, clipped via translated `Image` inside an overflow-hidden window — no runtime image processing.

**Conventions and constraints**

- All visual constants flow through `theme.*`; components never inline hex values directly.
- Spacing follows the `theme.spacing(units)` multiplier (4px unit).
- Typography uses only the three defined type entries (`title`, `body`, `label`) with Press Start 2P.
- Buttons and panels share the same inset/bevel aesthetic (dark inset background, outline border, lighter top bevel).
- Screens wrap content in `Screen` for consistent safe-area padding, gold centered titles, and optional scrolling.
- Animations must use the provided helpers in `animations.ts` and prefer native-driver timing over JS-driven loops.
