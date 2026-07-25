/**
 * Music transition tests: the Sleep/Wake theme swap must silence and release
 * the outgoing player (the day/night overlap bug) and ramp volumes through
 * short fades. expo-audio is faked with plain recording players; timers are
 * fake so fades are driven deterministically. jest.mock calls are hoisted
 * above this import; their factories touch `players` only lazily (inside the
 * createAudioPlayer closure), so the import order is TDZ-safe.
 */
import { playMusic, setAudioEnabled, stopMusic } from '../audio'

type FakePlayer = {
  loop: boolean
  volume: number
  play: jest.Mock
  pause: jest.Mock
  remove: jest.Mock
  seekTo: jest.Mock
}

const players: FakePlayer[] = []

jest.mock('expo-audio', () => ({
  __esModule: true,
  setAudioModeAsync: jest.fn(async () => {}),
  createAudioPlayer: jest.fn(() => {
    const player: FakePlayer = {
      loop: false,
      volume: 1,
      play: jest.fn(),
      pause: jest.fn(),
      remove: jest.fn(),
      seekTo: jest.fn(),
    }
    players.push(player)
    return player
  }),
}))

// The real manifest require()s mp3/wav assets, which ts-jest cannot load.
jest.mock('../../../assets/manifest', () => ({
  AUDIO: {
    music_day: { source: 'day', durationSec: 1, loop: true },
    music_night: { source: 'night', durationSec: 1, loop: true },
    sfx_chest: { source: 'chest', durationSec: 1, loop: false },
    sfx_damage: { source: 'damage', durationSec: 1, loop: false },
    sfx_death: { source: 'death', durationSec: 1, loop: false },
    sfx_victory: { source: 'victory', durationSec: 1, loop: false },
  },
}))

const released = (player: FakePlayer) =>
  player.pause.mock.calls.length > 0 && player.remove.mock.calls.length > 0

beforeEach(() => {
  jest.useFakeTimers()
  setAudioEnabled(true)
  stopMusic()
  players.length = 0
})

afterEach(() => {
  jest.useRealTimers()
})

describe('playMusic transitions', () => {
  it('fades the first track in from silence', () => {
    playMusic('music_day')
    const [day] = players
    expect(day.play).toHaveBeenCalled()
    expect(day.volume).toBe(0)
    jest.runAllTimers()
    expect(day.volume).toBeCloseTo(0.5)
  })

  it('fades the old track out, releases it, then fades the new one in', () => {
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_night')
    const [day] = players
    // Fade-out in progress: night player not created yet, day still audible.
    expect(players).toHaveLength(1)
    expect(released(day)).toBe(false)
    jest.runAllTimers()
    const night = players[1]
    // pause() before remove() is the actual overlap-bug fix.
    expect(day.volume).toBe(0)
    expect(released(day)).toBe(true)
    expect(night.loop).toBe(true)
    expect(night.play).toHaveBeenCalled()
    expect(night.volume).toBeCloseTo(0.5)
  })

  it('is a no-op when the track is already playing or being faded in', () => {
    playMusic('music_day')
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_day')
    expect(players).toHaveLength(1)
  })

  it('rapid re-switches leave exactly one live player', () => {
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_night') // fade-out of day starts
    playMusic('music_day') // switch back mid-transition
    jest.runAllTimers()
    const [day1, day2] = players
    expect(players).toHaveLength(2)
    expect(released(day1)).toBe(true)
    expect(released(day2)).toBe(false)
    expect(day2.volume).toBeCloseTo(0.5)
  })
})

describe('stopMusic / master toggle', () => {
  it('setAudioEnabled(false) silences immediately, even mid-fade', () => {
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_night')
    setAudioEnabled(false)
    const [day] = players
    expect(released(day)).toBe(true)
    jest.runAllTimers()
    // The pending night track must never start once sound is off.
    expect(players).toHaveLength(1)
  })
})
