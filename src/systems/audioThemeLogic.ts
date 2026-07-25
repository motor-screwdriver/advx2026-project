import { MUSIC_TRACKS, type MusicKey } from './audioTracks'

const DAY_START_HOUR = 5
const NIGHT_START_HOUR = 18

export function isDayThemeTime(now = new Date()): boolean {
  const hour = now.getHours()
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR
}

export function chooseMusicTrack(pendingBedTime: number | null, now = new Date()): MusicKey {
  if (pendingBedTime !== null) {
    return MUSIC_TRACKS.NIGHT
  }
  return isDayThemeTime(now) ? MUSIC_TRACKS.DAY : MUSIC_TRACKS.NIGHT
}

export function msUntilNextThemeBoundary(now = new Date()): number {
  const next = new Date(now)
  next.setSeconds(0, 0)
  if (now.getHours() < DAY_START_HOUR) {
    next.setHours(DAY_START_HOUR, 0, 0, 0)
  } else if (now.getHours() < NIGHT_START_HOUR) {
    next.setHours(NIGHT_START_HOUR, 0, 0, 0)
  } else {
    next.setDate(next.getDate() + 1)
    next.setHours(DAY_START_HOUR, 0, 0, 0)
  }
  return Math.max(1000, next.getTime() - now.getTime())
}
