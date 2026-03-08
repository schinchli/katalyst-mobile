import { View, Text, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore, LEVEL_NAMES, xpToNextLevel } from '@/stores/progressStore';
import { useThemeStore, ACCENT_PRESETS, type AccentPreset } from '@/stores/themeStore';
import { getMissingCount } from '@/config/appConfig';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

const BANNER_H = 100;
const AVATAR_SIZE = 80;
const AVATAR_RING = AVATAR_SIZE + 8;

const ACCOUNT_ITEMS = [
  { icon: 'bookmark',    label: 'Bookmarks',    route: '/(tabs)/bookmarks' },
  { icon: 'bell',        label: 'Notifications', route: undefined },
  { icon: 'moon',        label: 'Appearance',    route: undefined },
  { icon: 'download',    label: 'Downloads',     route: undefined },
] as const;

const SUPPORT_ITEMS = [
  { icon: 'help-circle', label: 'Help & Support', route: undefined },
  { icon: 'info',        label: 'About',           route: undefined },
] as const;

type Colors = ReturnType<typeof useThemeColors>;

function MenuSection({
  title,
  items,
  colors,
}: {
  title: string;
  items: readonly { icon: string; label: string; route?: string }[];
  colors: Colors;
}) {
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
      <Card padding={0} style={styles.menuCard}>
        {items.map((item, idx) => (
          <View key={item.label}>
            <Card
              onPress={() => { if (item.route) router.push(item.route as any); }}
              padding={16}
              style={styles.menuRow}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name={item.icon as any} size={17} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.textSecondary} />
            </Card>
            {idx < items.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
            )}
          </View>
        ))}
      </Card>
    </View>
  );
}

