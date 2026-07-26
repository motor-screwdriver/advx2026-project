import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import type { MiFitnessRegion } from '../contracts/mifit'

/** Cached sleep plan from the LLM analyst. */
export interface CachedSleepPlan {
  fetchedAt: string
  status: 'ok' | 'no_data'
  lumaMessage: string
  plan?: {
    bedTime: string
    wakeTime: string
    ritualSteps: string[]
    reason: string
  }
  stats?: {
    totalNights: number
    avgDurationMin: number
    avgBedTime: string
    avgWakeTime: string
    avgDeepPct: number
    consistencyScore: number
  }
}

type ProcessLike = { env?: Record<string, string | undefined> }
const nodeEnv = (globalThis as typeof globalThis & { process?: ProcessLike }).process?.env?.NODE_ENV
const isServerRender = typeof window === 'undefined' && nodeEnv !== 'test'
const serverStorage: StateStorage = {
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
}
const mifitMetaStorage = createJSONStorage(() => (isServerRender ? serverStorage : AsyncStorage))

export interface MiFitnessMetaStore {
  connected: boolean
  region: MiFitnessRegion | null
  savedAt: string | null
  lastError: string | null
  hydrated: boolean
  sleepPlan: CachedSleepPlan | null
  setConnected: (region: MiFitnessRegion, savedAt: string) => void
  setLastError: (message: string | null) => void
  setSleepPlan: (plan: CachedSleepPlan) => void
  clearSleepPlan: () => void
  disconnectMeta: () => void
  reset: () => void
}

const initial = () => ({
  connected: false,
  region: null,
  savedAt: null,
  lastError: null,
  hydrated: false,
  sleepPlan: null,
})

export const useMiFitnessStore = create<MiFitnessMetaStore>()(
  persist(
    (set, get) => ({
      ...initial(),
      setConnected: (region, savedAt) => set({ connected: true, region, savedAt, lastError: null }),
      setLastError: (message) => set({ lastError: message }),
      setSleepPlan: (plan) => set({ sleepPlan: plan }),
      clearSleepPlan: () => set({ sleepPlan: null }),
      disconnectMeta: () =>
        set({ connected: false, region: null, savedAt: null, lastError: null, sleepPlan: null }),
      reset: () => set({ ...initial(), hydrated: get().hydrated }),
    }),
    {
      name: '8bit-sleep/mifit-meta',
      storage: mifitMetaStorage,
      partialize: (s) => ({
        connected: s.connected,
        region: s.region,
        savedAt: s.savedAt,
        lastError: s.lastError,
        sleepPlan: s.sleepPlan,
      }),
      onRehydrateStorage: () => () => {
        if (!isServerRender) {
          useMiFitnessStore.setState({ hydrated: true })
        }
      },
    },
  ),
)
