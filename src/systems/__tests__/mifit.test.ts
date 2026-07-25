import AsyncStorage from '@react-native-async-storage/async-storage'

import { useMiFitnessStore } from '../../state/mifitStore'
import {
  deleteMiFitnessSession,
  loadMiFitnessSession,
  loginToMiFitness,
  MIFIT_SESSION_KEY,
  miFitnessSessionRecord,
  saveMiFitnessSession,
} from '../mifit'

const SAVED_AT = new Date('2026-07-25T12:00:00Z')

beforeEach(async () => {
  globalThis.SecureStore.__clear()
  await AsyncStorage.clear()
  useMiFitnessStore.getState().reset()
})

describe('Mi Fitness secure session storage', () => {
  it('uses an Expo SecureStore-compatible key', () => {
    expect(MIFIT_SESSION_KEY).toMatch(/^[A-Za-z0-9._-]+$/)
  })

  it('saves, loads and deletes the reusable Xiaomi session', async () => {
    const record = miFitnessSessionRecord(
      'de',
      { security: 'base64-security', cookies: 'serviceToken=secret-cookie' },
      SAVED_AT,
    )
    await saveMiFitnessSession(record)
    await expect(loadMiFitnessSession()).resolves.toEqual(record)
    await deleteMiFitnessSession()
    await expect(loadMiFitnessSession()).resolves.toBeNull()
  })

  it('persists only non-secret Mi Fitness meta in AsyncStorage', async () => {
    useMiFitnessStore.getState().setConnected('ru', SAVED_AT.toISOString())
    useMiFitnessStore.getState().setLastError('Xiaomi authentication failed.')
    await new Promise((resolve) => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem('8bit-sleep/mifit-meta')
    expect(raw).toContain('"connected":true')
    expect(raw).toContain('"region":"ru"')
    expect(raw).not.toContain('base64-security')
    expect(raw).not.toContain('serviceToken')
    expect(raw).not.toContain('password')
    expect(raw).not.toContain('code')
    expect(raw).not.toContain('session')
  })
})

describe('Mi Fitness API client errors', () => {
  it('turns non-JSON backend responses into a useful error', async () => {
    const infoMock = jest.spyOn(console, 'info').mockImplementation()
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response)

    try {
      await expect(
        loginToMiFitness({ username: 'u', password: 'p', region: 'de' }),
      ).rejects.toThrow('Mi Fitness endpoint not found')
    } finally {
      fetchMock.mockRestore()
      infoMock.mockRestore()
    }
  })

  it('turns fetch transport failures into a reachable-backend hint', async () => {
    const infoMock = jest.spyOn(console, 'info').mockImplementation()
    const warnMock = jest.spyOn(console, 'warn').mockImplementation()
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('NetworkError'))

    try {
      await expect(
        loginToMiFitness({ username: 'u', password: 'p', region: 'de' }),
      ).rejects.toThrow('Go backend is running and reachable')
    } finally {
      fetchMock.mockRestore()
      warnMock.mockRestore()
      infoMock.mockRestore()
    }
  })
})
