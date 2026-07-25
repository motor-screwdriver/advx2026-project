import type { ViewStyle } from 'react-native'

/**
 * Geometry of the Luma tavern scenes (assets/luma/s1_*, s2_*), measured on the
 * 2160x3840 source art and stored as fractions of the stage so any fitted
 * stage size lines up with the baked parchment, button slots and input row.
 */
export interface StageSize {
  width: number
  height: number
}

export interface FracRect {
  top: number
  left: number
  width: number
  height: number
}

/** The art is 9:16 portrait; the stage letterboxes inside its container. */
export function fitStage(containerW: number, containerH: number): StageSize {
  const width = Math.min(containerW, (containerH * 9) / 16)
  return { width, height: (width * 16) / 9 }
}

export function rectStyle(rect: FracRect, stage: StageSize): ViewStyle {
  return {
    position: 'absolute',
    top: rect.top * stage.height,
    left: rect.left * stage.width,
    width: rect.width * stage.width,
    height: rect.height * stage.height,
  }
}

/** Font size for `sourcePx` pixels of the 3840-tall art, scaled to the stage. */
export function stageFont(stage: StageSize, sourcePx: number): number {
  return (sourcePx / 3840) * stage.height
}

/** Shrink single-line Pixelify Sans text (~0.72em advance) to fit `maxSourcePx`. */
export function fitFont(text: string, baseSourcePx: number, maxSourcePx: number): number {
  return Math.min(baseSourcePx, (maxSourcePx * 0.94) / (Math.max(1, text.length) * 0.72))
}

/** Source-art size: fractions of the stage map onto these to give source px. */
const ART = { width: 2160, height: 3840 } as const
/** Sentence-case Pixelify Sans Bold averages ~0.51em per character... */
const PARAGRAPH_ADVANCE = 0.51
/** ...and word wrapping leaves ~8% of each line unused. */
const WRAP_FILL = 0.92

/**
 * Biggest font (source px) that shows `text` in `rect` without scrolling, so a
 * whole message stays on the parchment instead of one window of it. Falls back
 * to `minSourcePx` for messages too long to ever fit; those still scroll.
 */
export function fitParagraph(
  text: string,
  rect: FracRect,
  maxSourcePx: number,
  minSourcePx: number,
  lineHeight: number,
): number {
  const usableWidth = rect.width * ART.width * WRAP_FILL
  const boxHeight = rect.height * ART.height
  const chars = Math.max(1, text.length)
  for (let size = maxSourcePx; size > minSourcePx; size -= 4) {
    const perLine = Math.max(1, Math.floor(usableWidth / (size * PARAGRAPH_ADVANCE)))
    if (Math.ceil(chars / perLine) * size * lineHeight <= boxHeight) {
      return size
    }
  }
  return minSourcePx
}

/** Scene 1 (question): parchment text-safe area, two answer slots, chat input row. */
export const S1_PARCHMENT: FracRect = { top: 0.5156, left: 0.1574, width: 0.6852, height: 0.1354 }
export const S1_SLOTS: readonly FracRect[] = [
  { top: 0.7083, left: 0.0694, width: 0.8889, height: 0.0703 },
  { top: 0.7969, left: 0.0694, width: 0.8889, height: 0.0703 },
]
export const S1_INPUT: FracRect = { top: 0.901, left: 0.1111, width: 0.662, height: 0.0573 }
export const S1_SEND: FracRect = { top: 0.888, left: 0.8148, width: 0.1435, height: 0.0833 }

/** Scene 2 (result): parchment, window strip, and the free panel for ACCEPT / ADJUST. */
export const S2_PARCHMENT: FracRect = { top: 0.5885, left: 0.1528, width: 0.7222, height: 0.0964 }
export const S2_STRIP: FracRect = { top: 0.7188, left: 0.0694, width: 0.8611, height: 0.0729 }
export const S2_ACCEPT: FracRect = { top: 0.8073, left: 0.1991, width: 0.6019, height: 0.078 }
export const S2_ADJUST: FracRect = { top: 0.8958, left: 0.2963, width: 0.4074, height: 0.0623 }

/**
 * Morning scene (assets/luma/morning_*): the parchment is baked in the same
 * place as scene 1 but claims more of it (morning talk runs longer), the chat
 * input row moved up right under it, and the wood below it is free — two answer
 * slots fit there at the sprite's own aspect.
 */
export const MORNING_PARCHMENT: FracRect = {
  top: 0.5102,
  left: 0.1375,
  width: 0.7361,
  height: 0.1445,
}
export const MORNING_INPUT: FracRect = { top: 0.7393, left: 0.113, width: 0.6157, height: 0.062 }
export const MORNING_SEND: FracRect = { top: 0.7271, left: 0.7824, width: 0.1676, height: 0.0865 }
export const MORNING_SLOTS: readonly FracRect[] = [
  { top: 0.8271, left: 0.0694, width: 0.8889, height: 0.0673 },
  { top: 0.9124, left: 0.0694, width: 0.8889, height: 0.0673 },
]

/** Base font sizes in source-art pixels (3840 tall); DialogueText tiers down. */
export const LUMA_FONT = {
  parchment: 160,
  /** Floor for auto-fitted dialogue; below this a long message scrolls instead. */
  parchmentMin: 72,
  slot: 128,
  slotMaxWidth: 1680,
  strip: 68,
  stripMaxWidth: 1760,
  input: 64,
  /** The morning field is baked taller than scene 1's, so the draft reads bigger. */
  morningInput: 76,
} as const
