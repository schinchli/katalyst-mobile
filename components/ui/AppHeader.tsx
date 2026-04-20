import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useDrawerStore } from '@/stores/drawerStore';
import { F } from '@/constants/Typography';

const ROUTE_TITLES: Record<string, string> = {
  '/':               'Home',
  '/(tabs)':         'Home',
  '/(tabs)/':        'Home',
  '/(tabs)/quizzes': 'Explore',
  '/(tabs)/learn':   'Resources',
  '/(tabs)/progress':'Growth',
  '/(tabs)/profile': 'Profile',
  '/(tabs)/search':  'Search',
};

function getTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  for (const [key, val] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(key) && key !== '/') return val;
  }
  return 'LearnKloud';
}

export function AppHeader() {
  const toggle  = useDrawerStore((s) => s.toggle);
  const colors  = useThemeColors();
  const insets  = useSafeAreaInsets();
  const pathname = usePathname();
  const title    = getTitle(pathname);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: colors.surfaceBorder,
        },
      ]}
    >
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.menuBtn,
          { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' },
        ]}
        accessibilityLabel="Open navigation menu"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Feather name="menu" size={22} color={colors.text} />
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>

      {/* Spacer to balance the hamburger button */}
      <View style={styles.menuBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.semiBold,
    fontSize: 17,
  },
});
