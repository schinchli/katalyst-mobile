import { View, Text, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { F } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useThemeColor';
import { EXPERIENCE_COPY } from '@/config/experience';

const MENU_WIDTH = 274;

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  quizzes: { icon: 'compass', label: 'Explore' },
  learn: { icon: 'book-open', label: 'Resources' },
  progress: { icon: 'bar-chart-2', label: 'Growth' },
  profile: { icon: 'sliders', label: 'Profile' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const colors = useThemeColors();

  const visibleRoutes = state.routes.filter((route) => TAB_CONFIG[route.name]);

  const navigate = (route: (typeof state.routes)[0], isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  if (isDesktop) {
    return (
      <View
        style={{
          width: MENU_WIDTH,
          backgroundColor: colors.surface,
          borderRightWidth: 1,
          borderRightColor: colors.surfaceBorder,
          minHeight: Platform.OS === 'web' ? ('100vh' as any) : undefined,
        }}
      >
        <LinearGradient
          colors={[colors.backgroundAlt, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 22, paddingTop: 28, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LinearGradient
              colors={[colors.primary, colors.gradientAccent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="activity" size={20} color="#04111F" />
            </LinearGradient>
            <View>
              <Text style={{ color: colors.text, fontFamily: F.bold, fontSize: 18 }}>{EXPERIENCE_COPY.appName}</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: F.medium, fontSize: 11 }}>
                {EXPERIENCE_COPY.themeName} mobile theme
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <Text
            style={{
              color: colors.textMuted,
              fontFamily: F.semiBold,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.1,
              marginBottom: 10,
              paddingHorizontal: 10,
            }}
          >
            Navigation
          </Text>
          {visibleRoutes.map((route) => {
            const isFocused = state.routes[state.index]?.name === route.name;
            const tab = TAB_CONFIG[route.name];
            return (
              <Pressable
                key={route.key}
                onPress={() => navigate(route, isFocused)}
                style={({ pressed, hovered }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 18,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  marginBottom: 6,
                  backgroundColor: isFocused ? colors.surfaceElevated : hovered || pressed ? colors.backgroundAlt : 'transparent',
                  borderWidth: 1,
                  borderColor: isFocused ? colors.primary : 'transparent',
                })}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: isFocused ? colors.primaryLight : colors.backgroundAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Feather name={tab.icon} size={18} color={isFocused ? colors.primary : colors.textSecondary} />
                </View>
                <Text style={{ color: isFocused ? colors.text : colors.textSecondary, fontFamily: isFocused ? F.semiBold : F.medium, fontSize: 14, flex: 1 }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceBorder,
        paddingTop: 8,
        paddingBottom: 24,
        shadowColor: '#020617',
        shadowOpacity: 0.24,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -6 },
        elevation: 12,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {visibleRoutes.map((route) => {
          const isFocused = state.routes[state.index]?.name === route.name;
          const tab = TAB_CONFIG[route.name];
          return (
            <Pressable
              key={route.key}
              onPress={() => navigate(route, isFocused)}
              style={{ flex: 1, alignItems: 'center', gap: 5 }}
            >
              <View style={{ height: 4, width: 20, borderRadius: 999, backgroundColor: isFocused ? colors.primary : 'transparent' }} />
              <View
                style={{
                  width: 46,
                  height: 34,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFocused ? colors.primaryLight : 'transparent',
                }}
              >
                <Feather name={tab.icon} size={20} color={isFocused ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={{ color: isFocused ? colors.text : colors.textSecondary, fontFamily: isFocused ? F.semiBold : F.medium, fontSize: 11 }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
