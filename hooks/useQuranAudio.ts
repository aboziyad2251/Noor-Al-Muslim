import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import {
  Reciter,
  RECITERS,
  DEFAULT_RECITER_ID,
  buildAudioUrl,
  getSelectedReciter,
  saveSelectedReciter,
} from '../lib/reciters';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseQuranAudioResult {
  playbackState: PlaybackState;
  currentAyah: number | null;
  isPlayingAll: boolean;
  durationMs: number;
  positionMs: number;
  selectedReciter: Reciter;
  play: (surah: number, ayah: number) => Promise<void>;
  playAll: (surah: number, totalAyahs: number, startAyah?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  selectReciter: (id: string) => Promise<void>;
}

export function useQuranAudio(): UseQuranAudioResult {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);

  // Refs to avoid stale closures in playback callbacks
  const isPlayingAllRef = useRef(false);
  const totalAyahsRef = useRef(0);
  const surahRef = useRef(0);
  const reciterFolderRef = useRef(RECITERS[0].folder);

  // Load persisted reciter on mount
  useEffect(() => {
    getSelectedReciter().then((r) => {
      setSelectedReciter(r);
      reciterFolderRef.current = r.folder;
    });

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const stop = useCallback(async () => {
    isPlayingAllRef.current = false;
    setIsPlayingAll(false);
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setPlaybackState('idle');
    setCurrentAyah(null);
    setPositionMs(0);
    setDurationMs(0);
  }, []);

  const play = useCallback(async (surah: number, ayah: number) => {
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      setPlaybackState('loading');
      setCurrentAyah(ayah);
      setPositionMs(0);
      setDurationMs(0);

      const url = buildAudioUrl(reciterFolderRef.current, surah, ayah);

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPositionMs(status.positionMillis ?? 0);
          setDurationMs(status.durationMillis ?? 0);

          if (status.didJustFinish) {
            if (isPlayingAllRef.current) {
              const nextAyah = ayah + 1;
              if (nextAyah <= totalAyahsRef.current) {
                play(surahRef.current, nextAyah);
              } else {
                isPlayingAllRef.current = false;
                setIsPlayingAll(false);
                setPlaybackState('idle');
                setCurrentAyah(null);
              }
            } else {
              setPlaybackState('idle');
              setCurrentAyah(null);
            }
          }
        }
      );

      soundRef.current = sound;
      setPlaybackState('playing');
    } catch {
      setPlaybackState('error');
      setCurrentAyah(null);
    }
  }, []);

  const playAll = useCallback(async (surah: number, totalAyahs: number, startAyah = 1) => {
    surahRef.current = surah;
    totalAyahsRef.current = totalAyahs;
    isPlayingAllRef.current = true;
    setIsPlayingAll(true);
    await play(surah, startAyah);
  }, [play]);

  const pause = useCallback(async () => {
    if (soundRef.current && playbackState === 'playing') {
      await soundRef.current.pauseAsync();
      setPlaybackState('paused');
    }
  }, [playbackState]);

  const resume = useCallback(async () => {
    if (soundRef.current && playbackState === 'paused') {
      await soundRef.current.playAsync();
      setPlaybackState('playing');
    }
  }, [playbackState]);

  const selectReciter = useCallback(async (id: string) => {
    const reciter = RECITERS.find((r) => r.id === id) ?? RECITERS[0];
    await stop();
    await saveSelectedReciter(id);
    setSelectedReciter(reciter);
    reciterFolderRef.current = reciter.folder;
  }, [stop]);

  return {
    playbackState,
    currentAyah,
    isPlayingAll,
    durationMs,
    positionMs,
    selectedReciter,
    play,
    playAll,
    pause,
    resume,
    stop,
    selectReciter,
  };
}
