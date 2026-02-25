import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono:           require('../assets/fonts/SpaceMono-Regular.ttf'),
    'PublicSans-Regular':   require('../assets/fonts/PublicSans-Regular.ttf'),
    'PublicSans-Medium':    require('../assets/fonts/PublicSans-Medium.ttf'),
    'PublicSans-SemiBold':  require('../assets/fonts/PublicSans-SemiBold.ttf'),
    'PublicSans-Bold':      require('../assets/fonts/PublicSans-Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" hidden={false} />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="quiz/[id]"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="dev-config"
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
