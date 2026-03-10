import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useLeaderboard, type Period } from '@/hooks/useLeaderboard';
import { F } from '@/constants/Typography';
import type { LeaderboardEntry } from '@/types';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily',   label: 'Today' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'alltime', label: 'All Time' },
];

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

// ─── Top-3 podium card ────────────────────────────────────────────────────────
function PodiumCard({ entry, colors }: { entry: LeaderboardEntry; colors: ReturnType<typeof useThemeColors> }) {
  const medalColor = MEDAL_COLORS[entry.rank - 1];
  const heights    = [110, 90, 80];
  const h          = heights[entry.rank - 1] ?? 80;

  return (
    <View style={styles.podiumItem}>
      {/* Avatar */}
      <View style={[styles.podiumAvatar, { backgroundColor: medalColor + '22', borderColor: medalColor }]}>
        <Text style={[styles.podiumAvatarText, { color: medalColor }]}>{entry.avatarInitial}</Text>
      </View>
      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>{entry.name}</Text>
      <Text style={[styles.podiumScore, { color: colors.primary }]}>{entry.score.toLocaleString()}</Text>
      {/* Podium block */}
      <View style={[styles.podiumBlock, { height: h, backgroundColor: medalColor + '22', borderColor: medalColor }]}>
        <Feather name="award" size={20} color={medalColor} />
        <Text style={[styles.podiumRank, { color: medalColor }]}>#{entry.rank}</Text>
      </View>
    </View>
  );
}

// ─── Normal rank row ──────────────────────────────────────────────────────────
function RankRow({ entry, colors }: { entry: LeaderboardEntry; colors: ReturnType<typeof useThemeColors> }) {
  const isHighlighted = !!entry.isCurrentUser;
  return (
    <View style={[
      styles.rankRow,
      { backgroundColor: isHighlighted ? colors.primaryLight : colors.surface, borderColor: isHighlighted ? colors.primary : colors.surfaceBorder },
    ]}>
      <Text style={[styles.rankNum, { color: isHighlighted ? colors.primary : colors.textSecondary }]}>
        #{entry.rank}
      </Text>
      <View style={[styles.rankAvatar, { backgroundColor: isHighlighted ? colors.primary : colors.primaryLight }]}>
        <Text style={[styles.rankAvatarText, { color: isHighlighted ? '#fff' : colors.primary }]}>
          {entry.avatarInitial}
        </Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={[styles.rankName, { color: colors.text }]} numberOfLines={1}>
          {entry.name}{isHighlighted ? ' (You)' : ''}
        </Text>
        <Text style={[styles.rankSub, { color: colors.textSecondary }]}>
          {entry.quizzesCompleted} quizzes · {entry.streak}🔥
        </Text>
      </View>
      <View style={styles.rankScoreWrap}>
        <Text style={[styles.rankScore, { color: isHighlighted ? colors.primary : colors.text }]}>
          {entry.score.toLocaleString()}
        </Text>
        <View style={styles.coinRow}>
          <Feather name="zap" size={11} color="#FF9F43" />
          <Text style={[styles.rankCoins, { color: colors.textSecondary }]}>
            {entry.coins.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const colors   = useThemeColors();
  const [period, setPeriod] = useState<Period>('alltime');

  const { data, isLoading } = useLeaderboard(period);
  const entries = data?.entries ?? [];
  const display = entries.slice(0, 12);
  const top3    = display.slice(0, 3);
  const rest    = display.slice(3);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
        <View style={[styles.liveBadge, { backgroundColor: '#EA545518' }]}>
          <View style={styles.liveDot} />
          <Text style={[styles.liveBadgeText, { color: '#EA5455' }]}>LIVE</Text>
        </View>
      </View>

      {/* Period tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setPeriod(p.key)}
            accessibilityRole="button"
            style={[styles.tab, period === p.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: period === p.key ? colors.primary : colors.textSecondary }]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Podium — top 3 */}
          <View style={styles.podium}>
            {/* 2nd place left, 1st center, 3rd right */}
            {top3[1] && <PodiumCard entry={top3[1]} colors={colors} />}
            {top3[0] && <PodiumCard entry={top3[0]} colors={colors} />}
            {top3[2] && <PodiumCard entry={top3[2]} colors={colors} />}
          </View>

          {/* Rank list (4–12) */}
          <View style={styles.rankList}>
            {rest.map((entry) => (
              <RankRow key={entry.userId} entry={entry} colors={colors} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create<Record<string, ViewStyle & TextStyle>>({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: F.bold, fontSize: 18, flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA5455',
  },
  liveBadgeText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.5 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontFamily: F.semiBold, fontSize: 14 },

  scroll:       { paddingBottom: 48 },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumAvatarText: { fontFamily: F.bold, fontSize: 20 },
  podiumName: { fontFamily: F.semiBold, fontSize: 12, textAlign: 'center' },
  podiumScore: { fontFamily: F.bold, fontSize: 13 },
  podiumBlock: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  podiumRank: { fontFamily: F.bold, fontSize: 14 },

  // Rank list
  rankList: { paddingHorizontal: 16, gap: 8, marginTop: 8 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  rankNum: { fontFamily: F.bold, fontSize: 13, width: 28, textAlign: 'center' },
  rankAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankAvatarText: { fontFamily: F.bold, fontSize: 15 },
  rankInfo: { flex: 1, gap: 2 },
  rankName: { fontFamily: F.semiBold, fontSize: 14 },
  rankSub:  { fontFamily: F.regular,  fontSize: 11 },
  rankScoreWrap: { alignItems: 'flex-end', gap: 2 },
  rankScore: { fontFamily: F.bold, fontSize: 14 },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rankCoins: { fontFamily: F.regular, fontSize: 11 },
  medalWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
