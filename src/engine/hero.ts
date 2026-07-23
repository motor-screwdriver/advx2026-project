/**
 * Hero assignment (spec §1.2). Hero is never chosen by the user: 3×3 grid,
 * bedtime × duration. Heroes differ only in looks — no passives.
 */
import type { HeroType, SleepWindow } from '../contracts/types';

const HERO_GRID: HeroType[][] = [
  ['monk', 'ranger', 'druid'], // early bedtime (before 22:00)
  ['rogue', 'knight', 'paladin'], // normal (22:00–23:59)
  ['ninja', 'mage', 'warlock'], // late (00:00+)
];

export function assignHero(window: SleepWindow): HeroType {
  const row = window.bedMin < 600 ? 0 : window.bedMin < 720 ? 1 : 2;
  const duration = window.wakeMin - window.bedMin;
  const col = duration < 480 ? 0 : duration < 540 ? 1 : 2;
  return HERO_GRID[row][col];
}

export function heroName(type: HeroType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
