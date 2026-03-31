import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// RevenueCat product IDs — must match what you create in RevenueCat dashboard
export const RC_PRODUCTS = {
  monthly: 'noor_monthly',   // SAR 19.99/month
  annual: 'noor_annual',     // SAR 149/year
  family: 'noor_family',     // SAR 299/year (family)
} as const;

// RevenueCat API keys — replace with your actual keys from the RC dashboard
const RC_API_KEY = Platform.select({
  ios: 'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  android: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  default: '',
});

// Free tier limit for AI calls per day
export const FREE_AI_LIMIT = 10;

const STORAGE_KEY = 'noor_premium_status';

export interface PremiumStatus {
  isPremium: boolean;
  activeProductId: string | null;
  expiresAt: string | null;  // ISO date
}

export interface RevenueCatState {
  isPremium: boolean;
  activeProductId: string | null;
  isLoading: boolean;
  aiCallsToday: number;
  canUseAI: boolean;
  purchase: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<{ success: boolean; error?: string }>;
  trackAICall: () => Promise<void>;
}

const INITIAL_STATUS: PremiumStatus = {
  isPremium: false,
  activeProductId: null,
  expiresAt: null,
};

async function loadCachedStatus(): Promise<PremiumStatus> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATUS;
    const parsed: PremiumStatus = JSON.parse(raw);
    // If subscription expired, treat as free
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      return INITIAL_STATUS;
    }
    return parsed;
  } catch {
    return INITIAL_STATUS;
  }
}

async function saveCachedStatus(status: PremiumStatus): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(status));
}

// AI call tracking — reset daily
const AI_CALLS_KEY = 'noor_ai_calls';
interface AICallLog { date: string; count: number }

async function loadAICalls(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(AI_CALLS_KEY);
    if (!raw) return 0;
    const log: AICallLog = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (log.date !== today) return 0;
    return log.count;
  } catch {
    return 0;
  }
}

async function incrementAICalls(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  let count = await loadAICalls();
  count += 1;
  await AsyncStorage.setItem(AI_CALLS_KEY, JSON.stringify({ date: today, count }));
  return count;
}

export function useRevenueCat(): RevenueCatState {
  const [status, setStatus] = useState<PremiumStatus>(INITIAL_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [aiCallsToday, setAICallsToday] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Load cached status immediately
      const cached = await loadCachedStatus();
      if (mounted) setStatus(cached);

      // Load AI call count
      const calls = await loadAICalls();
      if (mounted) setAICallsToday(calls);

      // Attempt to configure RevenueCat and fetch live customer info
      try {
        // Dynamic import so the app doesn't crash if native module is unavailable (Expo Go)
        const Purchases = (await import('react-native-purchases')).default;
        await Purchases.configure({ apiKey: RC_API_KEY! });
        const info = await Purchases.getCustomerInfo();
        const activeEntitlement = info.entitlements.active['premium'];
        const live: PremiumStatus = {
          isPremium: !!activeEntitlement,
          activeProductId: activeEntitlement?.productIdentifier ?? null,
          expiresAt: activeEntitlement?.expirationDate ?? null,
        };
        if (mounted) setStatus(live);
        await saveCachedStatus(live);
      } catch {
        // Native module not available (Expo Go) or network error — use cached
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  const purchase = useCallback(async (productId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === productId
      );
      if (!pkg) {
        return { success: false, error: 'المنتج غير متاح حالياً' };
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active['premium'];
      const updated: PremiumStatus = {
        isPremium: !!active,
        activeProductId: active?.productIdentifier ?? null,
        expiresAt: active?.expirationDate ?? null,
      };
      setStatus(updated);
      await saveCachedStatus(updated);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'فشل الشراء';
      // User cancelled is not an error
      if (typeof e === 'object' && e !== null && 'userCancelled' in e) {
        return { success: false };
      }
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const customerInfo = await Purchases.restorePurchases();
      const active = customerInfo.entitlements.active['premium'];
      const updated: PremiumStatus = {
        isPremium: !!active,
        activeProductId: active?.productIdentifier ?? null,
        expiresAt: active?.expirationDate ?? null,
      };
      setStatus(updated);
      await saveCachedStatus(updated);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'فشل استعادة الاشتراك';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackAICall = useCallback(async () => {
    const count = await incrementAICalls();
    setAICallsToday(count);
  }, []);

  const canUseAI = status.isPremium || aiCallsToday < FREE_AI_LIMIT;

  return {
    isPremium: status.isPremium,
    activeProductId: status.activeProductId,
    isLoading,
    aiCallsToday,
    canUseAI,
    purchase,
    restore,
    trackAICall,
  };
}
