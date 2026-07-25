import { chooseMusicTrack } from '../audioThemeLogic'
import { MUSIC_TRACKS } from '../audioTracks'

const localTime = (hour: number, minute: number) => new Date(2026, 6, 26, hour, minute)

describe('chooseMusicTrack', () => {
  it('uses night before 05:00', () => {
    expect(chooseMusicTrack(null, localTime(4, 59))).toBe(MUSIC_TRACKS.NIGHT)
  })

  it('uses day from 05:00', () => {
    expect(chooseMusicTrack(null, localTime(5, 0))).toBe(MUSIC_TRACKS.DAY)
  })

  it('keeps day through 17:59', () => {
    expect(chooseMusicTrack(null, localTime(17, 59))).toBe(MUSIC_TRACKS.DAY)
  })

  it('uses night from 18:00', () => {
    expect(chooseMusicTrack(null, localTime(18, 0))).toBe(MUSIC_TRACKS.NIGHT)
  })

  it('uses night while the player is asleep, even during day hours', () => {
    expect(chooseMusicTrack(690, localTime(12, 0))).toBe(MUSIC_TRACKS.NIGHT)
  })
})
