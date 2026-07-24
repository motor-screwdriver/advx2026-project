package com.eightbitsleep.wakereminder

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Fires on device unlock. Registered at runtime from WakeReminderModule
 * (ACTION_USER_PRESENT is sent without FLAG_RECEIVER_INCLUDE_BACKGROUND, so
 * the manifest entry only helps on OEM builds that deliver it anyway).
 */
class UnlockReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_USER_PRESENT) {
      SleepReminder.onUserPresent(context.applicationContext)
    }
  }
}
