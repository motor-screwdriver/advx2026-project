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
}

/** Real pixel hero from the asset pipeline: a 2-frame idle strip per class. */
export function HeroSprite({ type, size = 64, animated = true, fps = 2, gold = false }: Props) {
  const key = (gold ? `hero_${type}_gold` : `hero_${type}`) as keyof typeof SPRITES;
  return <PixelSprite sprite={SPRITES[key]} size={size} animated={animated} fps={fps} />;
}
