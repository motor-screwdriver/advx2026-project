/**
 * Pure check-in times for the demo panel (P0). Picked so the REAL engine
 * lands on the requested outcome for any valid window (420..720 min) —
 * judges see the actual morning-scene / death flow, not a canned screen.
 */
import type { SleepWindow } from '../contracts/types';

export type DemoNightKind = 'perfect' | 'bad' | 'terrible';

export interface DemoCheckIns {
  bedTime: number;
  wakeTime: number;
}

// Bed on time; waking 2 h early → S = 100 − 30 (shortfall) − 30 (wake dev) = 40 → BAD.
const BAD_WAKE_EARLY_MIN = 120;
// Waking 3 h 20 early → shortfall caps at 40, wake dev caps at 30 → S = 30 → TERRIBLE.
const TERRIBLE_WAKE_EARLY_MIN = 200;

export function demoCheckIns(window: SleepWindow, kind: DemoNightKind): DemoCheckIns {
  if (kind === 'perfect') {
    return { bedTime: window.bedMin, wakeTime: window.wakeMin };
  }
  const early = kind === 'bad' ? BAD_WAKE_EARLY_MIN : TERRIBLE_WAKE_EARLY_MIN;
  return { bedTime: window.bedMin, wakeTime: window.wakeMin - early };
}
