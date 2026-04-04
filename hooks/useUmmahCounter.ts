import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UmmahCounts {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  total: number;
}

const PRAYER_LABELS: Record<keyof Omit<UmmahCounts, 'total'>, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function useUmmahCounter() {
  const [counts, setCounts] = useState<UmmahCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_ummah_prayer_counts');
      if (!error && data) setCounts(data as UmmahCounts);
    } catch {
      // Fail silently — counter is decorative, not critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();

    // Refresh every 5 minutes
    const interval = setInterval(fetchCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { counts, isLoading, PRAYER_LABELS };
}
