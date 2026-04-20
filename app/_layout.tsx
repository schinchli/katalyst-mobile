import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { DefaultTheme, DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { syncPlatformThemeFromSupabase, syncUserThemeFromSupabase } from '@/services/themeSyncService';
import { syncPlatformConfigFromSupabase } from '@/services/platformConfigService';
import { syncQuizCatalogOverridesFromSupabase } from '@/services/quizCatalogService';
import { syncSystemFeaturesFromSupabase } from '@/services/systemFeatureService';
import { syncManagedQuizContentFromSupabase } from '@/services/managedQuizContentService';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { useLearningPathStore } from '@/stores/learningPathStore';
import { ForceUpdateScreen } from '@/components/ForceUpdateScreen';
import 'react-native-reanimated';

/** Parses a semver string into [major, minor, patch] numeric tuple. */
function parseSemver(version: string): [number, number, number] {
  const parts = version.replace(/[^0-9.]/g, '').split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Returns true if `a` is strictly less than `b` using semver comparison. */
function semverLessThan(a: string, b: string): boolean {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj < bMaj;
  if (aMin !== bMin) return aMin < bMin;
  return aPatch < bPatch;
}

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
    // Wait until auth is resolved AND segments are available before navigating.
    if (isLoading || (segments as string[]).length === 0) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && step !== 'guest' && inAuthGroup) {
      // Guest users are allowed to navigate to auth screens so they can log in
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
  const darkMode      = useThemeStore((s) => s.darkMode);
  const systemFeatures = useSystemFeatureStore((s) => s.config);
  const themeColors = useThemeColors();

  const navTheme = darkMode
    ? { ...DarkTheme,    colors: { ...DarkTheme.colors,    background: themeColors.background, card: themeColors.surface,  text: themeColors.text,  border: themeColors.surfaceBorder, primary: themeColors.primary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: themeColors.background, card: themeColors.surface, text: themeColors.text, border: themeColors.surfaceBorder, primary: themeColors.primary } };

  // ── Maintenance gate ────────────────────────────────────────────────────────
  if (systemFeatures.maintenanceMode) {
    return (
      <ThemeProvider value={navTheme}>
        <StatusBar style={darkMode ? 'light' : 'dark'} hidden={false} />
        <MaintenanceScreen message={systemFeatures.maintenanceMessage} />
      </ThemeProvider>
    );
  }

  // ── Force-update gate ───────────────────────────────────────────────────────
  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
  if (
    systemFeatures.forceUpdateEnabled &&
    semverLessThan(currentVersion, systemFeatures.minimumAppVersion)
  ) {
    return (
      <ThemeProvider value={navTheme}>
        <StatusBar style={darkMode ? 'light' : 'dark'} hidden={false} />
        <ForceUpdateScreen
          minimumVersion={systemFeatures.minimumAppVersion}
          appStoreUrl={systemFeatures.appStoreUrl}
          playStoreUrl={systemFeatures.playStoreUrl}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={darkMode ? 'light' : 'dark'} hidden={false} />
      <AuthGuard />
      <Stack>
        <Stack.Screen name="(auth)"     options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen name="flashcards" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="quiz/[id]"  options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="dev-config" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="admin-settings" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="challenge"      options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="contest"        options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="privacy"        options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="terms"          options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="about"          options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="instructions"    options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="learning-path"  options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}

// ── Root Layout ────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const hydrateLearningPath = useLearningPathStore((s) => s.hydrate);

  useEffect(() => { void hydrateLearningPath(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // fontsDone is true once fonts load OR after 3 s (guards against missing assets).
  // We never block the navigator on fonts — SplashScreen provides the visual gate.
  const [fontsDone, setFontsDone] = useState(false);

  const [loaded, error] = useFonts({
    SpaceMono:             require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PublicSans-Regular':  require('../assets/fonts/PublicSans-Regular.ttf'),
    'PublicSans-Medium':   require('../assets/fonts/PublicSans-Medium.ttf'),
    'PublicSans-SemiBold': require('../assets/fonts/PublicSans-SemiBold.ttf'),
    'PublicSans-Bold':     require('../assets/fonts/PublicSans-Bold.ttf'),
  });

  // Font timeout: give up waiting after 3 s so a missing asset never blocks the app.
  useEffect(() => {
    if (loaded || error) {
      setFontsDone(true);
      return;
    }
    const t = setTimeout(() => setFontsDone(true), 3_000);
    return () => clearTimeout(t);
  }, [loaded, error]);

  useEffect(() => {
    if (!fontsDone) return;

    // Hard fallback: if initAuth hangs beyond 10 s (e.g. no network),
    // force isLoading=false and hide the splash so the user sees the UI.
    const fallbackTimer = setTimeout(() => {
      useAuthStore.getState().setLoading(false);
      void SplashScreen.hideAsync();
    }, 10_000);

    // Keep splash blocked only for local auth/bootstrap. Remote config syncs can
    // happen in the background so Expo Go and native dev startups stay fast.
    initAuth()
      .then(() => {
        clearTimeout(fallbackTimer);
        void SplashScreen.hideAsync();

        void (async () => {
          const syncTasks: Array<Promise<unknown>> = [
            syncPlatformThemeFromSupabase(),
            syncPlatformConfigFromSupabase(),
            syncManagedQuizContentFromSupabase(),
            syncQuizCatalogOverridesFromSupabase(),
            syncSystemFeaturesFromSupabase(),
          ];

          const userId = useAuthStore.getState().user?.id;
          if (userId) {
            syncTasks.push(syncUserThemeFromSupabase(userId));
          }

          await Promise.allSettled(syncTasks);
        })();
      })
      .catch((err: unknown) => {
        clearTimeout(fallbackTimer);
        if (__DEV__) console.error('[RootLayout] initAuth failed:', err);
        useAuthStore.getState().setLoading(false);
        void SplashScreen.hideAsync();
      });
  }, [fontsDone]);

  // Always render the navigator — expo-router requires a slot/navigator on every
  // render. SplashScreen (preventAutoHideAsync) keeps the native splash visible
  // while fonts + auth bootstrap. ThemedApp renders the Stack unconditionally.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp />
    </QueryClientProvider>
  );
}
