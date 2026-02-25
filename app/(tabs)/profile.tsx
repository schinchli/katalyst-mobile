import { View, Text, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { getMissingCount } from '@/config/appConfig';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

const BANNER_H = 100;
const AVATAR_SIZE = 80;
const AVATAR_RING = AVATAR_SIZE + 8;

const ACCOUNT_ITEMS = [
  { icon: 'bell',        label: 'Notifications' },
  { icon: 'moon',        label: 'Appearance' },
  { icon: 'download',    label: 'Downloads' },
] as const;

const SUPPORT_ITEMS = [
  { icon: 'help-circle', label: 'Help & Support' },
  { icon: 'info',        label: 'About' },
] as const;

type Colors = ReturnType<typeof useThemeColors>;

function MenuSection({
  title,
  items,
  colors,
}: {
  title: string;
  items: readonly { icon: string; label: string }[];
  colors: Colors;
}) {
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
      <Card padding={0} style={styles.menuCard}>
        {items.map((item, idx) => (
          <View key={item.label}>
            <Card onPress={() => {}} padding={16} style={styles.menuRow}>
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

export default function ProfileScreen() {
  const colors   = useThemeColors();
  const user     = useAuthStore((s) => s.user);
  const signOut  = useAuthStore((s) => s.signOut);
  const progress = useProgressStore((s) => s.progress);
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
      icon: 'award', label: 'Badges',
      value: progress.badges.length,
      color: colors.warning,
      bg: colors.warning + '22',
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
          <Pressable
            onPress={() => router.push('/dev-config' as any)}
            style={({ pressed }) => [styles.devRow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="settings" size={15} color={colors.primary} />
            <Text style={[styles.devText, { color: colors.primary }]}>Developer Settings</Text>
            {getMissingCount() > 0 && (
              <View style={[styles.devBadge, { backgroundColor: colors.error + '1A' }]}>
                <Text style={[styles.devBadgeText, { color: colors.error }]}>{getMissingCount()}</Text>
              </View>
            )}
          </Pressable>
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
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
