import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';

const PRAYER_LOG_KEY = 'noor_prayer_logs';
const FASTING_LOG_KEY = 'noor_fasting_logs';

/**
 * Called once when a guest user signs in or creates an account.
 * Uploads all locally stored prayer logs and fasting logs to Supabase
 * so no data is lost after authentication.
 */
export async function syncLocalDataToSupabase(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await Promise.all([
    syncPrayerLogs(supabase, userId),
    syncFastingLogs(supabase, userId),
  ]);
}

async function syncPrayerLogs(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_LOG_KEY);
    if (!raw) return;

    // Format: { "YYYY-MM-DD": { "الفجر": "jamaah", ... } }
    const all: Record<string, Record<string, string>> = JSON.parse(raw);

    const rows = Object.entries(all).flatMap(([date, prayers]) =>
      Object.entries(prayers).map(([prayer_name, status]) => ({
        user_id: userId,
        prayer_name,
        logged_date: date,
        status,
      }))
    );

    if (rows.length === 0) return;

    // Batch in chunks of 100 to avoid request size limits
    for (let i = 0; i < rows.length; i += 100) {
      await supabase
        .from('prayer_logs')
        .upsert(rows.slice(i, i + 100), { onConflict: 'user_id,prayer_name,logged_date' });
    }
  } catch {
    // Non-fatal — local data remains intact
  }
}

async function syncFastingLogs(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FASTING_LOG_KEY);
    if (!raw) return;

    // Format: { "YYYY-MM-DD": "voluntary" }
    const all: Record<string, string> = JSON.parse(raw);

    const rows = Object.entries(all).map(([date, fast_type]) => ({
      user_id: userId,
      fasted_date: date,
      fast_type,
    }));

    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i += 100) {
      await supabase
        .from('fasting_logs')
        .upsert(rows.slice(i, i + 100), { onConflict: 'user_id,fasted_date' });
    }
  } catch {
    // Non-fatal
  }
}
