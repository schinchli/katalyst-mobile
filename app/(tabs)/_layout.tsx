import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/ui/AppTabBar';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  return (
    <Tabs
      // @ts-ignore — tabBarPosition is a valid BottomTabNavigator prop (React Navigation v7)
      tabBarPosition={isDesktop ? 'left' : 'bottom'}
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        // No header — page titles are shown inside each screen
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home' }} />
      <Tabs.Screen name="quizzes"   options={{ title: 'Quizzes' }} />
      <Tabs.Screen name="search"    options={{ title: 'Search' }} />
      <Tabs.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
    </Tabs>
  );
}
