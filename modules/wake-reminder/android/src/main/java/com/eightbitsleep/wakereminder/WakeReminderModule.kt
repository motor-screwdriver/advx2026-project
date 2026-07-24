package com.eightbitsleep.wakereminder

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WakeReminderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WakeReminder")

    OnCreate {
      appContext.reactContext?.let { registerUnlockReceiver(it.applicationContext) }
    }

    Function("setSleepReminderActive") { active: Boolean, earliestNotifyClockMin: Int ->
      appContext.reactContext?.let {
        SleepReminder.setActive(it.applicationContext, active, earliestNotifyClockMin)
      }
    }
  }

  private fun registerUnlockReceiver(context: Context) {
    val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(UnlockReceiver(), filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      context.registerReceiver(UnlockReceiver(), filter)
    }
  }
}
