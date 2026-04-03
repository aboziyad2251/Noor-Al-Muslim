package noor.zimura.digital

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class PrayerWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PrayerWidgetModule"

    /**
     * Called from JS with next prayer info + all today's prayer epoch timestamps.
     * prayerTimes: { fajr: epoch, dhuhr: epoch, asr: epoch, maghrib: epoch, isha: epoch }
     */
    @ReactMethod
    fun updateWidgetData(prayerName: String, timeLabel: String, minutesUntil: Int, prayerTimes: ReadableMap?) {
        val prefs = reactContext.getSharedPreferences(
            PrayerWidget.PREFS_NAME, Context.MODE_PRIVATE
        )
        val editor = prefs.edit()
            .putString("prayer_name", prayerName)
            .putString("time_label", timeLabel)
            .putInt("minutes_until", minutesUntil)

        // Store each prayer's epoch millis so the widget can self-compute countdown
        if (prayerTimes != null) {
            val prayers = listOf("fajr", "dhuhr", "asr", "maghrib", "isha")
            for (key in prayers) {
                if (prayerTimes.hasKey(key)) {
                    editor.putLong("epoch_$key", prayerTimes.getDouble(key).toLong())
                }
            }
        }
        editor.apply()

        // Push update to all active prayer widgets
        val manager = AppWidgetManager.getInstance(reactContext)
        val ids = manager.getAppWidgetIds(
            ComponentName(reactContext, PrayerWidget::class.java)
        )
        for (id in ids) {
            PrayerWidget.updateWidget(reactContext, manager, id)
        }
    }
}
