/**
 * Wake reminder (P0): while a sleep session is active, an ongoing local
 * notification sits in the shade (and on the lock screen) — the user unlocks
 * the phone and the quick way back into the app is right there. Tap it to land
 * on Home, where the "Wake up" button finishes the night.
 *
 * Local notifications work everywhere, Expo Go included — only REMOTE push was
 * removed from Expo Go in SDK 53. Importing the package index there logs a
 * remote-push error, so this module deep-imports only the local-notification
 * files, which pull in no push-token code. Unlike the scheduled reminders in
 * notifications.ts (skipped in Expo Go), this reminder is event-driven state,
 * so it must load in Expo Go too. On web the native module cannot load and
 * everything silently no-ops.
 */
import { Platform } from 'react-native'

import { useGameStore } from '../state/store'
import { cloudGo } from '../ui/screenTransition'
import { getNotificationsEnabled } from './notifications'
import { WAKE_REMINDER_BODY, WAKE_REMINDER_SUBTITLE, WAKE_REMINDER_TITLE } from './reminderLines'

const REMINDER_ID = 'wake-reminder-ongoing'

type Notifications = typeof import('expo-notifications')
type NotificationResponse = import('expo-notifications').NotificationResponse

type LocalNotificationsApi = Pick<
  Notifications,
  | 'scheduleNotificationAsync'
  | 'dismissNotificationAsync'
  | 'addNotificationResponseReceivedListener'
  | 'getLastNotificationResponseAsync'
  | 'setNotificationHandler'
  | 'getPermissionsAsync'
  | 'requestPermissionsAsync'
  | 'setNotificationChannelAsync'
>

let cached: LocalNotificationsApi | null | undefined

function loadLocal(): LocalNotificationsApi | null {
  if (cached === undefined) {
    try {
      cached =
        Platform.OS === 'web'
          ? null
          : {
              /* eslint-disable @typescript-eslint/no-require-imports */
              scheduleNotificationAsync:
                require('expo-notifications/build/scheduleNotificationAsync').default,
              dismissNotificationAsync: require('expo-notifications/build/dismissNotificationAsync')
                .default,
              addNotificationResponseReceivedListener:
                require('expo-notifications/build/NotificationsEmitter')
                  .addNotificationResponseReceivedListener,
              getLastNotificationResponseAsync:
                require('expo-notifications/build/NotificationsEmitter')
                  .getLastNotificationResponseAsync,
              setNotificationHandler: require('expo-notifications/build/NotificationsHandler')
                .setNotificationHandler,
              getPermissionsAsync: require('expo-notifications/build/NotificationPermissions')
                .getPermissionsAsync,
              requestPermissionsAsync: require('expo-notifications/build/NotificationPermissions')
                .requestPermissionsAsync,
              setNotificationChannelAsync:
                require('expo-notifications/build/setNotificationChannelAsync').default,
              /* eslint-enable @typescript-eslint/no-require-imports */
            }
    } catch {
      cached = null
    }
  }
  return cached
}

const CHANNEL_ID = 'wake-reminder'

async function ensureReady(n: LocalNotificationsApi): Promise<boolean> {
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Wake-up reminder',
      importance: 4, // AndroidImportance.HIGH — surfaces on the lock screen
      sound: null,
    })
  }
  const current = await n.getPermissionsAsync()
  if (current.granted) {
    return true
  }
  if (!current.canAskAgain) {
    return false
  }
  return (await n.requestPermissionsAsync()).granted
}

/** Mirror the sleep-session state into the shade. Fire-and-forget. */
export async function syncWakeReminder(): Promise<void> {
  const n = loadLocal()
  if (!n) {
    return
  }
  const asleep = useGameStore.getState().pendingBedTime !== null
  const active = asleep && (await getNotificationsEnabled())
  try {
    if (active) {
      if (!(await ensureReady(n))) {
        return // no OS permission — the game still works
      }
      await n.scheduleNotificationAsync({
        identifier: REMINDER_ID,
        content: {
          title: WAKE_REMINDER_TITLE,
          subtitle: WAKE_REMINDER_SUBTITLE, // iOS: second, lighter line under the title
          body: WAKE_REMINDER_BODY,
          data: { wakeReminder: true },
          sticky: true, // ongoing: cannot be swiped away while the hero sleeps
          autoDismiss: false, // a tap opens the app but keeps the reminder
          sound: false, // appears silently at bedtime
          vibrate: [],
          color: '#eab54d',
        },
        trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
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
  const n = loadLocal()
  if (!n) {
    return
  }
  n.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true, // show even when posted while the app is foreground
      shouldShowList: true,
    }),
  })
  const isReminder = (response: NotificationResponse | null): boolean =>
    response?.notification.request.content.data?.wakeReminder === true
  n.addNotificationResponseReceivedListener((response) => {
    if (isReminder(response)) {
      cloudGo('/')
    }
  })
  void n.getLastNotificationResponseAsync().then((response) => {
    if (response && isReminder(response)) {
      cloudGo('/')
    }
  })
}
