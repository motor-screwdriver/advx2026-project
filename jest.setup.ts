/**
 * Global test environment: AsyncStorage runs against the official in-memory
 * mock. Kept in a setup file (not per-test jest.mock) so the hoisted mock
 * factory can never hit an uninitialized import binding (TDZ), regardless of
 * how prettier-plugin-organize-imports orders a test file's imports.
 */
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)
