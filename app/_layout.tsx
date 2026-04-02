import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { I18nManager, View, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Tajawal_400Regular, Tajawal_700Bold } from '@expo-google-fonts/tajawal';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { playAthan } from '../lib/athan';
import { registerBackgroundTask } from '../lib/background-task';
import { registerWebPush } from '../lib/web-push';
import '../global.css';

const SETTINGS_KEY = 'noor_notif_settings';

async function isAthanEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return true;
    const s = JSON.parse(raw);
    return s.athanEnabled !== false;
  } catch {
    return true;
  }
}

// Force RTL layout since it's an Arabic-first app
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function RootLayout() {
  const { isInitialized, hasCompletedOnboarding, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const [fontsLoaded] = useFonts({
    Amiri: Amiri_400Regular,
    'Amiri-Bold': Amiri_700Bold,
    Tajawal: Tajawal_400Regular,
    'Tajawal-Bold': Tajawal_700Bold,
    Nunito: Nunito_400Regular,
    'Nunito-Bold': Nunito_700Bold,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Register background task for auto-refresh of notifications + widget
  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerBackgroundTask().catch(() => {});
    } else {
      // Web: register service worker + Web Push for iOS Safari / Chrome
      registerWebPush().catch(() => {});
    }
  }, []);

  // Athan auto-play listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // App is in FOREGROUND — notification received → play athan automatically
    notifListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;
      if (data?.type === 'prayer' && typeof data.prayer === 'string') {
        const enabled = await isAthanEnabled();
        if (enabled) playAthan(data.prayer).catch(() => {});
      }
    });

    // App was in BACKGROUND / killed — user tapped notification → play athan on open
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'prayer' && typeof data.prayer === 'string') {
        const enabled = await isAthanEnabled();
        if (enabled) playAthan(data.prayer).catch(() => {});
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !fontsLoaded) return;

    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboardingGroup) {
      router.replace('/(tabs)/');
    }
  }, [isInitialized, hasCompletedOnboarding, fontsLoaded, segments, router]);

  if (!isInitialized || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>نور المسلم | Noor Al-Muslim</title>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="نور المسلم" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#0F172A" />
        </Head>
      )}
      <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="quran/[surah]" options={{ headerShown: false }} />
      <Stack.Screen name="tafseer/[surah]/[ayah]" options={{ headerShown: false }} />
      <Stack.Screen name="discover/chat" options={{ headerShown: false }} />
      <Stack.Screen name="auth/index" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="zakat/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
      <Stack.Screen name="settings/location" options={{ headerShown: false }} />
      <Stack.Screen name="scientist/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="premium/index" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
    </>
  );
}
