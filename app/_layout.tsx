import { useEffect, useRef } from 'react';
import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { Colors } from '@/constants/Colors';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

SplashScreen.preventAutoHideAsync();

// ── Auth Guard ────────────────────────────────────────────────────────────────
// Redirects unauthenticated users to (auth) and authenticated users away from it.

function AuthGuard() {
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);
  const isLoading        = useAuthStore((s) => s.isLoading);
  const step             = useAuthStore((s) => s.step);
  const userId           = useAuthStore((s) => s.user?.id);
  const segments         = useSegments();
  const initFromSupabase = useProgressStore((s) => s.initFromSupabase);
  const hydratedRef      = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Hydrate progress store from Supabase once after a real (non-guest) login
  useEffect(() => {
    if (!isLoading && step === 'authenticated' && userId && !hydratedRef.current) {
      hydratedRef.current = true;
      initFromSupabase(userId).catch(() => {});
    }
  }, [isLoading, step, userId, initFromSupabase]);

  return null;
}

// ── Themed App ─────────────────────────────────────────────────────────────────

function ThemedApp() {
  const darkMode = useThemeStore((s) => s.darkMode);
  const dk       = Colors.dark;
  const lk       = Colors.light;

  const navTheme = darkMode
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: dk.background, card: dk.surface,  text: dk.text,  border: dk.surfaceBorder } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: lk.background, card: lk.surface, text: lk.text, border: lk.surfaceBorder } };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={darkMode ? 'light' : 'dark'} hidden={false} />
      <AuthGuard />
      <Stack>
        <Stack.Screen name="(auth)"     options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen name="quiz/[id]"  options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="dev-config" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

// ── Root Layout ────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);

  const [loaded, error] = useFonts({
    SpaceMono:             require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PublicSans-Regular':  require('../assets/fonts/PublicSans-Regular.ttf'),
    'PublicSans-Medium':   require('../assets/fonts/PublicSans-Medium.ttf'),
    'PublicSans-SemiBold': require('../assets/fonts/PublicSans-SemiBold.ttf'),
    'PublicSans-Bold':     require('../assets/fonts/PublicSans-Bold.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);

  useEffect(() => {
    if (loaded) {
      // Initialize auth before hiding splash so user is never shown a flash of wrong screen
      initAuth().finally(() => SplashScreen.hideAsync());
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  );
}
