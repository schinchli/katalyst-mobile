import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useLeaderboard, type Period } from '@/hooks/useLeaderboard';
import { useProgressStore } from '@/stores/progressStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { F } from '@/constants/Typography';
import type { LeaderboardEntry } from '@/types';
import { quizzes } from '@/data/quizzes';
import { resolveDailyQuiz } from '@/config/systemFeatures';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily',   label: 'Today' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'alltime', label: 'All Time' },
];

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

// ─── Top-3 podium card ────────────────────────────────────────────────────────
function PodiumCard({ entry, colors }: { entry: LeaderboardEntry; colors: ReturnType<typeof useThemeColors> }) {
  const medalPalette = [colors.warning, colors.textMuted, colors.error];
  const medalColor = medalPalette[entry.rank - 1] ?? colors.warning;
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
        <Text style={[styles.rankAvatarText, { color: isHighlighted ? colors.surface : colors.primary }]}>
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
          <Feather name="zap" size={11} color={colors.warning} />
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
  const recentResults = useProgressStore((s) => s.progress.recentResults);
  const systemFeatures = useSystemFeatureStore((s) => s.config);

  const { data, isLoading } = useLeaderboard(period);
  const entries = data?.entries ?? [];
  const display = entries.slice(0, 12);
  const top3    = display.slice(0, 3);
  const rest    = display.slice(3);
  const dailyQuiz = resolveDailyQuiz(systemFeatures, quizzes.filter((quiz) => quiz.enabled !== false));
  const dailyQuizResult = dailyQuiz
    ? recentResults.find((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
        <View style={[styles.liveBadge, { backgroundColor: colors.error + '18' }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.liveBadgeText, { color: colors.error }]}>LIVE</Text>
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
          {dailyQuiz ? (
            <View style={[styles.dailyQuizBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View>
                <Text style={[styles.dailyQuizEyebrow, { color: colors.primary }]}>{systemFeatures.dailyQuizLabel}</Text>
                <Text style={[styles.dailyQuizTitle, { color: colors.text }]}>{dailyQuiz.title}</Text>
              </View>
              <View style={styles.dailyQuizActions}>
                <View style={[styles.dailyQuizPill, { backgroundColor: dailyQuizResult ? colors.success + '18' : colors.warning + '18' }]}>
                  <Text style={[styles.dailyQuizPillText, { color: dailyQuizResult ? colors.success : colors.warning }]}>
                    {dailyQuizResult ? `${Math.round((dailyQuizResult.score / Math.max(1, dailyQuizResult.totalQuestions)) * 100)}%` : 'Open today'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push(`/quiz/${dailyQuiz.id}`)}
                  style={[styles.dailyQuizCta, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.dailyQuizCtaText, { color: colors.surface }]}>{dailyQuizResult ? 'Review' : 'Play'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

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
  dailyQuizBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dailyQuizActions: { alignItems: 'flex-end', gap: 8 },
  dailyQuizEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  dailyQuizTitle: { fontFamily: F.semiBold, fontSize: 15, marginTop: 4 },
  dailyQuizPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  dailyQuizPillText: { fontFamily: F.bold, fontSize: 11 },
  dailyQuizCta: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dailyQuizCtaText: { fontFamily: F.bold, fontSize: 11 },

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
