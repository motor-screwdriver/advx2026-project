/**
 * Sleep-window helpers. Pure functions on the "night line"
 * (minutes from noon, 12:00 = 0, 00:00 = 720, 07:00 = 1140).
 */
import type { SleepWindow } from '../contracts/types';

export const MIN_SLEEP_MIN = 7 * 60;
export const MAX_SLEEP_MIN = 12 * 60;
const DAY_MIN = 24 * 60;
const NOON_MIN = 12 * 60;

/** Spec FR-A2: duration D = wake - bed must be 7..12 h, inclusive. */
export function isValidWindow(window: SleepWindow): boolean {
  const duration = window.wakeMin - window.bedMin;
  return duration >= MIN_SLEEP_MIN && duration <= MAX_SLEEP_MIN;
}

/** Night-line minutes -> wall clock "HH:MM" (690 -> "23:30", 1140 -> "07:00"). */
export function formatClock(nightLineMin: number): string {
  const clockMin = (((NOON_MIN + nightLineMin) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const hours = Math.floor(clockMin / 60);
  const minutes = clockMin % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/** Current local time as night-line minutes (injectable for tests). */
export function nowNightLine(date: Date = new Date()): number {
  const clockMin = date.getHours() * 60 + date.getMinutes();
  return (clockMin - NOON_MIN + DAY_MIN) % DAY_MIN;
}
