import { Platform, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/ui/AppTabBar';
import { MobileLeftDrawer } from '@/components/ui/MobileLeftDrawer';
import { AppHeader } from '@/components/ui/AppHeader';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  // Desktop / tablet web: persistent right sidebar
  if (isDesktop) {
    return (
      <Tabs
        // @ts-ignore — tabBarPosition is a valid BottomTabNavigator prop (React Navigation v7)
        tabBarPosition="right"
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index"     options={{ title: 'Home' }} />
        <Tabs.Screen name="quizzes"   options={{ title: 'Quizzes' }} />
        <Tabs.Screen name="learn"     options={{ title: 'Learn' }} />
        <Tabs.Screen name="progress"  options={{ title: 'Progress' }} />
        <Tabs.Screen name="search"    options={{ title: 'Search' }} />
        <Tabs.Screen name="bookmarks" options={{ href: null, title: 'Bookmarks' }} />
        <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
      </Tabs>
    );
  }

  // Mobile / native: AppHeader owns the hamburger, drawer overlays content
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Tabs
        tabBar={() => null}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index"     options={{ title: 'Home' }} />
        <Tabs.Screen name="quizzes"   options={{ title: 'Quizzes' }} />
        <Tabs.Screen name="learn"     options={{ title: 'Learn' }} />
        <Tabs.Screen name="progress"  options={{ title: 'Progress' }} />
        <Tabs.Screen name="search"    options={{ title: 'Search' }} />
        <Tabs.Screen name="bookmarks" options={{ href: null, title: 'Bookmarks' }} />
        <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
      </Tabs>
      <MobileLeftDrawer />
    </View>
  );
}
