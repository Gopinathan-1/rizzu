import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/useAppStore';
import { clearRememberedSession, markSessionRemembered } from '@/services/sessionRemember';
import type { PersonalizedToneProfile } from '@/lib/tonePrompts';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const missingEnvError =
  'Missing Supabase environment variables. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.';

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: Platform.OS === 'web',
          storageKey: 'stitch-noir-auth',
          storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        },
      })
    : null;

const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(missingEnvError);
  }
  return supabase;
};

export const authService = {
  async getSessionUser() {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async signup(email: string, password: string, fullName: string, toneProfile?: PersonalizedToneProfile | null) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            preferred_tone: toneProfile?.primaryTone ?? null,
            tone_profile: toneProfile ?? null,
          },
        },
      });

      if (error) throw error;
      if (data.session) {
        await markSessionRemembered();
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async login(email: string, password: string) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await markSessionRemembered();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async logout() {
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      await clearRememberedSession();
      useAppStore.getState().clearState();
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getCurrentUser() {
    try {
      const client = getSupabaseClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async updateProfile(fullName: string) {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
