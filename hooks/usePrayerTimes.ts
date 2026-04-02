import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { getTodayPrayerTimes } from '../lib/prayer';
import { schedulePrayerNotifications } from '../lib/notifications';
import { LOCATION_STORAGE_KEY, SavedLocation } from '../lib/cities';

const { PrayerWidgetModule } = NativeModules;

const SETTINGS_KEY = 'noor_notif_settings';
const ALL_PRAYERS = new Set(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);

async function getEnabledPrayers(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return ALL_PRAYERS;
    const s = JSON.parse(raw);
    return new Set(
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter((k) => s[k] !== false)
    );
  } catch {
    return ALL_PRAYERS;
  }
}

async function resolveLocation(): Promise<{ lat: number; lng: number; cityName: string }> {
  // 1. User-saved location takes priority
  try {
    const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      const saved: SavedLocation = JSON.parse(raw);
      return { lat: saved.lat, lng: saved.lng, cityName: saved.name };
    }
  } catch {}

  // 2. Fall back to GPS
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const cityName = place?.city ?? place?.region ?? 'موقعك الحالي';
      return { lat: loc.coords.latitude, lng: loc.coords.longitude, cityName };
    }
  } catch {}

  // 3. Final fallback — Mecca
  return { lat: 21.3891, lng: 39.8579, cityName: 'مكة المكرمة' };
}

export interface PrayerEntry {
  name: string;
  arabicName: string;
  time: Date;
  timeLabel: string;
}

interface UsePrayerTimesResult {
  prayers: PrayerEntry[];
  nextPrayer: PrayerEntry | null;
  minutesUntilNext: number;
  cityName: string;
  isLoading: boolean;
  error: string | null;
}

const PRAYER_NAMES: { key: keyof ReturnType<typeof getTodayPrayerTimes>; ar: string; en: string }[] = [
  { key: 'fajr',    ar: 'الفجر',   en: 'Fajr' },
  { key: 'sunrise', ar: 'الشروق',  en: 'Sunrise' },
  { key: 'dhuhr',   ar: 'الظهر',   en: 'Dhuhr' },
  { key: 'asr',     ar: 'العصر',   en: 'Asr' },
  { key: 'maghrib', ar: 'المغرب',  en: 'Maghrib' },
  { key: 'isha',    ar: 'العشاء',  en: 'Isha' },
];

function formatArabicTime(date: Date): string {
  return date.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerEntry | null>(null);
  const [minutesUntilNext, setMinutesUntilNext] = useState(0);
  const [cityName, setCityName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { lat, lng, cityName: city } = await resolveLocation();

        if (!cancelled) setCityName(city);

        const times = getTodayPrayerTimes(lat, lng);
        const now = new Date();

        const entries: PrayerEntry[] = PRAYER_NAMES.map(({ key, ar }) => ({
          name: ar,
          arabicName: ar,
          time: times[key],
          timeLabel: formatArabicTime(times[key]),
        }));

        const upcoming = entries
          .filter((p) => p.arabicName !== 'الشروق' && p.time > now)
          .sort((a, b) => a.time.getTime() - b.time.getTime());

        let next: PrayerEntry;

        if (upcoming.length === 0) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowTimes = getTodayPrayerTimes(lat, lng, tomorrow);
          next = {
            name: 'Fajr',
            arabicName: 'الفجر',
            time: tomorrowTimes.fajr,
            timeLabel: formatArabicTime(tomorrowTimes.fajr),
          };
        } else {
          next = upcoming[0];
        }

        // Schedule 7-day prayer notifications respecting per-prayer settings
        getEnabledPrayers().then((enabled) => schedulePrayerNotifications(lat, lng, enabled)).catch(() => {});

        // Update Android home screen widget with prayer epoch times for live countdown
        if (Platform.OS === 'android' && PrayerWidgetModule) {
          const mins = Math.max(0, Math.floor((next.time.getTime() - now.getTime()) / 60000));
          const prayerEpochs = {
            fajr:    times.fajr.getTime(),
            dhuhr:   times.dhuhr.getTime(),
            asr:     times.asr.getTime(),
            maghrib: times.maghrib.getTime(),
            isha:    times.isha.getTime(),
          };
          PrayerWidgetModule.updateWidgetData(next.arabicName, next.timeLabel, mins, prayerEpochs);
        }

        if (!cancelled) {
          setPrayers(entries);
          setNextPrayer(next);
          setMinutesUntilNext(Math.max(0, Math.floor((next.time.getTime() - now.getTime()) / 60000)));
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('تعذّر الحصول على مواقيت الصلاة');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { prayers, nextPrayer, minutesUntilNext, cityName, isLoading, error };
}
