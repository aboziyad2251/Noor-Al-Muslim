import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Pulling the keys you saved in your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Building the secure mobile connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Tells Supabase to save logins to the phone's secure storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed for mobile apps
  },
});