import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface WeeklyStats {
  prayerDays: number;
  totalPrayers: number;
  possiblePrayers: number;
  jamaahCount: number;
  missedCount: number;
  fastingDays: number;
  weekKey: string;
  startDate: string;
  endDate: string;
}

export interface WeeklyReport {
  report: string;
  stats: WeeklyStats;
  cached: boolean;
}

export interface UseWeeklyReportResult {
  report: WeeklyReport | null;
  isLoading: boolean;
  error: string | null;
  isFriday: boolean;
  generate: () => Promise<void>;
}

function todayIsFriday(): boolean {
  return new Date().getDay() === 5;
}

export function useWeeklyReport(): UseWeeklyReportResult {
  const { session } = useAuthStore();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!session) {
      setError('يجب تسجيل الدخول لعرض التقرير الأسبوعي.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('weekly-report', {});
      if (fnError) throw fnError;
      setReport(data as WeeklyReport);
    } catch (e) {
      setError('تعذّر إنشاء التقرير. تحقق من اتصالك وحاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Auto-fetch on mount if user is signed in
  useEffect(() => {
    if (session) generate();
  }, [session]);

  return {
    report,
    isLoading,
    error,
    isFriday: todayIsFriday(),
    generate,
  };
}
