import { View, Text, ScrollView, Alert, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { getMissingCount } from '@/config/appConfig';
import { useWebLayout } from '@/hooks/useWebLayout';

const ACCOUNT_ITEMS = [
  { icon: 'bell',        label: 'Notifications', route: null },
  { icon: 'moon',        label: 'Appearance',    route: null },
  { icon: 'download',    label: 'Downloads',     route: null },
] as const;

const SUPPORT_ITEMS = [
  { icon: 'help-circle', label: 'Help & Support', route: null },
  { icon: 'info',        label: 'About',          route: null },
] as const;

function MenuSection({
  title,
  items,
  colors,
}: {
  title: string;
  items: readonly { icon: string; label: string; route: null }[];
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.menuSection}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{title}</Text>
      <Card padding={0} style={styles.menuCard}>
        {items.map((item, idx) => (
          <View key={item.label}>
            <Card
              onPress={() => {}}
              padding={16}
              style={styles.menuRow}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#7367F014' }]}>
                <Feather name={item.icon as any} size={17} color="#7367F0" />
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

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const isPremium = user?.subscription === 'premium';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={isDesktop ? [] : ['top']}>
      <ScrollView contentContainerStyle={[styles.scroll, contentContainerWeb as any]}>

        {/* ── Profile Header ────────────────────────────── */}
        <View style={styles.headerCard}>
          {/* Purple banner */}
          <View style={styles.headerBanner} />

          {/* Avatar straddling the boundary */}
          <View style={[styles.avatarRing, { backgroundColor: colors.surface }]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitial}>{initials}</Text>
            </View>
          </View>

          {/* White body */}
          <View style={[styles.headerBody, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name ?? 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email ?? ''}
            </Text>
            <View style={styles.badgeWrap}>
              <Badge
                label={isPremium ? 'Premium' : 'Free Plan'}
                color={isPremium ? colors.aws : undefined}
                size="md"
              />
            </View>
          </View>
        </View>

        {/* ── Quick Stats ───────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Quizzes */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#7367F014' }]}>
              <Feather name="check-square" size={18} color="#7367F0" />
            </View>
            <Text style={[styles.statNumber, { color: '#7367F0' }]}>{progress.completedQuizzes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quizzes</Text>
          </View>

          {/* Avg Score */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#28C76F14' }]}>
              <Feather name="trending-up" size={18} color="#28C76F" />
            </View>
            <Text style={[styles.statNumber, { color: '#28C76F' }]}>{progress.averageScore}%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Score</Text>
          </View>

          {/* Badges */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FF9F4314' }]}>
              <Feather name="award" size={18} color="#FF9F43" />
            </View>
            <Text style={[styles.statNumber, { color: '#FF9F43' }]}>{progress.badges.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Badges</Text>
          </View>
        </View>

        {/* ── Account Menu ──────────────────────────────── */}
        <MenuSection title="ACCOUNT" items={ACCOUNT_ITEMS} colors={colors} />
        <MenuSection title="APP SETTINGS" items={SUPPORT_ITEMS} colors={colors} />

        {/* ── Sign Out ──────────────────────────────────── */}
        <View style={styles.signOutWrap}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutBtn,
              { borderColor: '#FF4C51', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="log-out" size={16} color="#FF4C51" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* ── Developer Settings (DEV only) ─────────────── */}
        {__DEV__ && (
          <Pressable
            onPress={() => router.push('/dev-config' as any)}
            style={({ pressed }) => [styles.devRow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="settings" size={15} color="#7367F0" />
            <Text style={styles.devText}>Developer Settings</Text>
            {getMissingCount() > 0 && (
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>{getMissingCount()}</Text>
              </View>
            )}
          </Pressable>
        )}

        {/* ── Version ───────────────────────────────────── */}
        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Katalyst v1.0.0 · KataHQ
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const BANNER_H = 100;
const AVATAR_SIZE = 80;
const AVATAR_RING = AVATAR_SIZE + 8; // 4px ring each side

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 48 },

  /* ── Header card ── */
  headerCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerBanner: {
    width: '100%',
    height: BANNER_H,
    backgroundColor: '#7367F0',
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
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '700',
    color: '#7367F0',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
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
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  /* ── Menu ── */
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FF4C51',
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
    fontSize: 13,
    fontWeight: '500',
    color: '#7367F0',
  },
  devBadge: {
    backgroundColor: '#FF4C511A',
    borderRadius: 99,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4C51',
  },

  /* ── Version ── */
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});
