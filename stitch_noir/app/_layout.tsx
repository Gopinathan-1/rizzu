import '../theme/global.css';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/services/auth';
import { getRememberedSessionStatus, markSessionRemembered } from '@/services/sessionRemember';
import { useAppStore } from '@/store/useAppStore';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#d3bbff',
    background: '#15121b',
    card: '#221e28',
    text: '#e8e0ee',
    border: '#2c2833',
    notification: '#6d28d9',
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

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
      <ThemeProvider value={AppTheme}>
        <Stack screenOptions={{ headerShown: false }}>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
