import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

const setSleepReminderActive = jest.fn()
const mockRequireOptionalNativeModule = jest.fn()

jest.mock('expo', () => ({
  requireOptionalNativeModule: (...args: unknown[]) => mockRequireOptionalNativeModule(...args),
}))

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }))

const NATIVE = { setSleepReminderActive }

// wakeReminder caches the native lookup at module level, so every test gets
// fresh modules (jest.resetModules) and must use the store instance from the
// same registry — hence the dynamic imports here.
async function setup() {
  const { useGameStore } = await import('../../state/store')
  const { syncWakeReminder } = await import('../wakeReminder')
  return { store: useGameStore, syncWakeReminder }
}

beforeEach(async () => {
  jest.resetModules()
  setSleepReminderActive.mockClear()
  mockRequireOptionalNativeModule.mockReset().mockReturnValue(NATIVE)
  await mockAsyncStorage.clear()
})

describe('syncWakeReminder', () => {
  it('activates the native reminder with the window-guard minute while asleep', async () => {
    const { store, syncWakeReminder } = await setup()
    store.getState().setWindow({ bedMin: 690, wakeMin: 1140 }) // 23:30 → 07:00
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    // wakeMin 1140 (07:00) − 30 min = 1110 → clock 06:30 = 390
    expect(setSleepReminderActive).toHaveBeenCalledWith(true, 390)
  })

  it('deactivates the native reminder when no sleep is active', async () => {
    const { store, syncWakeReminder } = await setup()
    store.getState().setWindow({ bedMin: 690, wakeMin: 1140 })
    await syncWakeReminder()
    expect(setSleepReminderActive).toHaveBeenCalledWith(false, -1)
  })

  it('deactivates when notifications are turned off', async () => {
    const { store, syncWakeReminder } = await setup()
    await mockAsyncStorage.setItem('8bit-sleep/notifications-enabled', 'off')
    store.getState().setWindow({ bedMin: 690, wakeMin: 1140 })
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    expect(setSleepReminderActive).toHaveBeenCalledWith(false, -1)
  })

  it('no-ops when the native module is missing (Expo Go / iOS / web)', async () => {
    mockRequireOptionalNativeModule.mockReturnValue(null)
    const { store, syncWakeReminder } = await setup()
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    expect(setSleepReminderActive).not.toHaveBeenCalled()
  })
})
