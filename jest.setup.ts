/**
 * Global test environment: AsyncStorage runs against the official in-memory
 * mock. Kept in a setup file (not per-test jest.mock) so the hoisted mock
 * factory can never hit an uninitialized import binding (TDZ), regardless of
 * how prettier-plugin-organize-imports orders a test file's imports. The mock
 * is also assigned as a global — the store tests use it directly to assert on
 * and reset the persisted snapshot between runs.
 */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

const mockExpoConstants = {
  expoConfig: null as { hostUri?: string } | null,
  manifest: null as { debuggerHost?: string } | null,
  manifest2: null as {
    extra?: {
      expoClient?: { hostUri?: string }
      expoGo?: { debuggerHost?: string }
    }
  } | null,
}

jest.mock('expo-constants', () => ({ __esModule: true, default: mockExpoConstants }))

const mockSecureStoreData = new Map<string, string>()
function assertSecureStoreKey(key: string) {
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    throw new Error(
      'Invalid key provided to SecureStore. Keys must contain only alphanumeric characters, ".", "-", and "_".',
    )
  }
}
const mockSecureStore = {
  setItemAsync: jest.fn(async (key: string, value: string) => {
    assertSecureStoreKey(key)
    mockSecureStoreData.set(key, value)
  }),
  getItemAsync: jest.fn(async (key: string) => {
    assertSecureStoreKey(key)
    return mockSecureStoreData.get(key) ?? null
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    assertSecureStoreKey(key)
    mockSecureStoreData.delete(key)
  }),
  __clear: () => mockSecureStoreData.clear(),
}

jest.mock('expo-secure-store', () => mockSecureStore)

declare global {
  // Tests drive the mock as a bare global (see state/__tests__/store.test.ts).

  var AsyncStorage: typeof mockAsyncStorage
  var ExpoConstants: typeof mockExpoConstants
  var SecureStore: typeof mockSecureStore
}
globalThis.AsyncStorage = mockAsyncStorage
globalThis.ExpoConstants = mockExpoConstants
globalThis.SecureStore = mockSecureStore
