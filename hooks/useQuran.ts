import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ayah {
  number: number;         // ayah number within surah (1-based)
  text: string;           // Arabic text (Uthmani script)
  numberInQuran: number;  // absolute ayah number (1-6236)
}

export interface SurahDetail {
  id: number;
  name: string;
  nameEn: string;
  verses: number;
  type: string;
  ayahs: Ayah[];
}

interface UseQuranResult {
  surah: SurahDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const CACHE_PREFIX = 'noor_quran_surah_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

async function fetchFromCache(surahId: number): Promise<SurahDetail | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${surahId}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw) as { data: SurahDetail; timestamp: number };
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function saveToCache(surahId: number, data: SurahDetail): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${surahId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // cache write failure is non-fatal
  }
}

async function fetchSurahFromAPI(surahId: number): Promise<SurahDetail> {
  // Al-Quran Cloud — Uthmani Arabic script edition, free, no key needed
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const json = await res.json();
  const s = json.data;

  return {
    id: s.number,
    name: s.name,
    nameEn: s.englishName,
    verses: s.numberOfAyahs,
    type: s.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
    ayahs: (s.ayahs as { number: number; text: string; numberInSurah: number }[]).map((a) => ({
      number: a.numberInSurah,
      text: a.text,
      numberInQuran: a.number,
    })),
  };
}

export function useQuran(surahId: number): UseQuranResult {
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      // 1. Try cache first (offline-first)
      const cached = await fetchFromCache(surahId);
      if (cached && !cancelled) {
        setSurah(cached);
        setIsLoading(false);
        return; // serve from cache, no network needed
      }

      // 2. Fetch from network
      try {
        const data = await fetchSurahFromAPI(surahId);
        if (!cancelled) {
          setSurah(data);
          setIsLoading(false);
          await saveToCache(surahId, data);
        }
      } catch (e) {
        if (!cancelled) {
          setError('تعذّر تحميل السورة. تحقق من اتصالك بالإنترنت.');
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [surahId, tick]);

  return { surah, isLoading, error, refetch };
}
