import type { HeroType } from '../contracts/types';

/**
 * Placeholder hero sprites until Dev C ships real art: one shared 8x10
 * chibi bitmap recolored per hero. Bitmap chars:
 * O = outline, C = hero color, S = skin, E = eye, . = transparent.
 */
export const HERO_COLORS: Record<HeroType, string> = {
  monk: '#e8a33d',
  ranger: '#8fc46a',
  druid: '#5d8f4f',
  rogue: '#7d8aa0',
  knight: '#c4cede',
  paladin: '#eab54d',
  ninja: '#565c86',
  mage: '#a179e6',
  warlock: '#c74a63',
};

export const SKIN_COLOR = '#f0c8a0';

export const HERO_BITMAP: readonly string[] = [
  '..OOOO..',
  '.OCCCCO.',
  '.OCCCCO.',
  '.OCSSCO.',
  '.OSESEO.',
  '.OCSSCO.',
  '..OCCO..',
  '.OCCCCO.',
  '.OCCCCO.',
  '..O..O..',
];
