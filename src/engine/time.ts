/**
 * Time helpers for the "night line": minutes from noon, 12:00 → 36:00.
 * Pure and dependency-free; the UI keeps its own formatting copy because
 * the engine must never import from ui/ (eslint-plugin-boundaries).
 */

const DAY_MIN = 24 * 60;
const NOON_MIN = 12 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEK_MS = 7 * DAY_MS;

/** Current local time as night-line minutes (injectable for tests). */
export function nowNightLine(date: Date = new Date()): number {
  const clockMin = date.getHours() * 60 + date.getMinutes();
  return (clockMin - NOON_MIN + DAY_MIN) % DAY_MIN;
}

/** YYYY-MM-DD stamp for a NightRecord (UTC, deterministic). */
export function todayDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** True when `iso` is set and less than `ms` before `now`. */
export function isWithinMs(iso: string | null, now: Date, ms: number): boolean {
  return iso !== null && now.getTime() - new Date(iso).getTime() < ms;
}
