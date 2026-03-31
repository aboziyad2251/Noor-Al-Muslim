import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { getTodayPrayerTimes } from '../lib/prayer';
import { schedulePrayerNotifications } from '../lib/notifications';

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
  const [cityName, setCityName] = useState('موقعك الحالي');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        let lat = 21.3891; // Mecca fallback
        let lng = 39.8579;

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;

          // Reverse geocode for city name
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place && !cancelled) {
            setCityName(place.city ?? place.region ?? 'موقعك الحالي');
          }
        } else {
          setCityName('مكة المكرمة');
        }

        let times = getTodayPrayerTimes(lat, lng);
        let now = new Date();

        let entries: PrayerEntry[] = PRAYER_NAMES.map(({ key, ar }) => ({
          name: ar,
          arabicName: ar,
          time: times[key],
          timeLabel: formatArabicTime(times[key]),
        }));

        // Find next prayer
        let upcoming = entries
          .filter((p) => p.arabicName !== 'الشروق' && p.time > now)
          .sort((a, b) => a.time.getTime() - b.time.getTime());

        let next: PrayerEntry;
        
        if (upcoming.length === 0) {
          // All prayers today finished, get tomorrow's Fajr
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

        // Schedule today's prayer notifications (fire-and-forget, non-blocking)
        schedulePrayerNotifications(lat, lng).catch(() => {});

        if (!cancelled) {
          setPrayers(entries);
          setNextPrayer(next);
          setMinutesUntilNext(Math.max(0, Math.floor((next.time.getTime() - now.getTime()) / 60000)));
          setIsLoading(false);
        }
      } catch (e) {
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
