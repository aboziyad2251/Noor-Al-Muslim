import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

const ONBOARDING_KEY = 'noor_onboarding_complete';

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  hasCompletedOnboarding: boolean;
  setSession: (session: Session | null) => void;
  completeOnboarding: () => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  hasCompletedOnboarding: false,

  setSession: (session) => set({ session, user: session?.user ?? null }),

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },

  initialize: async () => {
    try {
      const [{ data: { session }, error }, onboardingDone] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      if (error) throw error;

      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
        hasCompletedOnboarding: onboardingDone === 'true',
      });

      supabase.auth.onAuthStateChange((_event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });
      });
    } catch (e) {
      console.error('Initialization failed', e);
      set({ isInitialized: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
