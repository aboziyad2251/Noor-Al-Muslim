import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { I18nManager, View, ActivityIndicator, Platform } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Tajawal_400Regular, Tajawal_700Bold } from '@expo-google-fonts/tajawal';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { useAuthStore } from '../store/useAuthStore';
import '../global.css';

// Force RTL layout since it's an Arabic-first app
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

export default function RootLayout() {
  const { isInitialized, hasCompletedOnboarding, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

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
      <Stack.Screen name="scientist/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="premium/index" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
    </>
  );
}
