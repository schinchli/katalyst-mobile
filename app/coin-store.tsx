import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { AppConfig } from '@/config/appConfig';
import { F } from '@/constants/Typography';
import type { CoinPack } from '@/types';

export default function CoinStoreScreen() {
  const colors  = useThemeColors();
  const t       = useTypography();
  const [packs, setPacks]     = useState<CoinPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = AppConfig.web.baseUrl.replace(/\/$/, '');
    fetch(`${base}/api/coin-packs`)
      .then((r) => r.json())
      .then((body: { ok: boolean; packs?: CoinPack[] }) => {
        if (body.ok) setPacks(body.packs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = (_pack: CoinPack) => {
    const base = AppConfig.web.baseUrl.replace(/\/$/, '') || 'https://lms-amber-two.vercel.app';
    void Linking.openURL(`${base}/dashboard/store`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: t.screenTitle }]}>Coin Store</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: t.body }]}>
          Buy coins to unlock contests, courses, and more.
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : packs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>🏪</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: t.body }]}>
              No coin packs available right now. Check back soon!
            </Text>
          </View>
        ) : (
          <View style={styles.packsGrid}>
            {packs.map((pack) => (
              <View key={pack.id} style={[styles.packCard, { backgroundColor: colors.surface, borderColor: pack.popular ? colors.primary : colors.surfaceBorder }]}>
                {pack.popular ? (
                  <View style={[styles.popularBadge, { backgroundColor: '#FF9F43' }]}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                ) : null}
                <Text style={styles.packEmoji}>⚡</Text>
                <Text style={[styles.packCoins, { color: '#ffd84d', fontSize: t.screenTitle }]}>
                  {pack.coins.toLocaleString()}
                </Text>
                <Text style={[styles.packCoinsLabel, { color: colors.textSecondary, fontSize: t.caption }]}>coins</Text>
                <Text style={[styles.packLabel, { color: colors.text, fontSize: t.cardTitle }]}>{pack.label}</Text>
                <Text style={[styles.packPrice, { color: colors.textSecondary, fontSize: t.caption }]}>
                  ₹{pack.priceInr.toLocaleString()} / ${pack.priceUsd.toFixed(2)} USD
                </Text>
                <Pressable
                  onPress={() => handleBuy(pack)}
                  style={[styles.buyBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.buyBtnText, { fontSize: t.body }]}>Buy now</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:     { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:      { marginRight: 10 },
  headerTitle:  { fontFamily: F.bold, fontSize: 20, flex: 1 },
  scroll:       { paddingHorizontal: 16, paddingBottom: 36 },
  subtitle:     { fontFamily: F.regular, marginTop: 12, marginBottom: 16 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon:    { fontSize: 40 },
  emptyText:    { fontFamily: F.medium, textAlign: 'center', paddingHorizontal: 32 },
  packsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  packCard:     {
    width: '47%',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  popularBadge: { position: 'absolute', top: -10, right: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  popularText:  { color: '#fff', fontFamily: F.bold, fontSize: 10 },
  packEmoji:    { fontSize: 28 },
  packCoins:    { fontFamily: F.bold },
  packCoinsLabel: { fontFamily: F.regular },
  packLabel:    { fontFamily: F.semiBold, textAlign: 'center' },
  packPrice:    { fontFamily: F.regular, textAlign: 'center' },
  buyBtn:       { marginTop: 6, width: '100%', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buyBtnText:   { color: '#fff', fontFamily: F.bold },
});
