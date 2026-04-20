import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useDrawerStore } from '@/stores/drawerStore';
import { useAuthStore } from '@/stores/authStore';

const DRAWER_WIDTH = 260;

const NAV_ITEMS: Array<{
  name: string;
  path: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}> = [
  { name: 'index',    path: '/(tabs)/',         icon: 'home',        label: 'Home'      },
  { name: 'quizzes',  path: '/(tabs)/quizzes',  icon: 'compass',     label: 'Explore'   },
  { name: 'learn',    path: '/(tabs)/learn',    icon: 'book-open',   label: 'Resources' },
  { name: 'progress', path: '/(tabs)/progress', icon: 'bar-chart-2', label: 'Growth'    },
  { name: 'profile',  path: '/(tabs)/profile',  icon: 'sliders',     label: 'Profile'   },
];

export function MobileLeftDrawer() {
  const isOpen   = useDrawerStore((s) => s.isOpen);
  const close    = useDrawerStore((s) => s.close);
  const colors   = useThemeColors();
  const insets   = useSafeAreaInsets();
  const pathname = usePathname();
  const step     = useAuthStore((s) => s.step);
  const signOut  = useAuthStore((s) => s.signOut);
  const isGuest  = step === 'guest';
  const isAuthed = step === 'authenticated';

  const translateX    = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAlpha = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: true }),
        Animated.timing(backdropAlpha, { toValue: 0.5, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(translateX, { toValue: -DRAWER_WIDTH, bounciness: 0, useNativeDriver: true }),
        Animated.timing(backdropAlpha, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const navigate = (path: string) => {
    close();
    setTimeout(() => router.navigate(path as Parameters<typeof router.navigate>[0]), 120);
  };

  const isActive = (name: string) =>
    name === 'index'
      ? pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'
      : pathname.includes(`/(tabs)/${name}`);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAlpha }]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
            backgroundColor: colors.surface,
            borderRightColor: colors.surfaceBorder,
            paddingTop: insets.top,
            shadowColor: colors.text,
          },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.backgroundAlt, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.drawerHeader, { borderBottomColor: colors.surfaceBorder }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.gradientAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Feather name="activity" size={18} color={colors.primaryText} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appName, { color: colors.text }]}>
              {EXPERIENCE_COPY.appName}
            </Text>
            <Text style={[styles.appTheme, { color: colors.textSecondary }]}>
              {EXPERIENCE_COPY.themeName}
            </Text>
          </View>
          <Pressable
            onPress={close}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' },
            ]}
            accessibilityLabel="Close navigation menu"
            accessibilityRole="button"
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>
        </LinearGradient>

        {/* Nav items */}
        <View style={styles.navList}>
          <Text style={[styles.navLabel, { color: colors.textMuted }]}>Navigate</Text>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.name);
            return (
              <Pressable
                key={item.name}
                onPress={() => navigate(item.path)}
                style={({ pressed }) => [
                  styles.navItem,
                  {
                    backgroundColor: active
                      ? colors.surfaceElevated
                      : pressed
                      ? colors.backgroundAlt
                      : 'transparent',
                    borderColor: active ? colors.primary : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: active ? colors.primaryLight : colors.backgroundAlt },
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={17}
                    color={active ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.navItemText,
                    {
                      color: active ? colors.text : colors.textSecondary,
                      fontFamily: active ? F.semiBold : F.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                {active && (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })}

          {/* Login / Logout at the bottom */}
          <View style={[styles.authDivider, { borderTopColor: colors.surfaceBorder }]} />

          {isAuthed ? (
            <Pressable
              onPress={() => { close(); signOut(); }}
              style={({ pressed }) => [styles.navItem, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent', borderColor: 'transparent' }]}
              accessibilityRole="button"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.error + '18' }]}>
                <Feather name="log-out" size={17} color={colors.error} />
              </View>
              <Text style={[styles.navItemText, { color: colors.error, fontFamily: F.medium }]}>Log Out</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => { close(); setTimeout(() => router.push('/(auth)/login' as any), 120); }}
              style={({ pressed }) => [styles.navItem, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent', borderColor: 'transparent' }]}
              accessibilityRole="button"
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                <Feather name="log-in" size={17} color={colors.primary} />
              </View>
              <Text style={[styles.navItemText, { color: colors.primary, fontFamily: F.semiBold }]}>
                {isGuest ? 'Log In' : 'Log In'}
              </Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 1000,
    borderRightWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 0 },
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  appTheme: {
    fontFamily: F.medium,
    fontSize: 11,
  },
  navList: {
    padding: 12,
    flex: 1,
  },
  navLabel: {
    fontFamily: F.semiBold,
    fontSize: 11,
    letterSpacing: 0,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    borderWidth: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontSize: 14,
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authDivider: {
    borderTopWidth: 1,
    marginVertical: 8,
    marginHorizontal: 10,
  },
});
