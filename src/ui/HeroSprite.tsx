import React from 'react';

import { SPRITES } from '../../assets/manifest';
import type { HeroType } from '../contracts/types';
import { PixelSprite } from './PixelSprite';

interface Props {
  type: HeroType;
  size?: number;
  animated?: boolean;
  /** Frame rate of the idle/walk strip; bump it while the hero walks. */
  fps?: number;
  /** Perfect-week gold skin (uses the `_gold` sprite variant). */
  gold?: boolean;
  /** Swap the front idle strip for the 6-frame side-profile walk cycle. */
  walking?: boolean;
}

/**
 * Real pixel hero from the asset pipeline. Idle is a 2-frame front strip;
 * `walking` swaps in the 6-frame right-facing side-profile walk cycle. Falls
 * back to the idle strip if the walk asset is missing (defensive).
 */
export function HeroSprite({ type, size = 64, animated = true, fps = 2, gold = false, walking = false }: Props) {
  const base = gold ? `hero_${type}_gold` : `hero_${type}`;
  const walkKey = `${base}_walk`;
  const key = (walking && walkKey in SPRITES ? walkKey : base) as keyof typeof SPRITES;
  return <PixelSprite sprite={SPRITES[key]} size={size} animated={animated} fps={fps} />;
}
