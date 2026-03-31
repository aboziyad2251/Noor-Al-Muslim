import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export type PrayerStatus = 'jamaah' | 'on_time' | 'late' | 'qada' | 'missed';

export interface PrayerLog {
  prayer_name: string;
  status: PrayerStatus;
  logged_date: string; // YYYY-MM-DD
}

type DayLogs = Record<string, PrayerStatus>; // key = prayer_name

const LOCAL_KEY = 'noor_prayer_logs';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function loadLocal(): Promise<Record<string, DayLogs>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveLocal(all: Record<string, DayLogs>): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    // non-fatal
  }
}

export function usePrayerLog() {
  const { user } = useAuthStore();
  const [todayLogs, setTodayLogs] = useState<DayLogs>({});
  // total prayers logged (for stats)
  const [totalLogged, setTotalLogged] = useState(0);
  const [streak, setStreak] = useState(0);

  // Load today's logs from local storage on mount
  useEffect(() => {
    async function load() {
      const all = await loadLocal();
      const today = todayISO();
      setTodayLogs(all[today] ?? {});

      // Compute streak: count consecutive days with at least 1 logged prayer
      let s = 0;
      const d = new Date();
      while (true) {
        const key = d.toISOString().split('T')[0];
        if (all[key] && Object.keys(all[key]).length > 0) {
          s++;
          d.setDate(d.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(s);

      // Total count across all days
      const total = Object.values(all).reduce((sum, day) => sum + Object.keys(day).length, 0);
      setTotalLogged(total);
    }
    load();
  }, []);

  const logPrayer = useCallback(
    async (prayerName: string, status: PrayerStatus) => {
      const today = todayISO();

      // 1. Update local state immediately (optimistic)
      const updated: DayLogs = { ...todayLogs, [prayerName]: status };
      setTodayLogs(updated);

      // 2. Persist to AsyncStorage
      const all = await loadLocal();
      all[today] = updated;
      await saveLocal(all);

      // 3. Recompute stats
      const total = Object.values(all).reduce((sum, day) => sum + Object.keys(day).length, 0);
      setTotalLogged(total);

      // 4. If user is signed in, sync to Supabase
      if (user) {
        await supabase.from('prayer_logs').upsert(
          {
            user_id: user.id,
            prayer_name: prayerName,
            logged_date: today,
            status,
          },
          { onConflict: 'user_id,prayer_name,logged_date' }
        );
      }
    },
    [todayLogs, user]
  );

  return { todayLogs, logPrayer, totalLogged, streak };
}
