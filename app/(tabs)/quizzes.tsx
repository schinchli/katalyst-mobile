import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory, Quiz } from '@/types';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';


// ─── Difficulty filters ───────────────────────────────────────────────────────
const difficulties: { key: 'all' | 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { key: 'all',          label: 'All Levels' },
  { key: 'beginner',     label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced',     label: 'Advanced' },
];

// ─── Domain filters ───────────────────────────────────────────────────────────
const categories: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',     label: 'All Domains' },
  { key: 'clf-c02', label: 'CLF-C02' },
];

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ quiz, onPress, completedIds }: { quiz: Quiz; onPress: () => void; completedIds: Set<string> }) {
  const colors    = useThemeColors();
  const completed = completedIds.has(quiz.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Start ${quiz.title} quiz`}
      style={({ pressed }) => [
        s.courseCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        pressed && s.cardPressed,
      ]}
    >
      {/* Header banner — neutral primary tint */}
      <View style={[s.cardBanner, { backgroundColor: colors.primaryLight }]}>
        {quiz.isPremium && (
          <View style={[s.proBadge, { backgroundColor: colors.aws }]}>
            <Text style={s.proBadgeText}>PRO</Text>
          </View>
        )}
        {completed && (
          <View
            style={[
              s.completedBadge,
              {
                backgroundColor: colors.success + '22',
                borderColor: colors.success + '55',
                top: quiz.isPremium ? 38 : 10,
                right: 10,
              },
            ]}
          >
            <Feather name="check-circle" size={11} color={colors.success} />
            <Text style={[s.completedBadgeText, { color: colors.success }]}>Done</Text>
          </View>
        )}
        <View style={[s.cardIconCircle, { backgroundColor: colors.primary + '28' }]}>
          <Feather name={quiz.icon as any} size={28} color={colors.primary} />
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        {/* Top content group */}
        <View style={s.cardTop}>
          <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={2}>{quiz.title}</Text>
          <Text style={[s.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>{quiz.description}</Text>
        </View>

        {/* Start button — pinned to bottom */}
        <View style={[s.startBtn, { backgroundColor: colors.primary }]}>
          <Text style={s.startBtnText}>Start →</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function QuizzesScreen() {
  const colors = useThemeColors();
  const { isDesktop, contentContainerWeb } = useWebLayout();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const progress = useProgressStore((s) => s.progress);
  const results = useProgressStore((s) => s.progress.recentResults);

  const completedIds = new Set(results.map((r) => r.quizId));
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filtered = quizzes.filter((q) => {
    const catMatch  = selectedCategory === 'all' || q.category === selectedCategory;
    const diffMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
    const searchMatch =
      normalizedSearch.length === 0 ||
      q.title.toLowerCase().includes(normalizedSearch) ||
      q.description.toLowerCase().includes(normalizedSearch);
    return catMatch && diffMatch && searchMatch;
  });

  const totalCategories = new Set(quizzes.map((q) => q.category)).size;
  const recentHistory   = progress.recentResults.slice(0, 4);

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]} edges={isDesktop ? [] : ['top']}>

      {/* ── Header ── */}
      <View style={[s.header, contentContainerWeb]}>
        <View>
          <Text style={[s.screenTitle, { color: colors.text }]}>All Courses</Text>
        </View>
        <View style={[s.headerStatsRow]}>
          <View style={[s.headerStat, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[s.headerStatVal, { color: colors.primary }]}>{quizzes.length}</Text>
            <Text style={[s.headerStatLabel, { color: colors.primary }]}>Quizzes</Text>
          </View>
          <View style={[s.headerStat, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[s.headerStatVal, { color: colors.primary }]}>{totalCategories}</Text>
            <Text style={[s.headerStatLabel, { color: colors.primary }]}>Topics</Text>
          </View>
          <View style={[s.headerStat, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[s.headerStatVal, { color: colors.primary }]}>{completedIds.size}</Text>
            <Text style={[s.headerStatLabel, { color: colors.primary }]}>Done</Text>
          </View>
        </View>
      </View>

      {/* ── Search & progress overview ── */}
      <View style={[s.overviewWrap, contentContainerWeb]}>
        <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search courses, topics, or tags"
            placeholderTextColor={colors.textSecondary}
            style={[s.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
        </View>

        <View style={s.progressRow}>
          <View style={[s.progressCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.progressLabel, { color: colors.textSecondary }]}>Completed</Text>
            <Text style={[s.progressValue, { color: colors.text }]}>{progress.completedQuizzes}</Text>
            <Text style={[s.progressSub, { color: colors.textSecondary }]}>out of {quizzes.length}</Text>
          </View>
          <View style={[s.progressCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.progressLabel, { color: colors.textSecondary }]}>Average Score</Text>
            <Text style={[s.progressValue, { color: colors.primary }]}>{progress.averageScore}%</Text>
            <Text style={[s.progressSub, { color: colors.textSecondary }]}>Keep pushing to 90%</Text>
          </View>
          <View style={[s.progressCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.progressLabel, { color: colors.textSecondary }]}>Current Streak</Text>
            <Text style={[s.progressValue, { color: colors.text }]}>{progress.currentStreak} days</Text>
            <Text style={[s.progressSub, { color: colors.textSecondary }]}>Longest {progress.longestStreak}d</Text>
          </View>
        </View>
      </View>

      {/* ── Difficulty filter pills ── */}
      <View style={s.diffRow}>
        {difficulties.map((d) => {
          const active = selectedDifficulty === d.key;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelectedDifficulty(d.key)}
              style={[
                s.diffPill,
                active
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <Text style={[s.diffPillText, { color: active ? '#fff' : colors.text }]}>{d.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Category filter pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.pillRow}
        style={s.pillScroll}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={[
                s.pill,
                active
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[s.pillText, { color: active ? '#FFFFFF' : colors.text }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Course grid ── */}
      <ScrollView
        contentContainerStyle={[s.grid, contentContainerWeb]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── History & results count ── */}
        <View style={s.resultHeaderRow}>
          <Text style={[s.resultCount, { color: colors.textSecondary }]}>
            {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} available
          </Text>
          {recentHistory.length > 0 && (
            <Text style={[s.resultCount, { color: colors.textSecondary }]}>
              Recent quizzes · {recentHistory.length}
            </Text>
          )}
        </View>

        {recentHistory.length > 0 && (
          <View style={s.historyRow}>
            {recentHistory.map((item) => {
              const quizMeta = quizzes.find((q) => q.id === item.quizId);
              const pct = Math.round((item.score / item.totalQuestions) * 100);
              return (
                <View
                  key={item.completedAt + item.quizId}
                  style={[s.historyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <View style={s.historyHeader}>
                    <Text style={[s.historyTitle, { color: colors.text }]} numberOfLines={1}>
                      {quizMeta?.title ?? 'Quiz'}
                    </Text>
                    <Text style={[s.historyScore, { color: pct >= 70 ? colors.success : colors.textSecondary }]}>
                      {pct}%
                    </Text>
                  </View>
                  <Text style={[s.historyMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {quizMeta?.category?.toUpperCase()} · {item.totalQuestions} Qs · {new Date(item.completedAt).toLocaleDateString()}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <Feather name="search" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.textSecondary }]}>No quizzes found</Text>
            <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>Try a different category filter</Text>
          </View>
        ) : (
          <View style={[s.gridRow, isDesktop && s.gridRowDesktop]}>
            {filtered.map((quiz) => (
              <View key={quiz.id} style={[s.gridCell, isDesktop && s.gridCellDesktop]}>
                <CourseCard
                  quiz={quiz}
                  onPress={() => router.push(`/quiz/${quiz.id}`)}
                  completedIds={completedIds}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1 },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitle: { fontFamily: F.bold, fontSize: 22, lineHeight: 28 },
  headerStatsRow: { flexDirection: 'row', gap: 8 },
  headerStat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    minWidth: 52,
  },
  headerStatVal:   { fontFamily: F.bold,    fontSize: 16, lineHeight: 20 },
  headerStatLabel: { fontFamily: F.regular, fontSize: 10, marginTop: 1 },

  // ── Overview ──
  overviewWrap: { paddingHorizontal: 20, gap: 14, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 14 },
  progressRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  progressCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  progressLabel: { fontFamily: F.semiBold, fontSize: 12, letterSpacing: 0.2 },
  progressValue: { fontFamily: F.bold, fontSize: 18 },
  progressSub:   { fontFamily: F.regular, fontSize: 11 },

  // ── Difficulty row ──
  diffRow:     { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, gap: 9 },
  diffPill:    { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 36, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  diffPillText:{ fontFamily: F.semiBold, fontSize: 12 },

  // ── Pills ──
  pillScroll: { flexGrow: 0 },
  pillRow:    { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  pill:       { minHeight: 34, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  pillText:   { fontFamily: F.semiBold, fontSize: 13 },

  // ── Result count ──
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, marginBottom: 6 },
  resultCount: { fontFamily: F.regular, fontSize: 12, paddingHorizontal: 20 },

  // ── History ──
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18, marginBottom: 10 },
  historyCard: { flexBasis: '48%', minWidth: 160, borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyTitle: { fontFamily: F.semiBold, fontSize: 13, flex: 1, marginRight: 8 },
  historyScore: { fontFamily: F.bold, fontSize: 13 },
  historyMeta:  { fontFamily: F.regular, fontSize: 11 },

  // ── Grid ──
  grid: { paddingHorizontal: 18, paddingBottom: 48, paddingTop: 6 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridRowDesktop: { gap: 16 },
  gridCell: { flexBasis: '48%', minWidth: 160, alignSelf: 'stretch' },
  gridCellDesktop: { flexBasis: '30%', maxWidth: '30%' as any },

  // ── Course card ──
  courseCard: {
    flex: 1,
    minHeight: 230,
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#4B465C',
    shadowOpacity: 0.11,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  cardBanner: {
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  proBadgeText: { fontFamily: F.bold, fontSize: 10, color: '#fff', letterSpacing: 0.3 },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  completedBadgeText: { fontFamily: F.semiBold, fontSize: 10 },

  cardBody: { padding: 14, flex: 1, justifyContent: 'space-between' },
  cardTop:  { gap: 7 },

  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catChipText: { fontFamily: F.semiBold, fontSize: 10 },

  cardTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    lineHeight: 22,
  },

  cardDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 19,
  },

  startBtn: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  startBtnText: { fontFamily: F.semiBold, fontSize: 12, color: '#fff' },

  // ── Empty state ──
  emptyState:    { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontFamily: F.semiBold, fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: F.regular,  fontSize: 13 },
});
