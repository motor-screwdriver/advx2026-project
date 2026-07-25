/**
 * Audio manager tests: the Sleep/Wake theme swap must silence and release
 * the outgoing player (the day/night overlap bug) and ramp volumes through
 * short fades; one-shot SFX must be preloaded and fire without an async
 * rewind (the late-tap bug). expo-audio is faked with recording players;
 * timers are fake so fades run deterministically. jest.mock calls are
 * hoisted above this import; their factories touch `created` only lazily
 * (inside the createAudioPlayer closure), so the import order is TDZ-safe.
 */
import { playMusic, playSfx, setAudioEnabled, stopMusic } from '../audio'

type FakePlayer = {
  source: string
  loop: boolean
  volume: number
  currentTime: number
  play: jest.Mock
  pause: jest.Mock
  remove: jest.Mock
  seekTo: jest.Mock
}

// Every player ever created, across tests — SFX players live for the whole
// module lifetime, so they must stay findable after the first test.
const created: FakePlayer[] = []

jest.mock('expo-audio', () => ({
  __esModule: true,
  setAudioModeAsync: jest.fn(async () => {}),
  createAudioPlayer: jest.fn((source: string) => {
    const player: FakePlayer = {
      source,
      loop: false,
      volume: 1,
      currentTime: 0,
      play: jest.fn(),
      pause: jest.fn(),
      remove: jest.fn(),
      seekTo: jest.fn(),
    }
    created.push(player)
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

let baseline = 0

/** Music players spawned by the current test, in creation order. */
const musicPlayers = () =>
  created.slice(baseline).filter((p) => p.source === 'day' || p.source === 'night')

const sfx = (source: string) => created.find((p) => p.source === source)!

const released = (player: FakePlayer) =>
  player.pause.mock.calls.length > 0 && player.remove.mock.calls.length > 0

beforeEach(() => {
  jest.useFakeTimers()
  setAudioEnabled(true)
  stopMusic()
  jest.clearAllMocks()
  baseline = created.length
})

afterEach(() => {
  jest.useRealTimers()
})

describe('playMusic transitions', () => {
  it('fades the first track in from silence', () => {
    playMusic('music_day')
    const [day] = musicPlayers()
    expect(day.play).toHaveBeenCalled()
    expect(day.volume).toBe(0)
    jest.runAllTimers()
    expect(day.volume).toBeCloseTo(0.5)
  })

  it('fades the old track out, releases it, then fades the new one in', () => {
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_night')
    const [day] = musicPlayers()
    // Fade-out in progress: night player not created yet, day still audible.
    expect(musicPlayers()).toHaveLength(1)
    expect(released(day)).toBe(false)
    jest.runAllTimers()
    const night = musicPlayers()[1]
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
    expect(musicPlayers()).toHaveLength(1)
  })

  it('rapid re-switches leave exactly one live player', () => {
    playMusic('music_day')
    jest.runAllTimers()
    playMusic('music_night') // fade-out of day starts
    playMusic('music_day') // switch back mid-transition
    jest.runAllTimers()
    const [day1, day2] = musicPlayers()
    expect(musicPlayers()).toHaveLength(2)
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
    const [day] = musicPlayers()
    expect(released(day)).toBe(true)
    jest.runAllTimers()
    // The pending night track must never start once sound is off.
    expect(musicPlayers()).toHaveLength(1)
  })
})

describe('playSfx', () => {
  it('preloads every one-shot player at init, before any tap', () => {
    playMusic('music_day') // any audio call runs init()
    for (const source of ['chest', 'damage', 'death', 'victory']) {
      expect(sfx(source)).toBeDefined()
      expect(sfx(source).play).not.toHaveBeenCalled()
    }
  })

  it('fires instantly without an async rewind on a clip at the start', () => {
    playSfx('sfx_chest')
    expect(sfx('chest').play).toHaveBeenCalled()
    expect(sfx('chest').seekTo).not.toHaveBeenCalled()
  })

  it('rewinds before replay once the clip has advanced', () => {
    playSfx('sfx_damage')
    const damage = sfx('damage')
    damage.currentTime = 0.4
    playSfx('sfx_damage')
    expect(damage.seekTo).toHaveBeenCalledWith(0)
    expect(damage.play).toHaveBeenCalledTimes(2)
  })

  it('reuses one cached player per key across taps', () => {
    playSfx('sfx_death')
    playSfx('sfx_death')
    playSfx('sfx_victory')
    expect(created.filter((p) => p.source === 'death')).toHaveLength(1)
    expect(created.filter((p) => p.source === 'victory')).toHaveLength(1)
  })

  it('stays silent while the master toggle is off', () => {
    setAudioEnabled(false)
    playSfx('sfx_victory')
    expect(sfx('victory').play).not.toHaveBeenCalled()
  })
})
