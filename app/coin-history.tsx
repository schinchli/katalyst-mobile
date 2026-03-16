import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { AppConfig } from '@/config/appConfig';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { F } from '@/constants/Typography';
import type { CoinTransaction } from '@/types';

const COIN_REASON_LABELS: Record<string, string> = {
  quiz_complete:       'Quiz completed',
  perfect_score:       'Perfect score bonus',
  daily_quiz:          'Daily quiz bonus',
  streak_bonus:        'Streak bonus',
  referral_reward:     'Referral reward',
  referral_signup:     'Referral signup',
  coin_purchase:       'Coin purchase',
  contest_prize:       'Contest prize',
  admin_grant:         'Admin grant',
  spend_contest_entry: 'Contest entry',
  spend_course_unlock: 'Course unlock',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

interface CoinHistoryState {
  transactions: CoinTransaction[];
  balance: number;
  note: string;
}

export default function CoinHistoryScreen() {
  const colors  = useThemeColors();
  const t       = useTypography();
  const [state, setState]   = useState<CoinHistoryState>({ transactions: [], balance: 0, note: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const base = AppConfig.web.baseUrl.replace(/\/$/, '');
      try {
        const res = await fetch(`${base}/api/coins`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json() as {
          ok: boolean;
          transactions?: CoinTransaction[];
          balance?: number;
          note?: string;
        };
        if (body.ok) {
          setState({
            transactions: body.transactions ?? [],
            balance:      body.balance ?? 0,
            note:         body.note ?? '',
          });
        }
      } catch { /* non-fatal */ }
      finally  { setLoading(false); }
    })();
  }, []);

  const renderItem = ({ item: tx }: ListRenderItemInfo<CoinTransaction>) => {
    const isEarn = tx.amount >= 0;
    return (
      <View style={[styles.row, { borderBottomColor: colors.surfaceBorder }]}>
        <View style={[styles.rowIcon, { backgroundColor: isEarn ? 'rgba(40,199,111,0.12)' : 'rgba(234,84,85,0.12)' }]}>
          <Text style={styles.rowIconText}>{isEarn ? '⚡' : '💸'}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowLabel, { color: colors.text, fontSize: t.body }]}>
            {COIN_REASON_LABELS[tx.reason] ?? tx.reason}
          </Text>
          <Text style={[styles.rowDate, { color: colors.textSecondary, fontSize: t.caption }]}>
            {formatDate(tx.createdAt)}
          </Text>
        </View>
        <Text style={[styles.rowAmount, { color: isEarn ? '#28C76F' : '#EA5455', fontSize: t.body }]}>
          {isEarn ? '+' : ''}{tx.amount.toLocaleString()} ⚡
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: t.screenTitle }]}>Coin History</Text>
        <View style={styles.headerBalance}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Balance</Text>
          <Text style={[styles.balanceValue, { color: '#ffd84d', fontSize: t.cardTitle }]}>
            {state.balance.toLocaleString()} ⚡
          </Text>
        </View>
      </View>

      {state.note ? (
        <View style={[styles.noteBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Text style={[styles.noteText, { color: colors.text, fontSize: t.caption }]}>
            ℹ️ Your coin activity will appear here — balance shown from your profile.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : state.transactions.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⚡</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: t.body }]}>
            Your coin activity will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={state.transactions}
          keyExtractor={(tx) => tx.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:       { marginRight: 10 },
  headerTitle:   { flex: 1, fontFamily: F.bold, fontSize: 20 },
  headerBalance: { alignItems: 'flex-end' },
  balanceLabel:  { fontFamily: F.regular, fontSize: 11 },
  balanceValue:  { fontFamily: F.bold, fontSize: 18 },
  noteBanner:    { margin: 12, borderWidth: 1, borderRadius: 10, padding: 12 },
  noteText:      { fontFamily: F.regular, fontSize: 13 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon:     { fontSize: 40 },
  emptyText:     { fontFamily: F.medium, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  list:          { paddingBottom: 32 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  rowIcon:       { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowIconText:   { fontSize: 18 },
  rowContent:    { flex: 1, gap: 2 },
  rowLabel:      { fontFamily: F.semiBold, fontSize: 14 },
  rowDate:       { fontFamily: F.regular, fontSize: 12 },
  rowAmount:     { fontFamily: F.bold, fontSize: 15 },
});
