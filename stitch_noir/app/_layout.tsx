import '../theme/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { vars } from 'nativewind';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/services/auth';
import { getRememberedSessionStatus, markSessionRemembered } from '@/services/sessionRemember';
import { useAppStore } from '@/store/useAppStore';
import { darkThemeVars, lightThemeVars } from '@/theme/tokens';
import { normalizeToneName, type PersonalizedToneProfile } from '@/lib/tonePrompts';
import { CHOCOLATE_TRUFFLE_DARK, CHOCOLATE_TRUFFLE_LIGHT } from '@/theme/palette';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: CHOCOLATE_TRUFFLE_DARK.accent,
    background: CHOCOLATE_TRUFFLE_DARK.bgPrimary,
    card: CHOCOLATE_TRUFFLE_DARK.bgSurface,
    text: CHOCOLATE_TRUFFLE_DARK.textPrimary,
    border: CHOCOLATE_TRUFFLE_DARK.border,
    notification: CHOCOLATE_TRUFFLE_DARK.accent,
  },
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: CHOCOLATE_TRUFFLE_LIGHT.accent,
    background: CHOCOLATE_TRUFFLE_LIGHT.bgPrimary,
    card: CHOCOLATE_TRUFFLE_LIGHT.bgSurface,
    text: CHOCOLATE_TRUFFLE_LIGHT.textPrimary,
    border: CHOCOLATE_TRUFFLE_LIGHT.border,
    notification: CHOCOLATE_TRUFFLE_LIGHT.accent,
  },
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const setUser = useAppStore((state) => state.setUser);
  const setToneProfile = useAppStore((state) => state.setToneProfile);
  const setActiveTone = useAppStore((state) => state.setActiveTone);
  const themeMode = useAppStore((state) => state.themeMode);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      if (!supabase) {
        if (isMounted) {
          setIsLoggedIn(false);
          setAuthReady(true);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      let nextSession = session;
      if (session) {
        const rememberStatus = await getRememberedSessionStatus();
        if (rememberStatus === 'expired') {
          await supabase.auth.signOut();
          nextSession = null;
        } else {
          await markSessionRemembered();
        }
      }

      if (isMounted) {
        const toneProfile = nextSession?.user.user_metadata?.tone_profile as PersonalizedToneProfile | null | undefined;
        const preferredTone = nextSession?.user.user_metadata?.preferred_tone as string | null | undefined;

        setIsLoggedIn(Boolean(nextSession));
        setUser(
          nextSession?.user
            ? {
                id: nextSession.user.id,
                email: nextSession.user.email,
                full_name: nextSession.user.user_metadata?.full_name ?? nextSession.user.user_metadata?.name ?? null,
              }
            : null
        );
        if (nextSession) {
          setToneProfile(toneProfile ?? null);
          if (preferredTone || toneProfile?.primaryTone) {
            setActiveTone(normalizeToneName(preferredTone ?? toneProfile?.primaryTone));
          }
        }
        setAuthReady(true);
      }
    };

    bootstrapAuth();

    const subscription = supabase?.auth.onAuthStateChange(async (_event, session) => {
      let nextSession = session;

      if (session) {
        const rememberStatus = await getRememberedSessionStatus();
        if (rememberStatus === 'expired') {
          await supabase?.auth.signOut();
          nextSession = null;
        } else {
          await markSessionRemembered();
        }
      }

      const toneProfile = nextSession?.user.user_metadata?.tone_profile as PersonalizedToneProfile | null | undefined;
      const preferredTone = nextSession?.user.user_metadata?.preferred_tone as string | null | undefined;

      setIsLoggedIn(Boolean(nextSession));
      setUser(
        nextSession?.user
          ? {
              id: nextSession.user.id,
              email: nextSession.user.email,
              full_name: nextSession.user.user_metadata?.full_name ?? nextSession.user.user_metadata?.name ?? null,
            }
          : null
      );
      if (nextSession) {
        setToneProfile(toneProfile ?? null);
        if (preferredTone || toneProfile?.primaryTone) {
          setActiveTone(normalizeToneName(preferredTone ?? toneProfile?.primaryTone));
        }
      }
      setAuthReady(true);
    }).data.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';

    if (isLoggedIn && inAuthGroup) {
      router.replace('/(main)/(tabs)');
      return;
    }

    if (!isLoggedIn && inMainGroup) {
      router.replace('/(auth)/login');
    }
  }, [authReady, isLoggedIn, router, segments]);

  if (!loaded || !authReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={vars(themeMode === 'light' ? lightThemeVars : darkThemeVars)} className="flex-1">
        <ThemeProvider value={themeMode === 'light' ? AppLightTheme : AppDarkTheme}>
          <Stack screenOptions={{ headerShown: false }}>
          </Stack>
        </ThemeProvider>
      </View>
    </GestureHandlerRootView>
  );
}
