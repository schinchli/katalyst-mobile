import React from 'react';
import { Alert, Share, View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
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
import { AppConfig } from '@/config/appConfig';
import { supabase } from '@/config/supabase';
import type { ReferralInfo } from '@/types';
import { THEME_PRESET_ORDER } from '@/stores/themeStore';

const PRESETS: AccentPreset[] = THEME_PRESET_ORDER;

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
  const [referral, setReferral] = React.useState<ReferralInfo | null>(null);
  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const base = AppConfig.web.baseUrl.replace(/\/$/, '');
      try {
        const res = await fetch(`${base}/api/referral`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json() as { ok: boolean; code?: string; referredCount?: number; coinsEarned?: number };
        if (body.ok && body.code) {
          setReferral({ code: body.code, referredCount: body.referredCount ?? 0, coinsEarned: body.coinsEarned ?? 0 });
        }
      } catch { /* non-fatal */ }
    })();
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setDeleteError('Session expired. Please sign in again.');
        setDeleteLoading(false);
        return;
      }
      const base = AppConfig.web.baseUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/account/delete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json() as { ok: boolean; error?: string };
      if (!body.ok) {
        setDeleteError(body.error ?? 'Deletion failed. Please try again.');
        setDeleteLoading(false);
        return;
      }
      // Sign out and navigate to login
      await signOut();
    } catch {
      setDeleteError('An unexpected error occurred. Please try again.');
      setDeleteLoading(false);
    }
  };

  const handleShareReferral = async () => {
    if (!referral) return;
    const base = AppConfig.web.baseUrl.replace(/\/$/, '');
    const link = `${base}/signup?ref=${referral.code}`;
    await Share.share({
      message: `Join me on Katalyst for AWS & GenAI cert prep! Use my referral code ${referral.code}: ${link}`,
      url: link,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileTop}>
          <View style={[styles.avatarWrap, { borderColor: colors.surfaceBorder }]}>
            <View style={[styles.avatarInner, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Feather name="edit-2" size={12} color={colors.surface} />
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

        {referral ? (
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Refer a Friend</Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Earn coins when friends sign up with your code.
            </Text>
            <View style={styles.referralCodeRow}>
              <Text style={[styles.referralCode, { color: colors.primary, borderColor: colors.surfaceBorder }]}>
                {referral.code}
              </Text>
              <Pressable onPress={handleShareReferral} style={[styles.shareReferralBtn, { backgroundColor: colors.primary }]}>
                <Feather name="share-2" size={14} color={colors.surface} />
                <Text style={[styles.shareReferralText, { color: colors.surface }]}>Share</Text>
              </Pressable>
            </View>
            <View style={styles.referralStats}>
              <View>
                <Text style={[styles.metricValue, { color: colors.text }]}>{referral.referredCount}</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Friends referred</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.metricValue, { color: colors.warning }]}>{referral.coinsEarned} ⚡</Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Coins earned</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── IAP / Subscription notice (P6-4) ────────────────────────────── */}
        {/* TODO: Replace with Apple StoreKit / Google Play Billing before App Store submission */}
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Premium Subscription</Text>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Premium subscriptions are managed through the App Store / Google Play.
            Tap &quot;Restore Purchases&quot; if you&apos;ve already subscribed.
          </Text>
          <Pressable
            onPress={() => Alert.alert(
              'Restore Purchases',
              'Coming soon — contact support@katalyst.app to restore your subscription.',
              [{ text: 'OK', style: 'default' }],
            )}
            style={[styles.restoreBtn, { borderColor: colors.primary }]}
          >
            <Feather name="refresh-cw" size={14} color={colors.primary} />
            <Text style={[styles.restoreBtnText, { color: colors.primary }]}>Restore Purchases</Text>
          </Pressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'bell',       label: 'Notifications',   badge: '1', route: null },
            { icon: 'award',      label: 'Leaderboard',                  route: '/leaderboard' as const },
            { icon: 'zap',        label: 'Coin History',                 route: '/coin-history' as const },
            { icon: 'book-open',  label: 'My library',                   route: '/(tabs)/bookmarks' as const },
            { icon: 'shield',     label: 'Privacy Policy',               route: '/privacy' as const },
            { icon: 'file-text',  label: 'Terms & Conditions',           route: '/terms' as const },
            { icon: 'info',       label: 'About Us',                     route: '/about' as const },
            { icon: 'help-circle',label: 'How To Play',                  route: '/instructions' as const },
          ].map((item, index) => (
            <View key={item.label}>
              <Pressable onPress={() => item.route && router.push(item.route as any)} style={styles.listRow}>
                <Feather name={item.icon as any} size={24} color={colors.text} />
                <Text style={[styles.listLabel, { color: colors.text, fontSize: t.cardTitle }]}>{item.label}</Text>
                {item.badge ? <View style={[styles.rowBadge, { backgroundColor: colors.primary }]}><Text style={[styles.rowBadgeText, { color: colors.surface }]}>{item.badge}</Text></View> : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
              {index < 7 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
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
                  <Text style={[styles.fontSizeBtnSample, { color: active ? colors.surface : colors.text, fontSize: opt.sample }]}>Aa</Text>
                  <Text style={[styles.fontSizeBtnLabel,  { color: active ? colors.surface : colors.textSecondary }]}>{opt.label}</Text>
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

        {/* ── Danger Zone ────────────────────────────────────────────── */}
        <View style={[styles.dangerZone, { borderColor: colors.error + '4D', backgroundColor: colors.surface }]}>
          <Text style={[styles.dangerTitle, { color: colors.error }]}>Danger Zone</Text>
          <Text style={[styles.dangerDesc, { color: colors.textSecondary }]}>
            Deleting your account is permanent. All progress, quiz history, and profile data will be erased.
          </Text>
          {!showDeleteConfirm ? (
            <Pressable
              onPress={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); setDeleteError(''); }}
              style={[styles.deleteBtn, { borderColor: colors.error }]}
            >
              <Feather name="trash-2" size={15} color={colors.error} />
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Account</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: colors.error, lineHeight: 18 }}>
                Type DELETE to confirm permanent account deletion.
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE"
                placeholderTextColor={colors.textSecondary}
                style={[styles.deleteInput, { borderColor: deleteConfirmText === 'DELETE' ? colors.error : colors.surfaceBorder, color: colors.text, backgroundColor: colors.backgroundAlt }]}
                autoCapitalize="characters"
              />
              {deleteError ? <Text style={{ fontFamily: F.regular, fontSize: 12, color: colors.error }}>{deleteError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                  style={[styles.deleteConfirmBtn, { backgroundColor: deleteConfirmText === 'DELETE' ? colors.error : colors.surfaceBorder }]}
                >
                  <Text style={[styles.deleteConfirmText, { color: colors.surface, opacity: deleteConfirmText === 'DELETE' ? 1 : 0.5 }]}>
                    {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                  style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
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
  rowBadgeText: { fontFamily: F.bold, fontSize: 12 },
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
  dangerZone: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  dangerTitle: { fontFamily: F.bold, fontSize: 15 },
  dangerDesc: { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  deleteBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  deleteBtnText: { fontFamily: F.bold, fontSize: 13 },
  deleteInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.regular, fontSize: 14 },
  deleteConfirmBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  deleteConfirmText: { fontFamily: F.bold, fontSize: 13 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelBtnText: { fontFamily: F.bold, fontSize: 13 },
  adminButton: { borderWidth: 1.5, borderRadius: 12, minHeight: 42, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  adminButtonText: { fontFamily: F.bold, fontSize: 13 },
  signOutText: { fontFamily: F.bold, fontSize: 13 },
  // Preferences
  prefRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, gap: 10 },
  prefRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  prefLabel:    { fontFamily: F.semiBold, fontSize: 14 },
  prefSub:      { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  toggle:       { width: 36, height: 22, borderRadius: 11, justifyContent: 'center' },
  toggleThumb:  { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  // IAP / Restore
  restoreBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 8 },
  restoreBtnText:  { fontFamily: 'PublicSans-Bold', fontSize: 13 },
  // Referral
  referralCodeRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  referralCode:      { fontFamily: 'PublicSans-Bold', fontSize: 20, letterSpacing: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  shareReferralBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  shareReferralText: { fontFamily: 'PublicSans-Bold', fontSize: 13 },
  referralStats:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  // Font size
  fontSizeRow:       { flexDirection: 'row', gap: 8 },
  fontSizeBtn:       { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 3 },
  fontSizeBtnSample: { fontFamily: 'PublicSans-Bold' },
  fontSizeBtnLabel:  { fontFamily: 'PublicSans-Medium', fontSize: 10 },
});
