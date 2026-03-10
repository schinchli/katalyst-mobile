import { View, Text, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { F } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useThemeColor';

const MENU_WIDTH = 260;

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index:    { icon: 'home',         label: 'Home' },
  quizzes:  { icon: 'book-open',    label: 'Quizzes' },
  learn:    { icon: 'play-circle',  label: 'Learn' },
  progress: { icon: 'trending-up',  label: 'Progress' },
  search:   { icon: 'search',       label: 'Search' },
  profile:  { icon: 'user',         label: 'Profile' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const colors    = useThemeColors();

  const navigate = (route: (typeof state.routes)[0], isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  // Filter out hidden routes (those not in TAB_CONFIG)
  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);

  // ── Desktop: Vuexy vertical sidebar ──────────────────────────────────────
  if (isDesktop) {
    return (
      <View
        style={{
          width: MENU_WIDTH,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.surfaceBorder,
          // stretch to full viewport height on web
          ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : { flex: 1 }),
        }}
      >
        {/* ── App brand ─────────────────────────────────────────────────── */}
        <View
          style={{
            height: 68,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceBorder,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOpacity: 0.4,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            <Feather name="zap" size={19} color="#FFFFFF" />
          </View>
          <View>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: colors.text, letterSpacing: -0.3 }}>
              Katalyst
            </Text>
            <Text style={{ fontFamily: F.medium, fontSize: 10, color: colors.textSecondary }}>
              AWS GenAI Prep
            </Text>
          </View>
        </View>

        {/* ── Navigation items ──────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        >
          <Text
            style={{
              fontFamily: F.semiBold,
              fontSize: 11,
              color: colors.textSecondary,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              paddingHorizontal: 8,
              marginBottom: 4,
              marginTop: 4,
            }}
          >
            Navigation
          </Text>

          {visibleRoutes.map((route) => {
            const isFocused = state.routes[state.index]?.name === route.name;
            const cfg = TAB_CONFIG[route.name] ?? { icon: 'circle' as any, label: route.name };

            return (
              <Pressable
                key={route.key}
                onPress={() => navigate(route, isFocused)}
                style={({ pressed, hovered }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderRadius: 12,
                  marginBottom: 4,
                  backgroundColor: isFocused
                    ? colors.primary
                    : (hovered || pressed)
                    ? colors.primaryLight
                    : 'transparent',
                } as any)}
              >
                <Feather
                  name={cfg.icon}
                  size={20}
                  color={isFocused ? '#FFFFFF' : colors.text}
                />
                <Text
                  style={{
                    fontFamily: isFocused ? F.semiBold : F.regular,
                    fontSize: 14,
                    color: isFocused ? '#FFFFFF' : colors.text,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.surfaceBorder,
            padding: 16,
          }}
        >
          <Text style={{ fontFamily: F.regular, fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
            v1.0.0 · KataHQ
          </Text>
        </View>
      </View>
    );
  }

  // ── Mobile: Premium bottom tab bar with pill indicator ───────────────────
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceBorder,
        height: 92,
        paddingBottom: 24,
        paddingTop: 8,
        shadowColor: '#4B465C',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -3 },
      }}
    >
      {visibleRoutes.map((route) => {
        const isFocused = state.routes[state.index]?.name === route.name;
        const cfg = TAB_CONFIG[route.name] ?? { icon: 'circle' as any, label: route.name };
        return (
          <Pressable
            key={route.key}
            onPress={() => navigate(route, isFocused)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 7 }}
          >
            {/* Active indicator bar */}
            {isFocused && (
              <View style={{
                position: 'absolute',
                top: 0,
                width: 20,
                height: 3,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                backgroundColor: colors.primary,
              }} />
            )}
            {/* Icon with pill background when active */}
            <View style={{
              width: 44,
              height: 32,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isFocused ? colors.primaryLight : 'transparent',
            }}>
              <Feather
                name={cfg.icon}
                size={21}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              style={{
                fontFamily: isFocused ? F.semiBold : F.regular,
                fontSize: 11,
                color: isFocused ? colors.primary : colors.textSecondary,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
