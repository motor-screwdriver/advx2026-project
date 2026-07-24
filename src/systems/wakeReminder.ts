/**
 * Wake reminder (P0): while a sleep session is active, the native Android
 * module (modules/wake-reminder) watches for device unlock and posts the
 * "Morning, hero!" reminder. The module exists only in dev/production builds;
 * requireOptionalNativeModule returns null in Expo Go / web / iOS, so those
 * keep working unchanged — the same degradation contract as notifications.ts.
 */
import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'

import { useGameStore } from '../state/store'
import { getNotificationsEnabled } from './notifications'
import { nightLineToClockMin, shiftNightLine } from './scheduleMath'

/** Unlocking this many minutes before the window wake time still counts as night. */
const MORNING_GUARD_MIN = 30

type WakeReminderNativeModule = {
  setSleepReminderActive(active: boolean, earliestNotifyClockMin: number): void
}

let cached: WakeReminderNativeModule | null | undefined

function loadNative(): WakeReminderNativeModule | null {
  if (cached === undefined) {
    try {
      cached =
        Platform.OS === 'android'
          ? requireOptionalNativeModule<WakeReminderNativeModule>('WakeReminder')
          : null
    } catch {
      cached = null
    }
  }
  return cached
}

/** Mirror the sleep-session state into the native side. Fire-and-forget. */
export async function syncWakeReminder(): Promise<void> {
  const native = loadNative()
  if (!native) {
    return
  }
  const { pendingBedTime, game } = useGameStore.getState()
  const active = pendingBedTime !== null && (await getNotificationsEnabled())
  const earliestClockMin =
    active && game.window
      ? nightLineToClockMin(shiftNightLine(game.window.wakeMin, -MORNING_GUARD_MIN))
      : -1
  native.setSleepReminderActive(active, earliestClockMin)
}
