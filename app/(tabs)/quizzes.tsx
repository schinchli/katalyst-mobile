import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory, Quiz } from '@/types';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

// ─── Difficulty ──────────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  beginner:     '#28C76F',
  intermediate: '#FF9F43',
  advanced:     '#EA5455',
};
const DIFF_STAR: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

// ─── Category filters ─────────────────────────────────────────────────────────
const categories: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'bedrock',       label: 'Bedrock' },
  { key: 'rag',           label: 'RAG' },
  { key: 'agents',        label: 'Agents' },
  { key: 'guardrails',    label: 'Guardrails' },
  { key: 'prompt-eng',    label: 'Prompting' },
  { key: 'routing',       label: 'Routing' },
  { key: 'security',      label: 'Security' },
  { key: 'monitoring',    label: 'Monitoring' },
  { key: 'orchestration', label: 'Orchestration' },
  { key: 'evaluation',    label: 'Evaluation' },
  { key: 'mlops',         label: 'MLOps' },
];

// ─── Course Card (Vuexy "Top Course" style) ───────────────────────────────────
function CourseCard({ quiz, onPress, completedIds }: { quiz: Quiz; onPress: () => void; completedIds: Set<string> }) {
  const colors    = useThemeColors();
  const accent    = DIFF_COLOR[quiz.difficulty] ?? colors.primary;
  const stars     = DIFF_STAR[quiz.difficulty] ?? 1;
  const completed = completedIds.has(quiz.id);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Start ${quiz.title} quiz`}
      style={({ pressed }) => [
        s.courseCard,
        { backgroundColor: colors.surface },
        pressed && s.cardPressed,
      ]}
    >
      {/* Coloured header banner */}
      <View style={[s.cardBanner, { backgroundColor: accent + '18' }]}>
        {/* Premium badge */}
        {quiz.isPremium && (
          <View style={[s.proBadge, { backgroundColor: colors.aws }]}>
            <Text style={s.proBadgeText}>PRO</Text>
          </View>
        )}
        {/* Completed badge */}
        {completed && (
          <View style={[s.completedBadge, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}>
            <Feather name="check-circle" size={11} color={colors.success} />
            <Text style={[s.completedBadgeText, { color: colors.success }]}>Done</Text>
          </View>
        )}
        {/* Icon */}
        <View style={[s.cardIconCircle, { backgroundColor: accent + '28' }]}>
          <Feather name={quiz.icon as any} size={30} color={accent} />
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        {/* Category chip */}
        <View style={[s.catChip, { backgroundColor: accent + '14' }]}>
          <Text style={[s.catChipText, { color: accent }]}>
            {quiz.category.charAt(0).toUpperCase() + quiz.category.slice(1).replace('-', ' ')}
          </Text>
        </View>

        {/* Title */}
        <Text style={[s.cardTitle, { color: colors.text }]} numberOfLines={2}>{quiz.title}</Text>

        {/* Description */}
        <Text style={[s.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{quiz.description}</Text>

        {/* Difficulty stars */}
        <View style={s.starsRow}>
          {[1, 2, 3].map((n) => (
            <Feather key={n} name="star" size={12} color={n <= stars ? accent : colors.surfaceBorder} />
          ))}
          <Text style={[s.diffLabel, { color: accent }]}>
            {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
          </Text>
        </View>

        {/* Divider */}
        <View style={[s.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Footer */}
        <View style={s.cardFooter}>
          <View style={s.footerMeta}>
            <Feather name="help-circle" size={12} color={colors.textSecondary} />
            <Text style={[s.footerMetaText, { color: colors.textSecondary }]}>{quiz.questionCount}q</Text>
            <Feather name="clock" size={12} color={colors.textSecondary} style={{ marginLeft: 6 }} />
            <Text style={[s.footerMetaText, { color: colors.textSecondary }]}>{quiz.duration}m</Text>
          </View>
          <View style={[s.startChip, { backgroundColor: colors.primary }]}>
            <Text style={s.startChipText}>Start</Text>
            <Feather name="arrow-right" size={11} color="#fff" />
          </View>
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
  const results = useProgressStore((s) => s.progress.recentResults);

  const completedIds = new Set(results.map((r) => r.quizId));

  const filtered =
    selectedCategory === 'all'
      ? quizzes
      : quizzes.filter((q) => q.category === selectedCategory);

  const totalCategories = new Set(quizzes.map((q) => q.category)).size;

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]} edges={isDesktop ? [] : ['top']}>

      {/* ── Header ── */}
      <View style={[s.header, contentContainerWeb]}>
        <View>
          <Text style={[s.screenTitle, { color: colors.text }]}>All Courses</Text>
          <Text style={[s.screenSubtitle, { color: colors.textSecondary }]}>
            AWS GenAI Professional Prep
          </Text>
        </View>
        <View style={[s.headerStatsRow]}>
          <View style={[s.headerStat, { backgroundColor: colors.primaryLight }]}>
            <Text style={[s.headerStatVal, { color: colors.primaryText }]}>{quizzes.length}</Text>
            <Text style={[s.headerStatLabel, { color: colors.primaryText }]}>Quizzes</Text>
          </View>
          <View style={[s.headerStat, { backgroundColor: colors.success + '18' }]}>
            <Text style={[s.headerStatVal, { color: colors.success }]}>{totalCategories}</Text>
            <Text style={[s.headerStatLabel, { color: colors.success }]}>Topics</Text>
          </View>
          <View style={[s.headerStat, { backgroundColor: colors.warning + '18' }]}>
            <Text style={[s.headerStatVal, { color: colors.warning }]}>{completedIds.size}</Text>
            <Text style={[s.headerStatLabel, { color: colors.warning }]}>Done</Text>
          </View>
        </View>
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
              <Text style={[s.pillText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Results count ── */}
      <Text style={[s.resultCount, { color: colors.textSecondary }]}>
        {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} available
      </Text>

      {/* ── Course grid ── */}
      <ScrollView
        contentContainerStyle={[s.grid, contentContainerWeb]}
        showsVerticalScrollIndicator={false}
      >
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
    paddingTop: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  screenTitle:    { fontFamily: F.bold,    fontSize: 22, lineHeight: 28 },
  screenSubtitle: { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  headerStatsRow: { flexDirection: 'row', gap: 6 },
  headerStat: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 48,
  },
  headerStatVal:   { fontFamily: F.bold,    fontSize: 16, lineHeight: 20 },
  headerStatLabel: { fontFamily: F.regular, fontSize: 10, marginTop: 1 },

  // ── Pills ──
  pillScroll: { flexGrow: 0 },
  pillRow:    { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  pill:       { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText:   { fontFamily: F.semiBold, fontSize: 13 },

  // ── Result count ──
  resultCount: {
    fontFamily: F.regular,
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  // ── Grid ──
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridRowDesktop: { gap: 16 },
  gridCell: { width: '47.5%' },
  gridCellDesktop: { width: '30%' },

  // ── Course card ──
  courseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4B465C',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 0,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  cardBanner: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
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
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  completedBadgeText: { fontFamily: F.semiBold, fontSize: 10 },

  cardBody: { padding: 12 },

  catChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  catChipText: { fontFamily: F.semiBold, fontSize: 10 },

  cardTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  cardDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },

  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  diffLabel: { fontFamily: F.semiBold, fontSize: 10, marginLeft: 4 },

  divider: { height: 1, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  footerMetaText: { fontFamily: F.regular, fontSize: 11 },
  startChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  startChipText: { fontFamily: F.semiBold, fontSize: 11, color: '#fff' },

  // ── Empty state ──
  emptyState:    { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:    { fontFamily: F.semiBold, fontSize: 16, marginBottom: 6 },
  emptySubtitle: { fontFamily: F.regular,  fontSize: 13 },
});
