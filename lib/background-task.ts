import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayPrayerTimes } from './prayer';
import { LOCATION_STORAGE_KEY, SavedLocation } from './cities';

const TASK_NAME = 'PRAYER_BACKGROUND_REFRESH';
const SETTINGS_KEY = 'noor_notif_settings';
const ALL_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_ARABIC: Record<string, string> = {
  fajr:    'الفجر',
  dhuhr:   'الظهر',
  asr:     'العصر',
  maghrib: 'المغرب',
  isha:    'العشاء',
};

const ADHAN_MESSAGES: Record<string, string> = {
  fajr:    'حان وقت صلاة الفجر — الصلاة خير من النوم',
  dhuhr:   'حان وقت صلاة الظهر',
  asr:     'حان وقت صلاة العصر',
  maghrib: 'حان وقت صلاة المغرب',
  isha:    'حان وقت صلاة العشاء',
};

async function getEnabledPrayers(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return new Set(ALL_PRAYERS);
    const s = JSON.parse(raw);
    return new Set(ALL_PRAYERS.filter((k) => s[k] !== false));
  } catch {
    return new Set(ALL_PRAYERS);
  }
}

async function getSavedLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const saved: SavedLocation = JSON.parse(raw);
    return { lat: saved.lat, lng: saved.lng };
  } catch {
    return null;
  }
}

// Define the background task
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const location = await getSavedLocation();
    const lat = location?.lat ?? 21.3891;
    const lng = location?.lng ?? 39.8579;
    const enabledPrayers = await getEnabledPrayers();
    const now = new Date();

    // Cancel old prayer notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const oldIds = scheduled
      .filter((n) => n.content.data?.type === 'prayer')
      .map((n) => n.identifier);
    await Promise.all(oldIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

    // Schedule 7 days ahead
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const times = getTodayPrayerTimes(lat, lng, date);

      for (const key of ALL_PRAYERS) {
        if (!enabledPrayers.has(key)) continue;
        const prayerTime = times[key as keyof typeof times] as Date;
        if (prayerTime <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 ${PRAYER_ARABIC[key]}`,
            body: ADHAN_MESSAGES[key],
            sound: key === 'fajr' ? 'fajr.wav' : 'all.wav',
            data: { type: 'prayer', prayer: key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayerTime,
            channelId: 'prayer-times',
          },
        });
      }
    }

    // Update Android widget with next prayer
    if (Platform.OS === 'android' && NativeModules.PrayerWidgetModule) {
      const todayTimes = getTodayPrayerTimes(lat, lng);
      const upcoming = ALL_PRAYERS
        .map((k) => ({ key: k, time: todayTimes[k as keyof typeof todayTimes] as Date }))
        .filter((p) => p.time > now)
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      if (upcoming.length > 0) {
        const next = upcoming[0];
        const mins = Math.floor((next.time.getTime() - now.getTime()) / 60000);
        const timeLabel = next.time.toLocaleTimeString('ar-SA', {
          hour: '2-digit', minute: '2-digit', hour12: true,
        });
        NativeModules.PrayerWidgetModule.updateWidgetData(
          PRAYER_ARABIC[next.key], timeLabel, mins
        );
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background task. Safe to call multiple times.
 */
export async function registerBackgroundTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 60 * 60 * 12, // 12 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch not supported on this platform/simulator
  }
}
