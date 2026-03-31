import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

// Mishary Rashid Al-Afasy CDN via EveryAyah (free, no key required)
function buildAudioUrl(surah: number, ayah: number): string {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseQuranAudioResult {
  playbackState: PlaybackState;
  currentAyah: number | null;
  isPlayingAll: boolean;
  durationMs: number;
  positionMs: number;
  play: (surah: number, ayah: number) => Promise<void>;
  playAll: (surah: number, totalAyahs: number, startAyah?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

export function useQuranAudio(): UseQuranAudioResult {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [positionMs, setPositionMs] = useState(0);

  // Refs to track continuous playback state without stale closures
  const isPlayingAllRef = useRef(false);
  const totalAyahsRef = useRef(0);
  const surahRef = useRef(0);

  // Configure audio session on mount
  useEffect(() => {
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
      } catch {
        // Sound may already be unloaded
      }
      soundRef.current = null;
    }
    setPlaybackState('idle');
    setCurrentAyah(null);
    setPositionMs(0);
    setDurationMs(0);
  }, []);

  const play = useCallback(async (surah: number, ayah: number) => {
    try {
      // Unload previous sound without resetting playAll state
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch {
          // Already unloaded
        }
        soundRef.current = null;
      }

      setPlaybackState('loading');
      setCurrentAyah(ayah);
      setPositionMs(0);
      setDurationMs(0);

      const { sound } = await Audio.Sound.createAsync(
        { uri: buildAudioUrl(surah, ayah) },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          setPositionMs(status.positionMillis ?? 0);
          setDurationMs(status.durationMillis ?? 0);

          if (status.didJustFinish) {
            // Auto-advance if playing the whole surah
            if (isPlayingAllRef.current) {
              const nextAyah = ayah + 1;
              if (nextAyah <= totalAyahsRef.current) {
                play(surahRef.current, nextAyah);
              } else {
                // Finished the entire surah
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
  }, [stop]);

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

  return {
    playbackState,
    currentAyah,
    isPlayingAll,
    durationMs,
    positionMs,
    play,
    playAll,
    pause,
    resume,
    stop,
  };
}
