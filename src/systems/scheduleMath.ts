/**
 * Pure scheduling math for local notifications: night-line → clock time,
 * next-occurrence dates, rotating copy. No Expo imports — jest-safe.
 */

const DAY_MIN = 24 * 60
const NOON_MIN = 12 * 60
const DAY_MS = 24 * 60 * 60 * 1000

/** Night-line minutes (12:00 → 36:00) → clock minutes since midnight. */
export function nightLineToClockMin(nightLineMin: number): number {
  return (nightLineMin + NOON_MIN) % DAY_MIN
}

/** Shift a night-line minute with wraparound (e.g. bedMin − 60 across noon). */
export function shiftNightLine(nightLineMin: number, deltaMin: number): number {
  return (nightLineMin + deltaMin + DAY_MIN) % DAY_MIN
}

/** Next local Date at clockMin as seen from `from` (same day if still ahead). */
export function nextOccurrence(from: Date, clockMin: number): Date {
  const hour = Math.floor(clockMin / 60)
  const minute = clockMin % 60
  const sameDay = new Date(from.getFullYear(), from.getMonth(), from.getDate(), hour, minute, 0, 0)
  if (sameDay.getTime() > from.getTime()) {
    return sameDay
  }
  const nextDay = new Date(sameDay)
  nextDay.setDate(nextDay.getDate() + 1)
  return nextDay
}

/** Next local Date at clockMin strictly tomorrow or later (skip today). */
export function nextOccurrenceSkippingToday(from: Date, clockMin: number): Date {
  return nextOccurrence(new Date(from.getTime() + DAY_MS), clockMin)
}

/** Deterministic daily rotation over a copy pool (same line all day). */
export function pickDailyLine<T>(pool: readonly T[], now: Date = new Date()): T {
  const yearStart = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / DAY_MS)
  return pool[dayOfYear % pool.length]
}
