/**
 * Wake reminder (P0): while a sleep session is active, an ongoing local
 * notification sits in the shade (and on the lock screen) — the user unlocks
 * the phone and the quick way back into the app is right there. Tap it to land
 * on Home, where the "Wake up" button finishes the night.
 *
 * Built on plain local expo-notifications (same mechanism as the bedtime
 * reminder): works in Expo Go and dev/production builds alike, needs no custom
 * native code, and — unlike any in-app unlock listener — survives the app
 * process being killed overnight. Where expo-notifications cannot load (web,
 * old Expo Go), everything silently no-ops and the game fully works.
 */
import { router } from 'expo-router'
import { Platform } from 'react-native'

import { useGameStore } from '../state/store'
import { getNotificationsEnabled } from './notifications'
import { WAKE_REMINDER_BODY, WAKE_REMINDER_TITLE } from './reminderLines'

const REMINDER_ID = 'wake-reminder-ongoing'

type NotificationsModule = typeof import('expo-notifications')
type NotificationResponse = import('expo-notifications').NotificationResponse

let cached: NotificationsModule | null | undefined

/** Try-require instead of an Expo Go pre-check: local notifications do work
 *  in current Expo Go; where the import genuinely fails, we stay silent. */
function loadNotifications(): NotificationsModule | null {
  if (cached === undefined) {
    try {
      cached =
        Platform.OS === 'web'
          ? null
          : // eslint-disable-next-line @typescript-eslint/no-require-imports
            (require('expo-notifications') as NotificationsModule)
    } catch {
      cached = null
    }
  }
  return cached
}

/** Mirror the sleep-session state into the shade. Fire-and-forget. */
export async function syncWakeReminder(): Promise<void> {
  const n = loadNotifications()
  if (!n) {
    return
  }
  const asleep = useGameStore.getState().pendingBedTime !== null
  const active = asleep && (await getNotificationsEnabled())
  try {
    if (active) {
      await n.scheduleNotificationAsync({
        identifier: REMINDER_ID,
        content: {
          title: WAKE_REMINDER_TITLE,
          body: WAKE_REMINDER_BODY,
          data: { wakeReminder: true },
          sticky: true, // ongoing: cannot be swiped away while the hero sleeps
          autoDismiss: false, // a tap opens the app but keeps the reminder
          sound: false, // appears silently at bedtime
          vibrate: [],
          color: '#eab54d',
        },
        trigger: null, // post immediately
      })
    } else {
      await n.dismissNotificationAsync(REMINDER_ID)
    }
  } catch {
    // Permission denied / notifications unavailable — the game still works.
  }
}

/** Taps on the reminder route to Home (wake-up button), warm or cold start. */
export function initWakeReminderListener(): void {
  const n = loadNotifications()
  if (!n) {
    return
  }
  const isReminder = (response: NotificationResponse | null): boolean =>
    response?.notification.request.content.data?.wakeReminder === true
  n.addNotificationResponseReceivedListener((response) => {
    if (isReminder(response)) {
      router.push('/')
    }
  })
  void n.getLastNotificationResponseAsync().then((response) => {
    if (response && isReminder(response)) {
      router.push('/')
    }
  })
}
