/**
 * Game store: zustand + AsyncStorage persistence (spec NFR-09).
 * All rules live in src/engine (pure); this file only wires state, the
 * weekly-charge meta and events. Persisted after every action, so the
 * app restores correctly even if killed between "Sleep" and "Wake up".
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { GameEvent } from '../contracts/events'
import type {
  ArtifactId,
  ChestLoot,
  GameState,
  NightEvaluation,
  SleepWindow,
} from '../contracts/types'
import { MAX_HP } from '../engine/levels'
import { canResurrect as canResurrectEngine } from '../engine/resurrection'
import { nowNightLine } from '../engine/time'
import {
  freshHero,
  openGrantedChest,
  runNightTurn,
  tryChangeWindow,
  tryResurrect,
  tryUseHourglass,
} from './actions'

/** Weekly charges and cooldowns that are not part of the frozen GameState. */
export interface EngineMeta {
  windowChangedAt: string | null
  secondWindUsedAt: string | null // Second Wind artifact
}

export interface GameStore {
  game: GameState
  meta: EngineMeta
  pendingBedTime: number | null
  pendingWakeTime: number | null
  lastEvaluation: NightEvaluation | null
  pendingChest: boolean
  hydrated: boolean
  events: GameEvent[]
  setWindow: (window: SleepWindow) => void
  assignHeroForWindow: () => void
  checkIn: (type: 'bed' | 'wake', atMin?: number) => void
  evaluateCurrentNight: (now?: Date) => NightEvaluation
  canResurrect: (now?: Date) => boolean
  applyResurrection: (success: boolean, now?: Date) => void
  startNewHero: () => void
  openChest: (rng?: () => number) => ChestLoot | null
  equip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void
  changeWindow: (window: SleepWindow, now?: Date) => boolean
  useHourglass: (date: string, now?: Date) => boolean
  toggleDemoMode: () => void
  reset: () => void
}

function emptyGame(): GameState {
  return {
    window: null,
    hero: null,
    hp: MAX_HP,
    perfectWeekStreak: 0,
    nights: [],
    artifacts: [],
    equipped: { armor: null, charm: null },
    lastResurrectionAt: null,
    onboardingDone: false,
    demoMode: false,
  }
}

const emptyMeta = (): EngineMeta => ({
  windowChangedAt: null,
  secondWindUsedAt: null,
})

const initial = () => ({
  game: emptyGame(),
  meta: emptyMeta(),
  pendingBedTime: null,
  pendingWakeTime: null,
  lastEvaluation: null,
  pendingChest: false,
  hydrated: false,
  events: [] as GameEvent[],
})

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial(),
      setWindow: (window) => set((s) => ({ game: { ...s.game, window } })),
      assignHeroForWindow: () =>
        set((s) =>
          s.game.window
            ? {
                game: {
                  ...s.game,
                  hero: freshHero(s.game.window),
                  hp: MAX_HP,
                  perfectWeekStreak: 0,
                  onboardingDone: true,
                },
              }
            : s,
        ),
      checkIn: (type, atMin = nowNightLine()) =>
        set(type === 'bed' ? { pendingBedTime: atMin } : { pendingWakeTime: atMin }),
      evaluateCurrentNight: (now = new Date()) => runNightTurn(get, set, now),
      canResurrect: (now = new Date()) => canResurrectEngine(get().game.lastResurrectionAt, now),
      applyResurrection: (success, now = new Date()) => tryResurrect(get, set, success, now),
      startNewHero: () =>
        set((s) =>
          s.game.window
            ? {
                game: {
                  ...s.game,
                  hero: freshHero(s.game.window),
                  hp: MAX_HP,
                  perfectWeekStreak: 0,
                  artifacts: [],
                  equipped: { armor: null, charm: null },
                },
              }
            : { game: emptyGame() },
        ),
      openChest: (rng = Math.random) => openGrantedChest(get, set, rng),
      equip: (slot, artifact) =>
        set((s) =>
          s.game.artifacts.includes(artifact)
            ? { game: { ...s.game, equipped: { ...s.game.equipped, [slot]: artifact } } }
            : s,
        ),
      changeWindow: (window, now = new Date()) => tryChangeWindow(get, set, window, now),
      useHourglass: (date, now = new Date()) => tryUseHourglass(get, set, date, now),
      toggleDemoMode: () => set((s) => ({ game: { ...s.game, demoMode: !s.game.demoMode } })),
      // Keep hydrated: GameProvider unmounts the navigator while !hydrated, so a
      // reset that drops it kills the very navigation the caller triggers next.
      reset: () => set({ ...initial(), hydrated: get().hydrated }),
    }),
    {
      name: '8bit-sleep/game',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        game: s.game,
        meta: s.meta,
        pendingBedTime: s.pendingBedTime,
        pendingWakeTime: s.pendingWakeTime,
        pendingChest: s.pendingChest,
        lastEvaluation: s.lastEvaluation,
      }),
      onRehydrateStorage: () => () => {
        useGameStore.setState({ hydrated: true })
      },
    },
  ),
)
