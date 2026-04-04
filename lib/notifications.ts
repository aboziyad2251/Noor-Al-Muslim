import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getTodayPrayerTimes } from './prayer';

/** True only on native Android/iOS — expo-notifications is not supported on web */
const isNative = Platform.OS !== 'web';

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
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    // Main channel — all prayers except Fajr
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'مواقيت الصلاة',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'all.mp3',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
    });

    // Fajr channel — separate sound
    await Notifications.setNotificationChannelAsync('prayer-fajr', {
      name: 'أذان الفجر',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'fajr.mp3',
      vibrationPattern: [0, 500, 250, 500],
      enableVibrate: true,
    });

    // Reminder channel — no custom sound
    await Notifications.setNotificationChannelAsync('prayer-reminder', {
      name: 'تذكير الصلاة',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  return true;
}

/**
 * Schedule prayer notifications for the next 7 days.
 * Also schedules a "missed prayer" follow-up 30 min after each prayer.
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
    .filter((n) => n.content.data?.type === 'prayer' || n.content.data?.type === 'missed-prayer')
    .map((n) => n.identifier);
  await Promise.all(prayerIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  const now = new Date();

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const times = getTodayPrayerTimes(lat, lng, date);

    for (const [key, arabicName] of Object.entries(PRAYER_ARABIC)) {
      if (key === 'sunrise') continue;
      if (!enabledPrayers.has(key)) continue;

      const prayerTime = times[key as keyof typeof times] as Date;
      if (prayerTime <= now) continue;

      const isFajr = key === 'fajr';
      const channelId = isFajr ? 'prayer-fajr' : 'prayer-times';
      const sound = isFajr ? 'fajr.mp3' : 'all.mp3';

      // Main prayer notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${arabicName}`,
          body: ADHAN_MESSAGES[key],
          sound,
          data: { type: 'prayer', prayer: key },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: prayerTime,
          channelId,
        },
      });

      // Missed prayer reminder — 30 min after prayer time (Part 4D)
      const reminderTime = new Date(prayerTime.getTime() + 30 * 60 * 1000);
      if (reminderTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ هل صليت ${arabicName}؟`,
            body: 'لا تنسَ تسجيل صلاتك — الحفاظ على الصلاة من أعظم العبادات',
            sound: 'default',
            data: { type: 'missed-prayer', prayer: key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderTime,
            channelId: 'prayer-reminder',
          },
        });
      }
    }
  }
}

/**
 * Schedule Suhoor reminder X minutes before Fajr.
 * Cancels any existing Suhoor notification first.
 */
export async function scheduleSuhoorReminder(
  fajrTime: Date,
  minutesBefore: number = 30,
): Promise<void> {
  if (!isNative) return; // Web push for fasting reminders is not supported
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel previous suhoor notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const suhoorIds = scheduled
    .filter((n) => n.content.data?.type === 'suhoor')
    .map((n) => n.identifier);
  await Promise.all(suhoorIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  const suhoorTime = new Date(fajrTime.getTime() - minutesBefore * 60_000);
  if (suhoorTime <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 تذكير السحور',
      body: `تبقى ${minutesBefore} دقيقة على أذان الفجر — لا تفوّت سحورك`,
      sound: 'default',
      data: { type: 'suhoor' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: suhoorTime,
      channelId: 'prayer-reminder',
    },
  });
}

/**
 * Schedule Iftar reminder at Maghrib time.
 * Cancels any existing Iftar notification first.
 */
export async function scheduleIftarReminder(maghribTime: Date): Promise<void> {
  if (!isNative) return; // Web push for fasting reminders is not supported
  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Cancel previous iftar notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const iftarIds = scheduled
    .filter((n) => n.content.data?.type === 'iftar')
    .map((n) => n.identifier);
  await Promise.all(iftarIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));

  if (maghribTime <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 حان وقت الإفطار',
      body: 'اللهم لك صمت وعلى رزقك أفطرت — مبارك عليك إفطارك',
      sound: 'all.mp3',
      data: { type: 'iftar' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: maghribTime,
      channelId: 'prayer-times',
    },
  });
}

/**
 * Cancel both Suhoor and Iftar reminders.
 */
export async function cancelFastingReminders(): Promise<void> {
  if (!isNative) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => n.content.data?.type === 'suhoor' || n.content.data?.type === 'iftar')
    .map((n) => n.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

/**
 * Schedule a single daily reminder (e.g. morning adhkar at 7am)
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string,
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default', data: { type: 'reminder' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'prayer-reminder',
    },
  });
}
