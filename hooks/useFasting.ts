import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export type FastType = 'ramadan' | 'sunnah_mon_thu' | 'shawwal' | 'ayyam_beed' | 'voluntary';

export const FAST_TYPE_LABELS: Record<FastType, string> = {
  ramadan:       'رمضان',
  sunnah_mon_thu: 'الإثنين والخميس',
  shawwal:       'الست من شوال',
  ayyam_beed:    'أيام البيض',
  voluntary:     'تطوع',
};

export interface FastingDay {
  date: string; // YYYY-MM-DD
  type: FastType;
}

// All fasting days keyed by YYYY-MM-DD
type FastingLog = Record<string, FastType>;

const STORAGE_KEY = 'noor_fasting_logs';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function loadLocal(): Promise<FastingLog> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveLocal(log: FastingLog): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

function computeStreak(log: FastingLog): number {
  let streak = 0;
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const todayFasted = !!log[todayKey];

  const d = new Date(today);
  if (!todayFasted) d.setDate(d.getDate() - 1);

  while (true) {
    const key = d.toISOString().split('T')[0];
    if (log[key]) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getMonthLog(log: FastingLog, year: number, month: number): FastingLog {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return Object.fromEntries(
    Object.entries(log).filter(([k]) => k.startsWith(prefix))
  );
}

export interface UseFastingResult {
  todayFasted: boolean;
  todayType: FastType | null;
  streak: number;
  totalThisMonth: number;
  totalAllTime: number;
  monthLog: FastingLog;
  logFast: (type: FastType) => Promise<void>;
  unlogFast: () => Promise<void>;
}

export function useFasting(): UseFastingResult {
  const { user } = useAuthStore();
  const [log, setLog] = useState<FastingLog>({});

  useEffect(() => {
    loadLocal().then(setLog);
  }, []);

  const logFast = useCallback(async (type: FastType) => {
    const today = todayISO();
    const updated = { ...log, [today]: type };
    setLog(updated);
    await saveLocal(updated);

    if (user) {
      await supabase.from('fasting_logs').upsert(
        { user_id: user.id, fasted_date: today, fast_type: type },
        { onConflict: 'user_id,fasted_date' }
      );
    }
  }, [log, user]);

  const unlogFast = useCallback(async () => {
    const today = todayISO();
    const updated = { ...log };
    delete updated[today];
    setLog(updated);
    await saveLocal(updated);

    if (user) {
      await supabase
        .from('fasting_logs')
        .delete()
        .match({ user_id: user.id, fasted_date: today });
    }
  }, [log, user]);

  const now = new Date();
  const monthLog = getMonthLog(log, now.getFullYear(), now.getMonth());
  const today = todayISO();

  return {
    todayFasted: !!log[today],
    todayType: (log[today] as FastType) ?? null,
    streak: computeStreak(log),
    totalThisMonth: Object.keys(monthLog).length,
    totalAllTime: Object.keys(log).length,
    monthLog,
    logFast,
    unlogFast,
  };
}
