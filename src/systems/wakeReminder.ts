/**
 * Wake reminder (P0): while a sleep session is active, the native Android
 * module (modules/wake-reminder) posts the "Awake, hero?" reminder on every
 * device unlock — a quick way back into the app to tap "Wake up". The module
 * exists only in dev/production builds; requireOptionalNativeModule returns
 * null in Expo Go / web / iOS, so those keep working unchanged — the same
 * degradation contract as notifications.ts.
 */
import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'

import { useGameStore } from '../state/store'
import { getNotificationsEnabled } from './notifications'

type WakeReminderNativeModule = {
  setSleepReminderActive(active: boolean): void
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
  const asleep = useGameStore.getState().pendingBedTime !== null
  native.setSleepReminderActive(asleep && (await getNotificationsEnabled()))
}
