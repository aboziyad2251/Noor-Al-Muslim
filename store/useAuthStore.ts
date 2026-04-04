import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { syncLocalDataToSupabase } from '../lib/sync-local-data';

const SYNC_DONE_KEY = 'noor_local_sync_done';

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

      supabase.auth.onAuthStateChange((event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });

        // On first sign-in, upload any locally stored guest data to Supabase
        if (event === 'SIGNED_IN' && newSession?.user) {
          const userId = newSession.user.id;
          AsyncStorage.getItem(SYNC_DONE_KEY).then((done) => {
            if (done === userId) return; // already synced for this account
            syncLocalDataToSupabase(supabase, userId).then(() => {
              AsyncStorage.setItem(SYNC_DONE_KEY, userId);
            });
          });
        }
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
