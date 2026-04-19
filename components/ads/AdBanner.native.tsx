import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/config/supabase';
import { useThemeColors } from '@/hooks/useThemeColor';

const isExpoGo = Constants.appOwnership === 'expo';

const WEB_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://learnkloud.today';

/**
 * AdBanner.native — mobile ad banner placeholder.
 *
 * Gating:
 *  - Never shown in Expo Go (no native SDK available)
 *  - Checks systemFeatures.adsEnabled + systemFeatures.bannerAdsEnabled from /api/system-features
 *  - Checks user's adsRemoved flag from /api/ads (per-user entitlement)
 *
 * TODO: Replace house banner with AdMob/Google Mobile Ads SDK before App Store submission.
 */
export function AdBanner(_props: { style?: object }) {
  const colors = useThemeColors();
  const user       = useAuthStore((s) => s.user);
  // adsRemoved from store is the fastest path — set during initAuth from user_profiles.ads_removed
  const adsRemovedStore = useAuthStore((s) => s.adsRemoved);
  const [adsEnabled, setAdsEnabled]   = useState(true);
  const [adsRemovedApi, setAdsRemovedApi] = useState(false);

  useEffect(() => {
    // Check global kill-switch from system-features
    fetch(`${WEB_BASE_URL}/api/system-features`)
      .then((r) => r.json())
      .then((body: { config?: { adsEnabled?: boolean; bannerAdsEnabled?: boolean } }) => {
        if (body.config?.adsEnabled === false || body.config?.bannerAdsEnabled === false) {
          setAdsEnabled(false);
        }
      })
      .catch(() => { /* best-effort */ });

    // Check per-user remove-ads entitlement via API (fallback for when store is stale)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return;
      fetch(`${WEB_BASE_URL}/api/ads`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((body: { ok: boolean; adsRemoved?: boolean }) => {
          if (body.ok && body.adsRemoved) setAdsRemovedApi(true);
        })
        .catch(() => { /* best-effort */ });
    }).catch(() => { /* best-effort */ });
  }, []);

  // If adsRemoved is true (from store or API), render nothing
  if (isExpoGo) return null;
  if (!adsEnabled) return null;
  if (adsRemovedStore || adsRemovedApi) return null;
  if ((user as { subscription?: string } | null)?.subscription === 'premium') return null;

  return (
    <View style={[s.banner, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
      <Text style={[s.title, { color: colors.surface }]}>LearnKloud.Today</Text>
      <Text style={[s.subtitle, { color: colors.primaryLight }]}>Upgrade to Pro · Unlock all quizzes</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    height: 64,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  subtitle: { fontSize: 12, marginTop: 3 },
});
