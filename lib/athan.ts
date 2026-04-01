import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let currentSound: Audio.Sound | null = null;

/**
 * Play the athan for the given prayer.
 * Fajr uses fajr.mp3; all other prayers use all.mp3.
 */
export async function playAthan(prayer: string): Promise<void> {
  if (Platform.OS === 'web') return;

  await stopAthan();

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
  });

  const source =
    prayer === 'fajr'
      ? require('../assets/audio/fajr.mp3')
      : require('../assets/audio/all.mp3');

  const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
  currentSound = sound;

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      currentSound = null;
    }
  });
}

/**
 * Stop and unload any currently playing athan.
 */
export async function stopAthan(): Promise<void> {
  if (!currentSound) return;
  try {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
  } catch {}
  currentSound = null;
}

export function isAthanPlaying(): boolean {
  return currentSound !== null;
}
