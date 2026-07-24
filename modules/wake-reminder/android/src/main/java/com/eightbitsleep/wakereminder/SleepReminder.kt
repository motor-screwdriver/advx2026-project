package com.eightbitsleep.wakereminder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.RemoteViews
import java.util.Calendar

private const val PREFS = "wake-reminder"
private const val KEY_ACTIVE = "active"
private const val KEY_NOTIFIED = "notified"
private const val KEY_STARTED_AT = "startedAt"
private const val KEY_EARLIEST_MIN = "earliestMin"
private const val CHANNEL_ID = "wake-reminder"
private const val NOTIFICATION_ID = 4201

/**
 * Owns the wake-reminder state (SharedPreferences) and the notification itself.
 * The native side is deliberately dumb: JS decides when a sleep session is
 * active and from which wall-clock minute a reminder makes sense.
 */
object SleepReminder {

  fun setActive(context: Context, active: Boolean, earliestNotifyClockMin: Int) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (active) {
      // Keep the original startedAt on repeated activations so the one-shot
      // dedupe survives app restarts mid-session.
      if (!prefs.getBoolean(KEY_ACTIVE, false)) {
        prefs.edit()
          .putBoolean(KEY_ACTIVE, true)
          .putLong(KEY_STARTED_AT, System.currentTimeMillis())
          .putBoolean(KEY_NOTIFIED, false)
          .putInt(KEY_EARLIEST_MIN, earliestNotifyClockMin)
          .apply()
      }
    } else {
      prefs.edit().clear().apply()
      context.getSystemService(NotificationManager::class.java)?.cancel(NOTIFICATION_ID)
    }
  }

  fun onUserPresent(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    if (!prefs.getBoolean(KEY_ACTIVE, false) || prefs.getBoolean(KEY_NOTIFIED, false)) return
    val earliest = prefs.getInt(KEY_EARLIEST_MIN, -1)
    if (earliest >= 0 && nowClockMin() < earliest) return // still night — user just checks the phone
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (!manager.areNotificationsEnabled()) return
    prefs.edit().putBoolean(KEY_NOTIFIED, true).apply()
    post(context, manager)
  }

  private fun nowClockMin(): Int {
    val now = Calendar.getInstance()
    return now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
  }

  private fun post(context: Context, manager: NotificationManager) {
    ensureChannel(context, manager)
    val deepLink = PendingIntent.getActivity(
      context,
      0,
      Intent(Intent.ACTION_VIEW, Uri.parse("eightbitsleep://")).setPackage(context.packageName),
      PendingIntent.FLAG_UPDATE_CURRENT or immutableFlag(),
    )
    val expanded = RemoteViews(context.packageName, R.layout.notification_wake).apply {
      setImageViewResource(R.id.wake_icon, context.applicationInfo.icon)
      setOnClickPendingIntent(R.id.wake_button, deepLink)
    }
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
    val notification = builder
      .setSmallIcon(R.drawable.ic_wake_sun)
      .setColor(0xFFEAB54D.toInt())
      .setContentTitle(context.getString(R.string.wake_title))
      .setContentText(context.getString(R.string.wake_body))
      .setCustomBigContentView(expanded)
      .setStyle(Notification.DecoratedCustomViewStyle())
      .setContentIntent(deepLink)
      .setAutoCancel(true)
      .setOnlyAlertOnce(true)
      .setCategory(Notification.CATEGORY_REMINDER)
      .build()
    try {
      manager.notify(NOTIFICATION_ID, notification)
    } catch (_: SecurityException) {
      // POST_NOTIFICATIONS revoked between the check and the post — stay silent.
    }
  }

  private fun ensureChannel(context: Context, manager: NotificationManager) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(
          CHANNEL_ID,
          context.getString(R.string.wake_channel_name),
          NotificationManager.IMPORTANCE_HIGH,
        ),
      )
    }
  }

  private fun immutableFlag(): Int =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
}