function ThemePicker({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const accent     = useThemeStore((s) => s.accent);
  const darkMode   = useThemeStore((s) => s.darkMode);
  const setAccent  = useThemeStore((s) => s.setAccent);
  const toggleDark = useThemeStore((s) => s.toggleDark);
  const presets    = Object.entries(ACCENT_PRESETS) as [AccentPreset, typeof ACCENT_PRESETS[AccentPreset]][];

  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
      <View style={[styles.themeCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>

        {/* Dark mode toggle row */}
        <Pressable
          onPress={toggleDark}
          style={[styles.darkRow, { borderBottomColor: colors.surfaceBorder }]}
          accessibilityRole="switch"
          accessibilityState={{ checked: darkMode }}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: darkMode ? '#43406B' : colors.primaryLight }]}>
            <Feather name={darkMode ? 'moon' : 'sun'} size={17} color={darkMode ? '#A79BF4' : colors.primary} />
          </View>
          <Text style={[styles.menuLabel, { color: colors.text, flex: 1 }]}>Dark Mode</Text>
          {/* Toggle pill */}
          <View style={[styles.toggleTrack, { backgroundColor: darkMode ? colors.primary : colors.surfaceBorder }]}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: darkMode ? 18 : 2 }] }]} />
          </View>
        </Pressable>

        {/* Accent color grid */}
        <View style={styles.themeGrid}>
          {presets.map(([key, cfg]) => {
            const isActive = accent === key;
            return (
              <Pressable
                key={key}
                onPress={() => setAccent(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                style={({ pressed }) => [
                  styles.themeBtn,
                  { borderColor: isActive ? cfg.primary : colors.surfaceBorder,
                    backgroundColor: isActive ? cfg.primary + '18' : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.themeCircle, { backgroundColor: cfg.primary }]}>
                  {isActive && <Feather name="check" size={11} color="#fff" />}
                </View>
                <Text style={[styles.themeLabel, { color: isActive ? cfg.primary : colors.textSecondary }]}>
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const colors   = useThemeColors();
  const user     = useAuthStore((s) => s.user);
  const signOut  = useAuthStore((s) => s.signOut);
  const progress       = useProgressStore((s) => s.progress);
  const loadDemoData   = useProgressStore((s) => s.loadDemoData);
  const { isDesktop, contentContainerWeb } = useWebLayout();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => { signOut(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  const initials  = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const isPremium = user?.subscription === 'premium';

  const level      = progress.level ?? 1;
  const levelName  = LEVEL_NAMES[level - 1] ?? 'Novice';
  const xpInfo     = xpToNextLevel(progress.xp ?? 0, level);
  const xpProgress = xpInfo.needed > 0 ? xpInfo.current / xpInfo.needed : 1;

  const stats = [
    {
      icon: 'check-square', label: 'Quizzes',
      value: progress.completedQuizzes,
      color: colors.primary,
      bg: colors.primaryLight,
    },
    {
      icon: 'trending-up', label: 'Avg Score',
      value: `${progress.averageScore}%`,
      color: colors.success,
      bg: colors.success + '22',
    },
    {
      icon: 'zap', label: 'Coins',
      value: (progress.coins ?? 0).toLocaleString(),
      color: colors.warning,
      bg: colors.warning + '22',
    },
    {
      icon: 'award', label: 'Badges',
      value: progress.badges.length,
      color: '#EA5455',
      bg: '#EA545522',
    },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={isDesktop ? [] : ['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, contentContainerWeb as any]}>

        {/* ── Profile Header ── */}
        <View style={styles.headerCard}>
          {/* Banner */}
          <View style={[styles.headerBanner, { backgroundColor: colors.primary }]} />

          {/* Avatar */}
          <View style={[styles.avatarRing, { backgroundColor: colors.background }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initials}</Text>
            </View>
          </View>

          {/* Body */}
          <View style={[styles.headerBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name ?? 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email ?? ''}</Text>
            <View style={styles.badgeWrap}>
              <Badge
                label={isPremium ? 'Premium' : 'Free Plan'}
                color={isPremium ? colors.aws : undefined}
                size="md"
              />
              <View style={[styles.levelBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.levelBadgeText, { color: colors.primary }]}>
                  Lv.{level} · {levelName}
                </Text>
              </View>
            </View>
            {/* XP Progress */}
            <View style={styles.xpWrap}>
              <View style={styles.xpRow}>
                <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP Progress</Text>
                <Text style={[styles.xpLabel, { color: colors.primary }]}>
                  {xpInfo.current}/{xpInfo.needed}
                </Text>
              </View>
              <ProgressBar progress={xpProgress} height={6} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Brand color picker ── */}
        <ThemePicker colors={colors} />

        {/* ── Menus ── */}
        <MenuSection title="ACCOUNT"      items={ACCOUNT_ITEMS} colors={colors} />
        <MenuSection title="APP SETTINGS" items={SUPPORT_ITEMS} colors={colors} />

        {/* ── Sign Out ── */}
        <View style={styles.signOutWrap}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              { borderColor: colors.error, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="log-out" size={16} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
          </Pressable>
        </View>

        {/* ── Developer Settings (DEV only) ── */}
        {__DEV__ && (
          <>
            <Pressable
              onPress={loadDemoData}
              style={({ pressed }) => [styles.devRow, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Feather name="database" size={15} color="#28C76F" />
              <Text style={[styles.devText, { color: '#28C76F' }]}>Load Demo Data</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/dev-config' as any)}
              style={({ pressed }) => [styles.devRow, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Feather name="settings" size={15} color={colors.primary} />
              <Text style={[styles.devText, { color: colors.primary }]}>Developer Settings</Text>
              {getMissingCount() > 0 && (
                <View style={[styles.devBadge, { backgroundColor: colors.error + '1A' }]}>
                  <Text style={[styles.devBadgeText, { color: colors.error }]}>{getMissingCount()}</Text>
                </View>
              )}
            </Pressable>
          </>
        )}

        {/* ── Version ── */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>Katalyst v1.0.0 · KataHQ</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 48 },

  /* ── Header ── */
  headerCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerBanner: {
    width: '100%',
    height: BANNER_H,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  avatarRing: {
    width: AVATAR_RING,
    height: AVATAR_RING,
    borderRadius: AVATAR_RING / 2,
    marginTop: -(AVATAR_RING / 2),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.bold,
    fontSize: 30,
  },
  headerBody: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  userName: {
    fontFamily: F.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: F.regular,
    fontSize: 13,
  },
  badgeWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
  },
  xpWrap: {
    marginTop: 12,
    width: '100%',
    gap: 6,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpLabel: {
    fontFamily: F.medium,
    fontSize: 12,
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontFamily: F.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    marginTop: 2,
  },

  /* ── Menu ── */
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: F.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  menuCard: {
    overflow: 'hidden',
  },
  menuRow: {
    borderRadius: 0,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontFamily: F.medium,
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },

  /* ── Theme picker ── */
  themeCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  darkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  themeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontFamily: F.medium,
    fontSize: 12,
  },

  /* ── Sign out ── */
  signOutWrap: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  signOutText: {
    fontFamily: F.semiBold,
    fontSize: 15,
  },

  /* ── Dev row ── */
  devRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  devText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
  devBadge: {
    borderRadius: 99,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
  },

  /* ── Version ── */
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});
