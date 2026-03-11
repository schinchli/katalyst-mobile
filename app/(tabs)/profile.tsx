import { Alert, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useThemeStore, ACCENT_PRESETS, type AccentPreset } from '@/stores/themeStore';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

const PRESETS: AccentPreset[] = ['indigo', 'aurora', 'ocean', 'midnight', 'forest', 'sunset', 'amber', 'rose', 'emerald'];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const progress = useProgressStore((s) => s.progress);
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);
  const initials = user?.name?.charAt(0)?.toUpperCase() ?? 'K';
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileTop}>
          <View style={[styles.avatarWrap, { borderColor: colors.surfaceBorder }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Feather name="edit-2" size={16} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name ?? 'Katalyst learner'}</Text>
          <Text style={[styles.profileHandle, { color: colors.textSecondary }]}>@{(user?.email ?? 'schinchli').split('@')[0]}</Text>
        </View>

        <Pressable onPress={() => Alert.alert('Share', 'Profile share action can be connected here.')} style={[styles.shareButton, { borderColor: colors.gradientAccent }]}>
          <Text style={[styles.shareButtonText, { color: colors.text }]}>{EXPERIENCE_COPY.profile.shareCta}</Text>
        </Pressable>

        <LinearGradient colors={[colors.surface, colors.surfaceElevated]} style={[styles.offerCard, { borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.offerTitle, { color: colors.text }]}>{platformConfig.copy.profileOfferTitle}</Text>
          <Text style={[styles.offerSubtitle, { color: platformConfig.colors.profileOfferAccent }]}>{platformConfig.copy.profileOfferSubtitle}</Text>
          <View style={[styles.offerArrow, { backgroundColor: colors.backgroundAlt }]}>
            <Feather name="arrow-right" size={18} color={colors.text} />
          </View>
        </LinearGradient>

        {isAdmin ? (
          <Pressable onPress={() => router.push('/admin-settings' as any)} style={[styles.adminButton, { borderColor: colors.primary }]}>
            <Feather name="tool" size={16} color={colors.primary} />
            <Text style={[styles.adminButtonText, { color: colors.primary }]}>Admin mobile settings</Text>
          </Pressable>
        ) : null}

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'bell',      label: 'Notifications', badge: '1', route: null },
            { icon: 'award',     label: 'Leaderboard',               route: '/leaderboard' as const },
            { icon: 'book-open', label: 'My library',                route: '/(tabs)/bookmarks' as const },
          ].map((item, index) => (
            <View key={item.label}>
              <Pressable onPress={() => item.route && router.push(item.route as any)} style={styles.listRow}>
                <Feather name={item.icon as any} size={24} color={colors.text} />
                <Text style={[styles.listLabel, { color: colors.text }]}>{item.label}</Text>
                {item.badge ? <View style={[styles.rowBadge, { backgroundColor: colors.primary }]}><Text style={styles.rowBadgeText}>{item.badge}</Text></View> : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
              {index < 2 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Streaks</Text>
          <View style={styles.panelMetrics}>
            <View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{progress.currentStreak} days</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{Math.max(0, 2 - Math.min(2, progress.currentStreak))} freezes</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Left</Text>
            </View>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>Theme</Text>
          <View style={styles.swatchGrid}>
            {PRESETS.map((preset) => {
              const item = ACCENT_PRESETS[preset];
              const active = accent === preset;
              return (
                <Pressable key={preset} onPress={() => setAccent(preset)} style={[styles.swatchCard, { borderColor: active ? item.primary : colors.surfaceBorder, backgroundColor: active ? colors.backgroundAlt : 'transparent' }]}>
                  <LinearGradient colors={[item.gradientFrom, item.gradientTo]} style={styles.swatchBubble} />
                  <Text style={[styles.swatchLabel, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={() => signOut()} style={[styles.signOutButton, { borderColor: colors.error }]}>
          <Feather name="log-out" size={16} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 18 },
  profileTop: { alignItems: 'center', gap: 10 },
  avatarWrap: { width: 164, height: 164, borderRadius: 82, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  avatarInner: { width: 152, height: 152, borderRadius: 76, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.bold, fontSize: 58 },
  editBadge: { position: 'absolute', right: 6, top: 6, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: F.bold, fontSize: 28, lineHeight: 34 },
  profileHandle: { fontFamily: F.medium, fontSize: 17 },
  shareButton: { minHeight: 56, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { fontFamily: F.bold, fontSize: 18 },
  offerCard: { borderWidth: 1, borderRadius: 26, padding: 18, minHeight: 124, justifyContent: 'center', gap: 6, overflow: 'hidden' },
  offerTitle: { fontFamily: F.bold, fontSize: 22 },
  offerSubtitle: { fontFamily: F.bold, fontSize: 18 },
  offerArrow: { position: 'absolute', right: 18, top: 18, width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  listCard: { borderWidth: 1, borderRadius: 28, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 18 },
  listLabel: { fontFamily: F.semiBold, fontSize: 18, flex: 1 },
  rowBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowBadgeText: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 16 },
  divider: { height: 1, marginHorizontal: 18 },
  panel: { borderWidth: 1, borderRadius: 28, padding: 18, gap: 16 },
  panelTitle: { fontFamily: F.bold, fontSize: 18 },
  panelMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricValue: { fontFamily: F.bold, fontSize: 22 },
  metricLabel: { fontFamily: F.regular, fontSize: 14, marginTop: 4 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchCard: { width: '31%', borderWidth: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 8 },
  swatchBubble: { width: 34, height: 34, borderRadius: 17 },
  swatchLabel: { fontFamily: F.medium, fontSize: 11, textAlign: 'center' },
  signOutButton: { borderWidth: 1.5, borderRadius: 18, minHeight: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  adminButton: { borderWidth: 1.5, borderRadius: 18, minHeight: 54, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  adminButtonText: { fontFamily: F.bold, fontSize: 16 },
  signOutText: { fontFamily: F.bold, fontSize: 16 },
});
