package noor.zimura.digital

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.widget.RemoteViews

class PrayerWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
        scheduleMinuteAlarm(context)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        scheduleMinuteAlarm(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        cancelMinuteAlarm(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        when (intent.action) {
            ACTION_TICK, Intent.ACTION_BOOT_COMPLETED -> {
                val manager = AppWidgetManager.getInstance(context)
                val ids = manager.getAppWidgetIds(ComponentName(context, PrayerWidget::class.java))
                for (id in ids) {
                    updateWidget(context, manager, id)
                }
                // Always chain the next exact alarm (one-shot → reschedule pattern)
                if (ids.isNotEmpty()) scheduleMinuteAlarm(context)
            }
        }
    }

    companion object {
        const val PREFS_NAME = "PrayerWidgetPrefs"
        const val ACTION_TICK = "noor.zimura.digital.WIDGET_TICK"

        fun scheduleMinuteAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, PrayerWidget::class.java).apply {
                action = ACTION_TICK
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context, 1001, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val triggerAt = SystemClock.elapsedRealtime() + 60_000L
            // Use exact alarm that wakes device — chains itself on each tick
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent
                    )
                } else {
                    // No exact alarm permission — fall back to inexact wakeup
                    alarmManager.set(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent
                    )
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent
                )
            }
        }

        private fun cancelMinuteAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, PrayerWidget::class.java).apply {
                action = ACTION_TICK
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context, 1001, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmManager.cancel(pendingIntent)
        }

        fun updateWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            // Read stored prayer times (epoch millis) and find next prayer
            val now = System.currentTimeMillis()
            var nextName = prefs.getString("prayer_name", "---") ?: "---"
            var nextTimeLabel = prefs.getString("time_label", "--:--") ?: "--:--"
            var minutesUntil = 0

            // Try to compute live countdown from stored prayer epochs
            val prayers = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
            val arabicNames = mapOf(
                "fajr" to "الفجر", "dhuhr" to "الظهر",
                "asr" to "العصر", "maghrib" to "المغرب", "isha" to "العشاء"
            )
            var found = false
            for (key in prayers) {
                val epoch = prefs.getLong("epoch_$key", 0L)
                if (epoch > now) {
                    nextName = arabicNames[key] ?: key
                    val diffMs = epoch - now
                    minutesUntil = (diffMs / 60_000).toInt()
                    // Format time label
                    val cal = java.util.Calendar.getInstance()
                    cal.timeInMillis = epoch
                    val h = cal.get(java.util.Calendar.HOUR_OF_DAY)
                    val m = cal.get(java.util.Calendar.MINUTE)
                    val amPm = if (h < 12) "ص" else "م"
                    val displayH = if (h == 0) 12 else if (h > 12) h - 12 else h
                    nextTimeLabel = "%02d:%02d %s".format(displayH, m, amPm)
                    found = true
                    break
                }
            }
            if (!found) {
                // All prayers passed today — show stored values from JS
                minutesUntil = prefs.getInt("minutes_until", 0)
            }

            val countdown = when {
                minutesUntil <= 0 -> "الآن"
                minutesUntil < 60 -> "خلال $minutesUntil دقيقة"
                else -> {
                    val h = minutesUntil / 60
                    val m = minutesUntil % 60
                    if (m > 0) "خلال $h ساعة و$m دقيقة" else "خلال $h ساعة"
                }
            }

            val views = RemoteViews(context.packageName, R.layout.prayer_widget)
            views.setTextViewText(R.id.widget_prayer_name, nextName)
            views.setTextViewText(R.id.widget_time_label, nextTimeLabel)
            views.setTextViewText(R.id.widget_countdown, countdown)

            // Tap widget → open app
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_prayer_name, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
