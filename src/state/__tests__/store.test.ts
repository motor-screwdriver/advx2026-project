import AsyncStorage from '@react-native-async-storage/async-storage'
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'
import { useGameStore } from '../store'

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

const WINDOW = { bedMin: 690, wakeMin: 1140 } // 23:30 → 07:00 → rogue
const DAY1 = new Date('2026-07-15T08:00:00Z')

function onboard(window = WINDOW) {
  useGameStore.getState().setWindow(window)
  useGameStore.getState().assignHeroForWindow()
}

function playNight(bed: number | null, wake: number | null, now: Date) {
  const s = useGameStore.getState()
  s.checkIn('bed', bed ?? 0)
  s.checkIn('wake', wake ?? 0)
  if (bed === null) {
    useGameStore.setState({ pendingBedTime: null })
  }
  if (wake === null) {
    useGameStore.setState({ pendingWakeTime: null })
  }
  return useGameStore.getState().evaluateCurrentNight(now)
}

beforeEach(async () => {
  useGameStore.getState().reset()
  await AsyncStorage.clear()
})

describe('onboarding and night flow', () => {
  it('assigns a hero from the window and onboards', () => {
    onboard()
    const { game } = useGameStore.getState()
    expect(game.hero).toMatchObject({ type: 'rogue', name: 'Rogue', level: 1 })
    expect(game.hp).toBe(7)
    expect(game.onboardingDone).toBe(true)
  })

  it('check-in → evaluate records the night and clears pendings', () => {
    onboard()
    const evaluation = playNight(690, 1140, DAY1)
    const s = useGameStore.getState()
    expect(evaluation).toMatchObject({ outcome: 'PERFECT', score: 100 })
    expect(s.game.nights).toHaveLength(1)
    expect(s.pendingBedTime).toBeNull()
    expect(s.lastEvaluation?.outcome).toBe('PERFECT')
    expect(s.events.map((e) => e.type)).toContain('NIGHT_EVALUATED')
  })
})

describe('Perfect Week and chest', () => {
  it('grants a chest at 7 clean nights; opening it adds loot', () => {
    onboard()
    for (let i = 0; i < 7; i += 1) {
      playNight(690, 1140, new Date(`2026-07-${15 + i}T08:00:00Z`))
    }
    const s = useGameStore.getState()
    expect(s.game.hero?.level).toBe(2)
    expect(s.game.perfectWeekStreak).toBe(0)
    expect(s.pendingChest).toBe(true)
    const loot = s.openChest(() => 0.8)
    expect(loot?.rarity).toBe('rare')
    expect(useGameStore.getState().game.artifacts).toContain(loot?.artifactId)
    expect(useGameStore.getState().pendingChest).toBe(false)
    expect(useGameStore.getState().openChest()).toBeNull() // no chest pending
  })

  it('any HP loss resets the streak', () => {
    onboard()
    playNight(690, 1140, DAY1)
    playNight(690, 900, new Date('2026-07-16T08:00:00Z')) // TERRIBLE
    expect(useGameStore.getState().game.perfectWeekStreak).toBe(0)
  })
})

describe('window change (1 per 7 days)', () => {
  it('blocks rapid changes; on change HP carries over, streak resets, new hero', () => {
    onboard()
    useGameStore.setState({
      game: { ...useGameStore.getState().game, hp: 4, perfectWeekStreak: 5 },
    })
    const mage = { bedMin: 720, wakeMin: 1230 }
    expect(useGameStore.getState().changeWindow(mage, DAY1)).toBe(true)
    let s = useGameStore.getState()
    expect(s.game.hero?.type).toBe('mage')
    expect(s.game.hp).toBe(4) // HP preserved (anti-exploit)
    expect(s.game.perfectWeekStreak).toBe(0)
    const in3Days = new Date('2026-07-18T08:00:00Z')
    expect(useGameStore.getState().changeWindow(WINDOW, in3Days)).toBe(false)
    const in8Days = new Date('2026-07-23T08:00:00Z')
    expect(useGameStore.getState().changeWindow(WINDOW, in8Days)).toBe(true)
    s = useGameStore.getState()
    expect(s.game.hero?.type).toBe('rogue')
  })
})

describe('persistence (NFR-09)', () => {
  it('survives a reload with hero, HP, nights, streak and pending check-in', async () => {
    onboard()
    playNight(690, 1140, DAY1)
    useGameStore.getState().checkIn('bed', 690) // app killed between Sleep and Wake
    await new Promise((resolve) => setTimeout(resolve, 0)) // let persist flush
    const saved = await AsyncStorage.getItem('8bit-sleep/game')
    useGameStore.getState().reset() // simulate process death (memory gone)
    expect(useGameStore.getState().game.hero).toBeNull()
    await AsyncStorage.setItem('8bit-sleep/game', saved!) // storage outlives the process
    await useGameStore.persist.rehydrate()
    const s = useGameStore.getState()
    expect(s.game.hero?.type).toBe('rogue')
    expect(s.game.nights).toHaveLength(1)
    expect(s.game.perfectWeekStreak).toBe(1)
    expect(s.pendingBedTime).toBe(690) // wake can still be recorded
  })
})

describe('demo mode', () => {
  it('toggles demoMode on the persisted game state', () => {
    onboard()
    useGameStore.getState().toggleDemoMode()
    expect(useGameStore.getState().game.demoMode).toBe(true)
    useGameStore.getState().toggleDemoMode()
    expect(useGameStore.getState().game.demoMode).toBe(false)
  })
})

describe('reset', () => {
  it('keeps the store hydrated so the navigator stays mounted', () => {
    onboard()
    useGameStore.setState({ hydrated: true }) // simulate post-rehydration
    useGameStore.getState().reset()
    expect(useGameStore.getState().hydrated).toBe(true) // GameProvider must not unmount the Stack
    expect(useGameStore.getState().game.hero).toBeNull()
  })
})
