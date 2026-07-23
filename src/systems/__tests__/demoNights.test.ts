import type { SleepWindow } from '../../contracts/types';
import { evaluateNight } from '../../engine/night';
import { demoCheckIns, type DemoNightKind } from '../demoNights';

// Representative windows: min duration 7 h, typical 7.5 h, max duration 12 h.
const WINDOWS: SleepWindow[] = [
  { bedMin: 540, wakeMin: 960 }, // 21:00 → 04:00 (7 h, early)
  { bedMin: 690, wakeMin: 1140 }, // 23:30 → 07:00 (7.5 h, normal)
  { bedMin: 420, wakeMin: 1140 }, // 19:00 → 07:00 (12 h, max)
];

const EXPECTED: Record<DemoNightKind, string> = {
  perfect: 'PERFECT',
  bad: 'BAD',
  terrible: 'TERRIBLE',
};

describe('demoCheckIns', () => {
  it.each(WINDOWS)('keeps a valid positive duration for window %o', (window) => {
    for (const kind of ['perfect', 'bad', 'terrible'] as const) {
      const { bedTime, wakeTime } = demoCheckIns(window, kind);
      expect(wakeTime).toBeGreaterThan(bedTime);
      expect(wakeTime - bedTime).toBeLessThanOrEqual(18 * 60);
    }
  });

  it.each(WINDOWS)('lands on the scripted outcome via the REAL engine for %o', (window) => {
    for (const kind of ['perfect', 'bad', 'terrible'] as const) {
      const { bedTime, wakeTime } = demoCheckIns(window, kind);
      const evaluation = evaluateNight(window, bedTime, wakeTime);
      expect(evaluation.outcome).toBe(EXPECTED[kind]);
    }
  });
});
