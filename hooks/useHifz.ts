import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export interface HifzEntry {
  id: string;
  surahNumber: number;
  surahName: string;
  intervalDays: number;
  repetitions: number;
  ease: number;           // 1=hard 2=medium 3=easy
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt: string | null;
  addedAt: string;
}

export type ReviewRating = 'easy' | 'medium' | 'hard';

// SM-2 inspired intervals in days
const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

function computeNextReview(entry: HifzEntry, rating: ReviewRating): Partial<HifzEntry> {
  let { ease, repetitions, intervalDays } = entry;

  if (rating === 'hard') {
    repetitions = 0;
    ease = Math.max(1, ease - 1);
    intervalDays = INTERVALS[0];
  } else if (rating === 'medium') {
    repetitions = Math.max(0, repetitions); // stay
    intervalDays = INTERVALS[Math.min(ease + repetitions - 1, INTERVALS.length - 1)];
  } else {
    repetitions += 1;
    ease = Math.min(3, ease);
    const idx = Math.min(repetitions + ease - 1, INTERVALS.length - 1);
    intervalDays = INTERVALS[idx];
  }

  const next = new Date();
  next.setDate(next.getDate() + intervalDays);
  const nextReviewDate = next.toISOString().split('T')[0];

  return { ease, repetitions, intervalDays, nextReviewDate, lastReviewedAt: new Date().toISOString() };
}

export function useHifz() {
  const { session } = useAuthStore();
  const [schedule, setSchedule] = useState<HifzEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tip, setTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = schedule.filter((e) => e.nextReviewDate <= todayStr);

  const fetchSchedule = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('hifz_schedule')
        .select('*')
        .order('next_review_date', { ascending: true });

      if (data) {
        setSchedule(data.map((r: any) => ({
          id: r.id,
          surahNumber: r.surah_number,
          surahName: r.surah_name,
          intervalDays: r.interval_days,
          repetitions: r.repetitions,
          ease: r.ease,
          nextReviewDate: r.next_review_date,
          lastReviewedAt: r.last_reviewed_at,
          addedAt: r.added_at,
        })));
      }
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const addSurah = useCallback(async (surahNumber: number, surahName: string) => {
    if (!session) return;
    const { error } = await supabase.from('hifz_schedule').upsert(
      { user_id: session.user.id, surah_number: surahNumber, surah_name: surahName },
      { onConflict: 'user_id,surah_number' }
    );
    if (!error) await fetchSchedule();
  }, [session, fetchSchedule]);

  const removeSurah = useCallback(async (surahNumber: number) => {
    if (!session) return;
    await supabase.from('hifz_schedule').delete()
      .eq('user_id', session.user.id)
      .eq('surah_number', surahNumber);
    setSchedule((prev) => prev.filter((e) => e.surahNumber !== surahNumber));
  }, [session]);

  const markReviewed = useCallback(async (entry: HifzEntry, rating: ReviewRating) => {
    if (!session) return;
    const updates = computeNextReview(entry, rating);
    const { error } = await supabase.from('hifz_schedule').update({
      interval_days: updates.intervalDays,
      repetitions: updates.repetitions,
      ease: updates.ease,
      next_review_date: updates.nextReviewDate,
      last_reviewed_at: updates.lastReviewedAt,
    }).eq('id', entry.id);

    if (!error) {
      setSchedule((prev) => prev.map((e) =>
        e.id === entry.id ? { ...e, ...updates } : e
      ));
    }
  }, [session]);

  const fetchTip = useCallback(async (entry: HifzEntry) => {
    if (!session) return;
    setTip(null);
    setTipLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hifz-tip', {
        body: { surahNumber: entry.surahNumber, surahName: entry.surahName, repetitions: entry.repetitions },
      });
      if (!error && data?.tip) setTip(data.tip);
      else setTip('تعذّر جلب النصيحة. حاول مجدداً.');
    } catch {
      setTip('تعذّر جلب النصيحة. حاول مجدداً.');
    } finally {
      setTipLoading(false);
    }
  }, [session]);

  return {
    schedule,
    dueToday,
    isLoading,
    tip,
    tipLoading,
    addSurah,
    removeSurah,
    markReviewed,
    fetchTip,
    clearTip: () => setTip(null),
    refresh: fetchSchedule,
  };
}
