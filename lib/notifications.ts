import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getTodayPrayerTimes } from './prayer';

// Show notification immediately when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PRAYER_ARABIC: Record<string, string> = {
  fajr:    'الفجر',
  sunrise: 'الشروق',
  dhuhr:   'الظهر',
  asr:     'العصر',
  maghrib: 'المغرب',
  isha:    'العشاء',
};

const ADHAN_MESSAGES: Record<string, string> = {
  fajr:    'حان وقت صلاة الفجر — الصلاة خير من النوم',
  sunrise: 'شروق الشمس — وقت أذكار الصباح',
  dhuhr:   'حان وقت صلاة الظهر',
  asr:     'حان وقت صلاة العصر',
  maghrib: 'حان وقت صلاة المغرب',
  isha:    'حان وقت صلاة العشاء',
};

/**
 * Request notification permissions. Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // simulators can't receive push

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'مواقيت الصلاة',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

/**
 * Schedule prayer notifications for the next 7 days.
 * Respects per-prayer enabled settings. Cancels existing prayer notifications first.
 * @param lat latitude
 * @param lng longitude
 * @param enabledPrayers set of prayer keys to schedule (default: all 5)
 */
export async function schedulePrayerNotifications(
  lat: number,
  lng: number,
  enabledPrayers: Set<string> = new Set(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel all previously scheduled prayer notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const prayerIds = scheduled
    .filter((n) => n.content.data?.type === 'prayer')
    .map((n) => n.identifier);
  await Promise.all(prayerIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  const now = new Date();

  // Schedule 7 days ahead (5 prayers × 7 days = 35 — within the 64 notification OS limit)
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);

    const times = getTodayPrayerTimes(lat, lng, date);

    for (const [key, arabicName] of Object.entries(PRAYER_ARABIC)) {
      if (key === 'sunrise') continue;
      if (!enabledPrayers.has(key)) continue;

      const prayerTime = times[key as keyof typeof times] as Date;
      if (prayerTime <= now) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${arabicName}`,
          body: ADHAN_MESSAGES[key],
          sound: 'default',
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
}

/**
 * Schedule a single daily reminder (e.g. morning adhkar at 7am)
 */
export async function scheduleDailyReminder(hour: number, minute: number, title: string, body: string): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default', data: { type: 'reminder' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'prayer-times',
    },
  });
}
