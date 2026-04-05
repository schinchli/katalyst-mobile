import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { CHALLENGE_SCORES, CPU_NAMES } from '@/data/challenges';
import { F } from '@/constants/Typography';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';
import { getResultPercent } from '@/utils/quizResults';
import type { Quiz, QuizResult } from '@/types';

type Difficulty = 'all' | 'beginner' | 'intermediate' | 'advanced';

const DIFF_FILTERS: { key: Difficulty; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'beginner',     label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced',     label: 'Advanced' },
];

// ─── Challenge card ───────────────────────────────────────────────────────────
function ChallengeCard({
  quiz,
  bestPct,
  colors,
}: {
  quiz: Quiz;
  bestPct: number | null;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const target    = CHALLENGE_SCORES[quiz.id] ?? 70;
  const cpuName   = CPU_NAMES[quiz.id] ?? 'BotAI';
  const diffColor =
    quiz.difficulty === 'beginner' ? colors.success
    : quiz.difficulty === 'intermediate' ? colors.warning
    : quiz.difficulty === 'advanced' ? colors.error
    : colors.primary;
  const beaten    = bestPct !== null && bestPct >= target;
  const playableQuestionCount = getPlayableQuestionCount(quiz);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, shadowColor: colors.text }]}>
      {/* Accent strip */}
      <View style={[styles.cardStrip, { backgroundColor: diffColor }]} />

      <View style={styles.cardBody}>
        {/* Quiz info */}
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: diffColor + '18' }]}>
            <Feather name={quiz.icon as any} size={18} color={diffColor} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.quizTitle, { color: colors.text }]}>{quiz.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.diffBadge, { backgroundColor: diffColor + '18' }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {playableQuestionCount}Q · {quiz.duration}min
              </Text>
            </View>
          </View>
          {beaten && (
            <View style={[styles.beatenBadge, { backgroundColor: colors.success + '18' }]}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.beatenText, { color: colors.success }]}>Beaten</Text>
            </View>
          )}
        </View>

        {/* CPU vs You */}
        <View style={[styles.vsRow, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
          {/* CPU */}
          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: colors.error + '18' }]}>
              <Feather name="cpu" size={16} color={colors.error} />
            </View>
            <Text style={[styles.vsName, { color: colors.textSecondary }]}>{cpuName}</Text>
            <Text style={[styles.vsScore, { color: colors.error }]}>{target}%</Text>
          </View>

          <View style={styles.vsCenter}>
            <Text style={[styles.vsLabel, { color: colors.textSecondary }]}>VS</Text>
          </View>

          {/* You */}
          <View style={styles.vsPlayer}>
            <View style={[styles.vsAvatar, { backgroundColor: colors.primaryLight }]}>
              <Feather name="user" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.vsName, { color: colors.textSecondary }]}>You</Text>
            <Text style={[styles.vsScore, { color: beaten ? colors.success : colors.primary }]}>
              {bestPct !== null ? `${bestPct}%` : '?'}
            </Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => {
            if (bestPct !== null) {
              // Pass previousBest so the quiz results screen can show comparison
              router.push(`/quiz/${quiz.id}?previousBest=${bestPct}`);
            } else {
              router.push(`/quiz/${quiz.id}`);
            }
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.challengeBtn,
            { backgroundColor: beaten ? colors.primaryLight : diffColor, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Feather name={beaten ? 'refresh-cw' : 'zap'} size={15} color={beaten ? colors.primary : colors.surface} />
          <Text style={[styles.challengeBtnText, { color: beaten ? colors.primary : colors.surface }]}>
            {beaten ? 'Beat Your Score' : 'Accept Challenge'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ChallengeScreen() {
  const colors = useThemeColors();
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  // recentResults comes from progressStore which syncs from Supabase quiz_results
  // when the user is authenticated, and falls back to local store otherwise.
  const recentResults = useProgressStore((s) => s.progress.recentResults);

  // Build best score per quiz from all available results
  const bestScores: Record<string, number> = {};
  (recentResults as QuizResult[]).forEach((r) => {
    const pct = getResultPercent(r);
    if (bestScores[r.quizId] === undefined || pct > bestScores[r.quizId]) {
      bestScores[r.quizId] = pct;
    }
  });

  const filtered = quizzes.filter(
    (q) => !q.isPremium && (difficulty === 'all' || q.difficulty === difficulty),
  );

  const beaten  = filtered.filter((q) => (bestScores[q.id] ?? 0) >= (CHALLENGE_SCORES[q.id] ?? 70));
  const pending = filtered.filter((q) => (bestScores[q.id] ?? 0) < (CHALLENGE_SCORES[q.id] ?? 70));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge Arena</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Beat the CPU to earn bonus coins</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: colors.success + '18' }]}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.scoreBadgeText, { color: colors.success }]}>{beaten.length}/{filtered.length}</Text>
        </View>
      </View>

      {/* Difficulty filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {DIFF_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setDifficulty(f.key)}
            accessibilityRole="button"
            style={[
              styles.filterBtn,
              difficulty === f.key && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.filterText, { color: difficulty === f.key ? colors.surface : colors.textSecondary }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Pending challenges */}
        {pending.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Challenges ({pending.length})
            </Text>
            {pending.map((q) => (
              <ChallengeCard key={q.id} quiz={q} bestPct={bestScores[q.id] ?? null} colors={colors} />
            ))}
          </>
        )}

        {/* Beaten challenges */}
        {beaten.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 16 }]}>
              Already Beaten ✓ ({beaten.length})
            </Text>
            {beaten.map((q) => (
              <ChallengeCard key={q.id} quiz={q} bestPct={bestScores[q.id] ?? null} colors={colors} />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No challenges found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 18 },
  headerSub:   { fontFamily: F.regular, fontSize: 12, marginTop: 1 },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreBadgeText: { fontFamily: F.bold, fontSize: 13 },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterText: { fontFamily: F.semiBold, fontSize: 12 },

  scroll: { padding: 16, paddingBottom: 48, gap: 12 },

  sectionLabel: { fontFamily: F.bold, fontSize: 16, marginBottom: 4 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardStrip: { height: 4 },
  cardBody:  { padding: 14, gap: 12 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1, gap: 4 },
  quizTitle:  { fontFamily: F.bold, fontSize: 15, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: { fontFamily: F.semiBold, fontSize: 11 },
  metaText: { fontFamily: F.regular, fontSize: 12 },

  beatenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  beatenText: { fontFamily: F.semiBold, fontSize: 11 },

  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  vsPlayer: { flex: 1, alignItems: 'center', gap: 4 },
  vsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsName:  { fontFamily: F.medium,  fontSize: 12 },
  vsScore: { fontFamily: F.bold,    fontSize: 18 },
  vsCenter: { width: 36, alignItems: 'center' },
  vsLabel: { fontFamily: F.bold,    fontSize: 14, letterSpacing: 1 },

  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  challengeBtnText: { fontFamily: F.semiBold, fontSize: 14 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: F.regular, fontSize: 14 },
});
