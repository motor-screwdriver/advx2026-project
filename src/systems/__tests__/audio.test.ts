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
import { MUSIC_TRACKS, SFX_TRACKS } from '../audioTracks'

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
  jest.runOnlyPendingTimers()
  setAudioEnabled(false)
  jest.useRealTimers()
})

describe('playMusic transitions', () => {
  it('fades the first track in from silence', () => {
    playMusic(MUSIC_TRACKS.DAY)
    const [day] = musicPlayers()
    expect(day.play).toHaveBeenCalled()
    expect(day.volume).toBe(0)
    jest.runAllTimers()
    expect(day.volume).toBeCloseTo(0.5)
  })

  it('fades the old track out, releases it, then fades the new one in', () => {
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    playMusic(MUSIC_TRACKS.NIGHT)
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
    playMusic(MUSIC_TRACKS.DAY)
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    playMusic(MUSIC_TRACKS.DAY)
    expect(musicPlayers()).toHaveLength(1)
  })

  it('rapid re-switches leave exactly one live player', () => {
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    playMusic(MUSIC_TRACKS.NIGHT) // fade-out of day starts
    playMusic(MUSIC_TRACKS.DAY) // switch back mid-transition
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
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    playMusic(MUSIC_TRACKS.NIGHT)
    setAudioEnabled(false)
    const [day] = musicPlayers()
    expect(released(day)).toBe(true)
    jest.runAllTimers()
    // The pending night track must never start once sound is off.
    expect(musicPlayers()).toHaveLength(1)
  })
})

describe('playSfx players', () => {
  it('preloads every one-shot player at init, before any tap', () => {
    playMusic(MUSIC_TRACKS.DAY) // any audio call runs init()
    for (const source of ['chest', 'damage', 'death', 'victory']) {
      expect(sfx(source)).toBeDefined()
      expect(sfx(source).play).not.toHaveBeenCalled()
    }
  })

  it('fires instantly without an async rewind on a clip at the start', () => {
    playSfx(SFX_TRACKS.CHEST)
    expect(sfx('chest').play).toHaveBeenCalled()
    expect(sfx('chest').seekTo).not.toHaveBeenCalled()
  })

  it('rewinds before replay once the clip has advanced', () => {
    playSfx(SFX_TRACKS.DAMAGE)
    const damage = sfx('damage')
    damage.currentTime = 0.4
    playSfx(SFX_TRACKS.DAMAGE)
    expect(damage.seekTo).toHaveBeenCalledWith(0)
    expect(damage.play).toHaveBeenCalledTimes(2)
  })

  it('reuses one cached player per key across taps', () => {
    playSfx(SFX_TRACKS.DEATH)
    playSfx(SFX_TRACKS.DEATH)
    playSfx(SFX_TRACKS.VICTORY)
    expect(created.filter((p) => p.source === 'death')).toHaveLength(1)
    expect(created.filter((p) => p.source === 'victory')).toHaveLength(1)
  })

  it('stays silent while the master toggle is off', () => {
    playMusic(MUSIC_TRACKS.DAY)
    setAudioEnabled(false)
    playSfx(SFX_TRACKS.VICTORY)
    expect(sfx('victory').play).not.toHaveBeenCalled()
  })
})

describe('playSfx music pause', () => {
  it('pauses background music while a one-shot plays, then resumes it', () => {
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    const [day] = musicPlayers()

    playSfx(SFX_TRACKS.CHEST)
    expect(day.pause).toHaveBeenCalled()
    expect(day.remove).not.toHaveBeenCalled()
    expect(day.play).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(1000)
    expect(day.play).toHaveBeenCalledTimes(2)
  })

  it('restores target volume when a one-shot interrupts music fade-in', () => {
    playMusic(MUSIC_TRACKS.DAY)
    const [day] = musicPlayers()
    expect(day.volume).toBe(0)

    playSfx(SFX_TRACKS.CHEST)
    jest.advanceTimersByTime(1000)

    expect(day.volume).toBeCloseTo(0.5)
    expect(day.play).toHaveBeenCalledTimes(2)
  })

  it('waits for the last overlapping one-shot before resuming music', () => {
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    const [day] = musicPlayers()

    playSfx(SFX_TRACKS.DAMAGE)
    jest.advanceTimersByTime(500)
    playSfx(SFX_TRACKS.VICTORY)
    jest.advanceTimersByTime(500)
    expect(day.play).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(500)
    expect(day.play).toHaveBeenCalledTimes(2)
  })

  it('resumes the latest desired music track after a one-shot ends', () => {
    playMusic(MUSIC_TRACKS.DAY)
    jest.runAllTimers()
    playSfx(SFX_TRACKS.CHEST)

    playMusic(MUSIC_TRACKS.NIGHT)
    jest.advanceTimersByTime(1000)
    jest.runAllTimers()

    const night = musicPlayers().find((p) => p.source === 'night')!
    expect(night).toBeDefined()
    expect(night.play).toHaveBeenCalled()
    expect(night.volume).toBeCloseTo(0.5)
  })
})
