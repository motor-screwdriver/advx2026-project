# DESIGN.md — 8bit Sleep design tokens

Token source of truth: `src/ui/theme.ts`. Components: `src/ui/`.

## Theme driver
Dark bedroom, 23:40, phone brightness low (see PRODUCT.md). Dark UI is
mandatory. Mood: friendly, cozy, never harsh — a warm tavern, not a neon arcade.

## Color strategy
Restrained "cozy tavern" (Soul Knight lobby language): warm wood neutrals +
honey gold accent + semantic coral (HP) and leaf (success). No pure `#000`/`#fff`.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#221812` | app background, deep espresso |
| `panel` | `#3a2a1c` | warm wood panels |
| `inset` | `#2c2016` | sunken wells, buttons |
| `outline` | `#140d08` | 2 px dark coffee outlines |
| `bevelLight` | `#5c4328` | brass top-edge bevel |
| `text` | `#f5e6c8` | parchment cream (not white) |
| `textDim` | `#c2a176` | muted tan (≥4.5:1 on panel) |
| `gold` | `#eab54d` | THE accent: titles, primary actions, GOLD pixels |
| `leaf` | `#8fc46a` | success, streaks, positive states |
| `heartFull` / `heartFullEdge` / `heartEmpty` | `#ef6a5e` / `#ff9d8a` / `#4a3327` | HP semantics only |
| `pixelGold/Gray/Black` | `#eab54d` / `#a89b8c` / `#1c1410` | year-mosaic pixels |

Accent discipline: honey gold for titles and primary actions only; coral means
HP, leaf means success; neither is decoration. Asset palette (Dev C, NFR-16)
should draw from the same warm family (ENDESGA-32 relatives).

## Typography
One family: Press Start 2P (`assets/fonts/PressStart2P-Regular.ttf`, OFL).
It is a display font: never below 8 px, comfortable from 10 px up.

| Step | Size / line height | Use |
|---|---|---|
| `type.title` | 18 / 28, +1 tracking | screen titles |
| `type.body` | 10 / 18 | body, buttons |
| `type.label` | 8 / 14, +1 tracking, uppercase | meta labels, section headers |

ASCII only in UI copy: the font covers basic Latin (no arrows/emoji/×).

## Component language
Chunky pixel panels: 2 px `outline` frame + 2 px `bevelLight` top edge,
4 px radius. Buttons are `inset` panels with the same bevel; pressed state =
darker + 1 px translateY. HP is a row of beveled pips (`HeartRow`).

Reference components: `PlaceholderScreen` (panel), `PixelButton`, `HeartRow`.

## Motion
Not yet specified (stub phase). When added: 150–250 ms, ease-out, state
feedback only. No orchestrated load sequences; morning cut-scenes are the
single allowed exception (they ARE the content).

## Bans (project-specific, on top of shared laws)
- No charts/graphs/analytics screens (we are a game, not a tracker).
- No glassmorphism, gradient text, side-stripe borders, nested cards.
- No display-size pixel font below 8 px.
- No light theme (dark bedroom scene is the product).
