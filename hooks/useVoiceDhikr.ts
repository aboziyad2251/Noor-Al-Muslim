import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Voice Dhikr Counter — detects speech via microphone amplitude.
 * No ML required: a spike above the threshold = one dhikr spoken.
 *
 * Works on Android (APK) only — expo-av recording is not available on web.
 */

const AMPLITUDE_THRESHOLD = -20;  // dBFS — above this = speech detected
const DEBOUNCE_MS = 800;           // minimum ms between two counted dhikrs
const POLL_INTERVAL_MS = 100;      // how often we sample the meter

export interface UseVoiceDhikrResult {
  isListening: boolean;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export function useVoiceDhikr(onCount: () => void): UseVoiceDhikrResult {
  const isSupported = Platform.OS === 'android';

  const [isListening, setIsListening] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCountedRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopInternal();
    };
  }, []);

  const stopInternal = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
  };

  const start = useCallback(async () => {
    if (!isSupported || isListening) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.LOW_QUALITY,
          isMeteringEnabled: true,
        },
        undefined,
        POLL_INTERVAL_MS
      );

      recordingRef.current = recording;
      setIsListening(true);

      // Poll metering status
      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (!status.isRecording) return;

          const db = status.metering ?? -160;
          const now = Date.now();

          if (db > AMPLITUDE_THRESHOLD && now - lastCountedRef.current > DEBOUNCE_MS) {
            lastCountedRef.current = now;
            onCount();
          }
        } catch {}
      }, POLL_INTERVAL_MS);
    } catch {
      setIsListening(false);
    }
  }, [isSupported, isListening, onCount]);

  const stop = useCallback(async () => {
    await stopInternal();
    setIsListening(false);

    // Restore audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    }).catch(() => {});
  }, []);

  return { isListening, isSupported, start, stop };
}
