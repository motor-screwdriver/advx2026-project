/**
 * Local notifications (P0): a daily bedtime reminder 60 min before
 * window.bedMin, plus a morning summary at wakeMin+15 when the user has not
 * checked in yet. Offline-first: everything is a local push; denial is
 * graceful — the game fully works without notifications.
 * Rescheduled from scratch on window change / check-in via initSystems().
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { SleepWindow } from '../contracts/types';
import { BEDTIME_LINES, MORNING_SUMMARY_BODY, NOTIF_TITLE } from './reminderLines';
import {
  nextOccurrence,
  nextOccurrenceSkippingToday,
  nightLineToClockMin,
  pickDailyLine,
  shiftNightLine,
} from './scheduleMath';

const ENABLED_KEY = '8bit-sleep/notifications-enabled';
const BEDTIME_LEAD_MIN = 60;
const MORNING_DELAY_MIN = 15;

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'off'; // default ON
  } catch {
    return true;
  }
}

/** Settings toggle: persists the flag and wipes the schedule when turned off. */
export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'on' : 'off');
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

/** Called once from initSystems(): foreground handler + Android channel. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false; // denied permanently — stay silent, the game still works
  }
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Rebuild the whole schedule (only 2 notifications exist, so cancel-all +
 * recreate is the simplest correct strategy on every relevant change).
 */
export async function syncNotifications(
  window: SleepWindow | null,
  checkedInToday: boolean,
  now: Date = new Date(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!window || !(await getNotificationsEnabled()) || !(await ensurePermission())) {
    return;
  }
  await scheduleBedtimeReminder(window, now);
  await scheduleMorningSummary(window, checkedInToday, now);
}

/** Daily repeating push at bedMin − 60, hero-persona line rotated per day. */
async function scheduleBedtimeReminder(window: SleepWindow, now: Date): Promise<void> {
  const clockMin = nightLineToClockMin(shiftNightLine(window.bedMin, -BEDTIME_LEAD_MIN));
  await Notifications.scheduleNotificationAsync({
    content: { title: NOTIF_TITLE, body: pickDailyLine(BEDTIME_LINES, now) },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(clockMin / 60),
      minute: clockMin % 60,
    },
  });
}

/**
 * One-shot at wakeMin + 15. Already checked in today → aim for tomorrow
 * instead (re-synced on every app open / night evaluation).
 */
async function scheduleMorningSummary(
  window: SleepWindow,
  checkedInToday: boolean,
  now: Date,
): Promise<void> {
  const clockMin = nightLineToClockMin(shiftNightLine(window.wakeMin, MORNING_DELAY_MIN));
  const date = checkedInToday
    ? nextOccurrenceSkippingToday(now, clockMin)
    : nextOccurrence(now, clockMin);
  await Notifications.scheduleNotificationAsync({
    content: { title: NOTIF_TITLE, body: MORNING_SUMMARY_BODY },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
