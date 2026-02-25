import { View, Text, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { F } from '@/constants/Typography';

// ─── Vuexy v10.11.1 exact token values (light mode) ─────────────────────────
const VX = {
  primary:       '#7367F0',
  primaryRgb:    '115, 103, 240',
  bg:            '#F8F7FA',
  surface:       '#FFFFFF',
  border:        '#DBDADE',
  text:          '#444050',   // menu item color (Vuexy --bs-menu-color)
  muted:         '#A5A3AE',   // section header color
  activeText:    '#FFFFFF',   // white text on gradient
  menuWidth:     260,
};

const TAB_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index:    { icon: 'home',        label: 'Home' },
  quizzes:  { icon: 'book-open',   label: 'Quizzes' },
  progress: { icon: 'bar-chart-2', label: 'Progress' },
  profile:  { icon: 'user',        label: 'Profile' },
};

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const navigate = (route: (typeof state.routes)[0], isFocused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  // ── Desktop: Vuexy vertical sidebar ──────────────────────────────────────
  if (isDesktop) {
    return (
      <View
        style={{
          width: VX.menuWidth,
          backgroundColor: VX.surface,
          borderRightWidth: 1,
          borderRightColor: VX.border,
          // stretch to full viewport height on web
          ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : { flex: 1 }),
        }}
      >
        {/* ── App brand ─────────────────────────────────────────────────── */}
        <View
          style={{
            height: 64,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: VX.border,
          }}
        >
          {/* Vuexy-style logo mark */}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: VX.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="zap" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: '#2F2B3D', letterSpacing: -0.2 }}>
              Katalyst
            </Text>
            <Text style={{ fontFamily: F.medium, fontSize: 10, color: VX.muted, marginTop: -1 }}>
              KataHQ Platform
            </Text>
          </View>
        </View>

        {/* ── Navigation items ──────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        >
          {/* Section label */}
          <Text
            style={{
              fontFamily: F.semiBold,
              fontSize: 11,
              color: VX.muted,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              paddingHorizontal: 8,
              marginBottom: 4,
              marginTop: 4,
            }}
          >
            Navigation
          </Text>

          {state.routes.map((route, idx) => {
            const isFocused = state.index === idx;
            const cfg = TAB_CONFIG[route.name] ?? { icon: 'circle' as any, label: route.name };

            return (
              <Pressable
                key={route.key}
                onPress={() => navigate(route, isFocused)}
                style={({ pressed, hovered }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginBottom: 2,
                  // Vuexy active: purple gradient + shadow
                  background: isFocused
                    ? `linear-gradient(270deg, rgba(${VX.primaryRgb}, 0.7) 0%, ${VX.primary} 100%)`
                    : undefined,
                  backgroundColor: isFocused
                    ? VX.primary
                    : (hovered || pressed)
                    ? `rgba(${VX.primaryRgb}, 0.06)`
                    : 'transparent',
                  boxShadow: isFocused
                    ? `0 2px 6px 0 rgba(${VX.primaryRgb}, 0.3)`
                    : undefined,
                } as any)}
              >
                <Feather
                  name={cfg.icon}
                  size={20}
                  color={isFocused ? VX.activeText : VX.text}
                />
                <Text
                  style={{
                    fontFamily: isFocused ? F.semiBold : F.regular,
                    fontSize: 14,
                    color: isFocused ? VX.activeText : VX.text,
                    flex: 1,
                  }}
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
            borderTopColor: VX.border,
            padding: 16,
          }}
        >
          <Text style={{ fontFamily: F.regular, fontSize: 11, color: VX.muted, textAlign: 'center' }}>
            v1.0.0 · KataHQ
          </Text>
        </View>
      </View>
    );
  }

  // ── Mobile: Vuexy-coloured bottom tab bar ─────────────────────────────────
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: VX.surface,
        borderTopWidth: 1,
        borderTopColor: VX.border,
        height: 88,
        paddingBottom: 28,
        paddingTop: 8,
      }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const cfg = TAB_CONFIG[route.name] ?? { icon: 'circle' as any, label: route.name };
        return (
          <Pressable
            key={route.key}
            onPress={() => navigate(route, isFocused)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <Feather
              name={cfg.icon}
              size={22}
              color={isFocused ? VX.primary : VX.muted}
            />
            <Text
              style={{
                fontFamily: F.semiBold,
                fontSize: 10,
                color: isFocused ? VX.primary : VX.muted,
              }}
            >
              {cfg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
