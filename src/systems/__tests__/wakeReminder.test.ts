import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

const scheduleNotificationAsync = jest.fn()
const dismissNotificationAsync = jest.fn()

jest.mock('expo-notifications/build/scheduleNotificationAsync', () => ({
  default: (...args: unknown[]) => scheduleNotificationAsync(...args),
}))

jest.mock('expo-notifications/build/dismissNotificationAsync', () => ({
  default: (...args: unknown[]) => dismissNotificationAsync(...args),
}))

jest.mock('expo-notifications/build/NotificationsEmitter', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
}))

const getPermissionsAsync = jest.fn()

jest.mock('expo-notifications/build/NotificationsHandler', () => ({
  setNotificationHandler: jest.fn(),
}))

jest.mock('expo-notifications/build/NotificationPermissions', () => ({
  getPermissionsAsync: (...args: unknown[]) => getPermissionsAsync(...args),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}))

jest.mock('expo-notifications/build/setNotificationChannelAsync', () => ({
  default: jest.fn(),
}))

const routerPush = jest.fn()

jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => routerPush(...args) } }))

jest.mock('expo', () => ({ isRunningInExpoGo: () => false }))

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }))

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
  for (const fn of [scheduleNotificationAsync, dismissNotificationAsync]) {
    fn.mockClear().mockResolvedValue(undefined)
  }
  getPermissionsAsync.mockReset().mockResolvedValue({ granted: true, canAskAgain: true })
  await mockAsyncStorage.clear()
})

describe('syncWakeReminder', () => {
  it('posts the ongoing reminder while a sleep session is active', async () => {
    const { store, syncWakeReminder } = await setup()
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'wake-reminder-ongoing',
        trigger: { channelId: 'wake-reminder' },
        content: expect.objectContaining({
          sticky: true,
          autoDismiss: false,
          data: { wakeReminder: true },
        }),
      }),
    )
    expect(dismissNotificationAsync).not.toHaveBeenCalled()
  })

  it('dismisses the reminder when no sleep is active', async () => {
    const { syncWakeReminder } = await setup()
    await syncWakeReminder()
    expect(dismissNotificationAsync).toHaveBeenCalledWith('wake-reminder-ongoing')
    expect(scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('dismisses the reminder when notifications are turned off', async () => {
    const { store, syncWakeReminder } = await setup()
    await mockAsyncStorage.setItem('8bit-sleep/notifications-enabled', 'off')
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    expect(dismissNotificationAsync).toHaveBeenCalledWith('wake-reminder-ongoing')
    expect(scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('does not post when OS notification permission is denied', async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false })
    const { store, syncWakeReminder } = await setup()
    store.setState({ pendingBedTime: 690 })
    await syncWakeReminder()
    expect(scheduleNotificationAsync).not.toHaveBeenCalled()
  })

  it('no-ops where the native module cannot load (web)', async () => {
    jest.doMock('expo-notifications/build/scheduleNotificationAsync', () => {
      throw new Error('native module unavailable')
    })
    const { store, syncWakeReminder } = await setup()
    store.setState({ pendingBedTime: 690 })
    await expect(syncWakeReminder()).resolves.toBeUndefined()
    expect(scheduleNotificationAsync).not.toHaveBeenCalled()
  })
})
