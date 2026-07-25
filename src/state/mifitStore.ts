import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

import type { MiFitnessRegion } from '../contracts/mifit'

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
  setConnected: (region: MiFitnessRegion, savedAt: string) => void
  setLastError: (message: string | null) => void
  disconnectMeta: () => void
  reset: () => void
}

const initial = () => ({
  connected: false,
  region: null,
  savedAt: null,
  lastError: null,
  hydrated: false,
})

export const useMiFitnessStore = create<MiFitnessMetaStore>()(
  persist(
    (set, get) => ({
      ...initial(),
      setConnected: (region, savedAt) => set({ connected: true, region, savedAt, lastError: null }),
      setLastError: (message) => set({ lastError: message }),
      disconnectMeta: () => set({ connected: false, region: null, savedAt: null, lastError: null }),
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
      }),
      onRehydrateStorage: () => () => {
        if (!isServerRender) {
          useMiFitnessStore.setState({ hydrated: true })
        }
      },
    },
  ),
)
