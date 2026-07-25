import React from 'react'

import { SPRITES, SPRITES_1BIT } from '../../assets/manifest'
import type { HeroType } from '../contracts/types'
import { PixelSprite } from './PixelSprite'

interface Props {
  type: HeroType
  size?: number
  animated?: boolean
  /** Frame rate of the idle/walk strip; bump it while the hero walks. */
  fps?: number
  /** Perfect-week gold skin (uses the `_gold` sprite variant). */
  gold?: boolean
  /** Swap the front idle strip for the 6-frame side-profile walk cycle. */
  walking?: boolean
  /** Render the e-ink 1-bit line-art strip instead of the colored one. */
  oneBit?: boolean
}

/**
 * Real pixel hero from the asset pipeline. Idle is a 2-frame front strip;
 * `walking` swaps in the 6-frame side-profile walk cycle. Falls back to the
 * idle strip if the walk asset is missing (defensive). `oneBit` pulls the
 * same pose from the 1-bit set (no gold variant there).
 *
 * The walk art is drawn facing left, but the hero always travels forward
 * (the world scrolls right-to-left underneath him) — so the walk strip gets
 * mirrored horizontally to actually face the direction he's heading.
 */
export function HeroSprite({
  type,
  size = 64,
  animated = true,
  fps = 2,
  gold = false,
  walking = false,
  oneBit = false,
}: Props) {
  const set = oneBit ? SPRITES_1BIT : SPRITES
  const base = !oneBit && gold ? `hero_${type}_gold` : `hero_${type}`
  const walkKey = `${base}_walk`
  const usingWalk = walking && walkKey in set
  const key = (usingWalk ? walkKey : base) as keyof typeof set
  return (
    <PixelSprite sprite={set[key]} size={size} animated={animated} fps={fps} flip={usingWalk} />
  )
}
