import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SURAHS from '../assets/data/surahs.json';

const KEY = 'noor_khatm_progress';

export interface KhatmProgress {
  completedSurahs: number[];      // surah IDs that have been fully read
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  startedAt: string | null;       // ISO date
  completedAt: string | null;     // ISO date — set when all 114 done
}

const INITIAL: KhatmProgress = {
  completedSurahs: [],
  lastReadSurah: null,
  lastReadAyah: null,
  startedAt: null,
  completedAt: null,
};

export interface KhatmStats {
  progress: KhatmProgress;
  totalSurahs: number;
  completedCount: number;
  percentComplete: number;
  isComplete: boolean;
  markSurahRead: (surahId: number) => Promise<void>;
  setLastRead: (surahId: number, ayahNum: number) => Promise<void>;
  resetKhatm: () => Promise<void>;
}

export function useKhatm(): KhatmStats {
  const [progress, setProgress] = useState<KhatmProgress>(INITIAL);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setProgress(JSON.parse(raw));
    });
  }, []);

  const save = useCallback(async (updated: KhatmProgress) => {
    setProgress(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  }, []);

  const markSurahRead = useCallback(async (surahId: number) => {
    setProgress((prev) => {
      const already = prev.completedSurahs.includes(surahId);
      if (already) return prev;

      const completedSurahs = [...prev.completedSurahs, surahId];
      const isComplete = completedSurahs.length === 114;
      const updated: KhatmProgress = {
        ...prev,
        completedSurahs,
        startedAt: prev.startedAt ?? new Date().toISOString(),
        completedAt: isComplete ? new Date().toISOString() : null,
      };
      AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setLastRead = useCallback(async (surahId: number, ayahNum: number) => {
    setProgress((prev) => {
      const updated: KhatmProgress = {
        ...prev,
        lastReadSurah: surahId,
        lastReadAyah: ayahNum,
        startedAt: prev.startedAt ?? new Date().toISOString(),
      };
      AsyncStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetKhatm = useCallback(async () => {
    await save(INITIAL);
  }, [save]);

  const completedCount = progress.completedSurahs.length;
  const totalSurahs = 114;
  const percentComplete = Math.round((completedCount / totalSurahs) * 100);

  return {
    progress,
    totalSurahs,
    completedCount,
    percentComplete,
    isComplete: completedCount === totalSurahs,
    markSurahRead,
    setLastRead,
    resetKhatm,
  };
}
