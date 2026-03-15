import { Alert, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { useThemeStore, ACCENT_PRESETS, type AccentPreset, type FontSizePreset } from '@/stores/themeStore';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

const PRESETS: AccentPreset[] = ['indigo', 'aurora', 'ocean', 'midnight', 'forest', 'sunset', 'amber', 'rose', 'emerald'];

const FONT_SIZE_OPTIONS: { key: FontSizePreset; label: string; sample: number }[] = [
  { key: 'small',  label: 'Small',  sample: 13 },
  { key: 'medium', label: 'Medium', sample: 15 },
  { key: 'large',  label: 'Large',  sample: 18 },
];

export default function ProfileScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const progress = useProgressStore((s) => s.progress);
  const accent             = useThemeStore((s) => s.accent);
  const setAccent          = useThemeStore((s) => s.setAccent);
  const animationsEnabled    = useThemeStore((s) => s.animationsEnabled);
  const setAnimationsEnabled = useThemeStore((s) => s.setAnimationsEnabled);
  const fontSizePreset       = useThemeStore((s) => s.fontSizePreset);
  const setFontSizePreset    = useThemeStore((s) => s.setFontSizePreset);
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
              <Feather name="edit-2" size={12} color="#FFFFFF" />
            </View>
          </View>
          <Text style={[styles.profileName, { color: colors.text, fontSize: t.screenTitle }]}>{user?.name ?? 'Katalyst learner'}</Text>
          <Text style={[styles.profileHandle, { color: colors.textSecondary, fontSize: t.body }]}>@{(user?.email ?? 'schinchli').split('@')[0]}</Text>
        </View>

        <Pressable onPress={() => Alert.alert('Share', 'Profile share action can be connected here.')} style={[styles.shareButton, { borderColor: colors.gradientAccent }]}>
          <Text style={[styles.shareButtonText, { color: colors.text }]}>{EXPERIENCE_COPY.profile.shareCta}</Text>
        </Pressable>


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
            { icon: 'shield',    label: 'Privacy Policy',            route: '/privacy' as const },
            { icon: 'file-text', label: 'Terms & Conditions',        route: '/terms' as const },
            { icon: 'info',      label: 'About Us',                  route: '/about' as const },
            { icon: 'help-circle', label: 'How To Play',             route: '/instructions' as const },
          ].map((item, index) => (
            <View key={item.label}>
              <Pressable onPress={() => item.route && router.push(item.route as any)} style={styles.listRow}>
                <Feather name={item.icon as any} size={24} color={colors.text} />
                <Text style={[styles.listLabel, { color: colors.text, fontSize: t.cardTitle }]}>{item.label}</Text>
                {item.badge ? <View style={[styles.rowBadge, { backgroundColor: colors.primary }]}><Text style={styles.rowBadgeText}>{item.badge}</Text></View> : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
              {index < 6 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Streaks</Text>
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
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Theme</Text>

          {/* Animations toggle */}
          <Pressable
            onPress={() => setAnimationsEnabled(!animationsEnabled)}
            style={[styles.prefRow, { borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.prefRowLeft}>
              <Feather name="zap" size={20} color={animationsEnabled ? colors.primary : colors.textSecondary} />
              <View>
                <Text style={[styles.prefLabel, { color: colors.text, fontSize: t.body }]}>Animations</Text>
                <Text style={[styles.prefSub, { color: colors.textSecondary, fontSize: t.caption }]}>
                  {animationsEnabled ? 'Smooth transitions enabled' : 'Instant transitions (reduced motion)'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: animationsEnabled ? colors.primary : colors.surfaceBorder }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: animationsEnabled ? 14 : 2 }] }]} />
            </View>
          </Pressable>

          {/* Font size selector */}
          <View style={[styles.prefRow, { borderColor: colors.surfaceBorder }]}>
            <View style={styles.prefRowLeft}>
              <Feather name="type" size={20} color={colors.primary} />
              <View>
                <Text style={[styles.prefLabel, { color: colors.text, fontSize: t.body }]}>Text Size</Text>
                <Text style={[styles.prefSub, { color: colors.textSecondary, fontSize: t.caption }]}>Affects quiz questions and answers</Text>
              </View>
            </View>
          </View>
          <View style={styles.fontSizeRow}>
            {FONT_SIZE_OPTIONS.map((opt) => {
              const active = fontSizePreset === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setFontSizePreset(opt.key)}
                  style={[styles.fontSizeBtn, {
                    backgroundColor: active ? colors.primary        : colors.backgroundAlt,
                    borderColor:     active ? colors.primary        : colors.surfaceBorder,
                  }]}
                >
                  <Text style={[styles.fontSizeBtnSample, { color: active ? '#fff' : colors.text, fontSize: opt.sample }]}>Aa</Text>
                  <Text style={[styles.fontSizeBtnLabel,  { color: active ? '#fff' : colors.textSecondary }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

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
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  profileTop: { alignItems: 'center', gap: 7 },
  avatarWrap: { width: 120, height: 120, borderRadius: 60, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  avatarInner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.bold, fontSize: 42 },
  editBadge: { position: 'absolute', right: 4, top: 4, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: F.bold, fontSize: 24, lineHeight: 30 },
  profileHandle: { fontFamily: F.medium, fontSize: 14 },
  shareButton: { minHeight: 42, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  shareButtonText: { fontFamily: F.bold, fontSize: 14 },
  offerCard: { borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 90, justifyContent: 'center', gap: 5, overflow: 'hidden' },
  offerTitle: { fontFamily: F.bold, fontSize: 17 },
  offerSubtitle: { fontFamily: F.bold, fontSize: 14 },
  offerArrow: { position: 'absolute', right: 12, top: 12, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  listCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  listLabel: { fontFamily: F.semiBold, fontSize: 15, flex: 1 },
  rowBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowBadgeText: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 12 },
  divider: { height: 1, marginHorizontal: 14 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 12 },
  panelTitle: { fontFamily: F.bold, fontSize: 17 },
  panelMetrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricValue: { fontFamily: F.bold, fontSize: 20 },
  metricLabel: { fontFamily: F.regular, fontSize: 12, marginTop: 3 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchCard: { width: '31%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', gap: 5 },
  swatchBubble: { width: 26, height: 26, borderRadius: 13 },
  swatchLabel: { fontFamily: F.medium, fontSize: 10, textAlign: 'center' },
  signOutButton: { borderWidth: 1.5, borderRadius: 12, minHeight: 42, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  adminButton: { borderWidth: 1.5, borderRadius: 12, minHeight: 42, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  adminButtonText: { fontFamily: F.bold, fontSize: 13 },
  signOutText: { fontFamily: F.bold, fontSize: 13 },
  // Preferences
  prefRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, gap: 10 },
  prefRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  prefLabel:    { fontFamily: F.semiBold, fontSize: 14 },
  prefSub:      { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  toggle:       { width: 36, height: 22, borderRadius: 11, justifyContent: 'center' },
  toggleThumb:  { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  // Font size
  fontSizeRow:       { flexDirection: 'row', gap: 8 },
  fontSizeBtn:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 3 },
  fontSizeBtnSample: { fontFamily: 'PublicSans-Bold' },
  fontSizeBtnLabel:  { fontFamily: 'PublicSans-Medium', fontSize: 10 },
});
