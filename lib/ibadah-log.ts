import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tracks azkar and Quran reading activity per day.
 * Prayer activity is already tracked in usePrayerLog via noor_prayer_logs.
 *
 * Storage format: { "YYYY-MM-DD": { azkar: true, quran: true } }
 */

const KEY = 'noor_ibadah_log';

export interface DayActivity {
  azkar?: boolean;
  quran?: boolean;
}

type IbadahLog = Record<string, DayActivity>;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

async function load(): Promise<IbadahLog> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function save(log: IbadahLog): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(log));
  } catch {}
}

export async function logAzkarCompletion(): Promise<void> {
  const log = await load();
  const today = todayISO();
  log[today] = { ...log[today], azkar: true };
  await save(log);
}

export async function logQuranReading(): Promise<void> {
  const log = await load();
  const today = todayISO();
  log[today] = { ...log[today], quran: true };
  await save(log);
}

export async function getIbadahLog(): Promise<IbadahLog> {
  return load();
}

/**
 * Returns a score 0–3 for each of the last `days` days.
 * Score = number of ibadah types completed (prayers logged + azkar + quran)
 */
export async function getHeatmapData(
  prayerLogs: Record<string, Record<string, string>>, // from usePrayerLog's local storage
  days = 90
): Promise<{ date: string; score: number }[]> {
  const ibadahLog = await load();
  const result: { date: string; score: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];

    let score = 0;
    if (prayerLogs[date] && Object.keys(prayerLogs[date]).length > 0) score++;
    if (ibadahLog[date]?.azkar) score++;
    if (ibadahLog[date]?.quran) score++;

    result.push({ date, score });
  }

  return result;
}
