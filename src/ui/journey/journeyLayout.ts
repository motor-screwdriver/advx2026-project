import type { DimensionValue } from 'react-native'

/**
 * Overlay geometry of the journey HUD panels, measured off the source art
 * (tools/import_journey.py sources; fractions of the full panel box).
 * `hud_top.png` is 2160x820 with a baked LV-badge slot and XP groove;
 * `hud_bottom.png` is 2160x950 with the three baked dock button slots the
 * live button sprites cover 1:1 (template-matched at scale 1.0).
 */
export interface HudBox {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export const TOP_PANEL_ASPECT = 2160 / 820
export const BOTTOM_PANEL_ASPECT = 2160 / 950

/** Forest strip is 5 square tiles side by side (2560x512 on disk). */
export const STRIP_TILES = 5

/** Grass line of the strip, as a fraction of its height — the hero's feet
 * land here. Baked by tools/rebuild_forest_strip.py (GROUND_Y / TILE_SIZE),
 * which aligns every tile's soil onto this one line. */
export const STRIP_GROUND = 880 / 1024

/** Fraction of a hero walk frame from its top down to the sole: the strips
 * carry a few rows of empty pixels under the boots, and ignoring them leaves
 * the hero hovering. Measured off the 256px frames (lowest opaque row 243). */
export const HERO_SOLE = 244 / 256

export const TOP_HUD = {
  /** Empty upper well of the panel — the hearts row lives here. */
  hearts: { left: 0.07, top: 0.11, width: 0.86, height: 0.415 },
  /** Gold-framed badge slot, lower-left (x 150..643, y 454..709). */
  badge: { left: 0.0694, top: 0.5537, width: 0.2282, height: 0.311 },
  /** XP groove rails (x 930..2010, y 529..650) — xp_bar_N drops in 1:1. */
  xp: { left: 0.4306, top: 0.6451, width: 0.5, height: 0.1476 },
} as const satisfies Record<string, HudBox>

export const DOCK = {
  /** Gold plate slot (x 136..1046, y 204..774) — SLEEP baked underneath. */
  plate: { left: 0.063, top: 0.2147, width: 0.4213, height: 0.6 },
  /** BAG slot (x 1152..1607, y 260..750). */
  bag: { left: 0.5333, top: 0.2737, width: 0.2106, height: 0.5158 },
  /** Gear slot (x 1616..2076, y 264..744). */
  settings: { left: 0.7481, top: 0.2779, width: 0.213, height: 0.5053 },
} as const satisfies Record<string, HudBox>

/** Absolute-position style for a fractional box inside its HUD panel.
 * Inferred literal type keeps it assignable to both View and Image styles. */
export function hudBoxStyle(box: HudBox) {
  return {
    position: 'absolute' as const,
    left: `${box.left * 100}%` as DimensionValue,
    top: `${box.top * 100}%` as DimensionValue,
    width: `${box.width * 100}%` as DimensionValue,
    height: `${box.height * 100}%` as DimensionValue,
  }
}
