import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory } from '@/types';
import { F } from '@/constants/Typography';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';
import { resolveDailyQuiz } from '@/config/systemFeatures';


const FILTERS: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'genai',   label: 'AI'      },
  { key: 'bedrock', label: 'Bedrock' },
  { key: 'security',label: 'Security'},
  { key: 'clf-c02', label: 'CLF-C02' },
  { key: 'aip-c01', label: 'AIP-C01' },
];

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function QuizzesScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const progress = useProgressStore((s) => s.progress);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QuizCategory | 'all'>('all');
  const completedIds = new Set(progress.recentResults.map((item) => item.quizId));
  const systemFeatures = useSystemFeatureStore((s) => s.config);
  const dailyQuiz = resolveDailyQuiz(systemFeatures, quizzes.filter((quiz) => quiz.enabled !== false));
  const dailyQuizCompleted = dailyQuiz
    ? progress.recentResults.some((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : false;

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (quiz.enabled === false) return false;
      const matchFilter = filter === 'all' || quiz.category === filter;
      const matchQuery = normalized.length === 0 || quiz.title.toLowerCase().includes(normalized) || quiz.description.toLowerCase().includes(normalized);
      return matchFilter && matchQuery;
    });
  }, [filter, query]);
  const dailyQuizFilteredOut = Boolean(dailyQuiz && !visibleCourses.some((quiz) => quiz.id === dailyQuiz.id));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCopy}>
          <Text style={[styles.screenTitle, { color: colors.text, fontSize: t.screenTitle }]}>Practice</Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary, fontSize: t.body }]}>
            Choose one quiz. Review calmly. Repeat when ready.
          </Text>
        </View>

        <View style={[styles.searchShell, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.filterChipText, { color: active ? colors.surface : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Available quizzes</Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>{visibleCourses.length} total</Text>
        </View>

        {dailyQuiz && dailyQuizFilteredOut ? (
          <Pressable
            onPress={() => router.push(`/quiz/${dailyQuiz.id}`)}
            style={[styles.pinnedDailyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.pinnedDailyCopy}>
              <View style={styles.pinnedDailyHeader}>
                <Text style={[styles.pinnedDailyEyebrow, { color: colors.warning }]}>{systemFeatures.dailyQuizLabel}</Text>
                <Text style={[styles.pinnedDailyState, { color: dailyQuizCompleted ? colors.success : colors.textSecondary }]}>
                  {dailyQuizCompleted ? 'Review available' : 'Pinned above filters'}
                </Text>
              </View>
              <Text style={[styles.pinnedDailyTitle, { color: colors.text }]} numberOfLines={2}>{dailyQuiz.title}</Text>
              <Text style={[styles.pinnedDailySubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                Your current search or category filter hides today&apos;s featured quiz, so it stays visible here.
              </Text>
            </View>
            <Feather name="arrow-right-circle" size={20} color={dailyQuizCompleted ? colors.success : colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.courseList}>
          {visibleCourses.map((quiz) => {
            const playableQuestionCount = getPlayableQuestionCount(quiz);
            const isDailyQuiz = dailyQuiz?.id === quiz.id;
            const dailyQuizActionLabel = isDailyQuiz ? (dailyQuizCompleted ? 'Review Daily Quiz' : 'Play Daily Quiz') : null;
            return (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={({ pressed }) => [styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.9 : 1 }]}>
              <View style={[styles.courseIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name={quiz.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.courseBody}>
                <View style={styles.metaRow}>
                  <View style={styles.metaLabelRow}>
                    <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{quiz.category.toUpperCase()}</Text>
                    {isDailyQuiz ? (
                      <View style={[styles.dailyBadge, { backgroundColor: colors.warning + '18' }]}>
                        <Text style={[styles.dailyBadgeText, { color: colors.warning }]}>{systemFeatures.dailyQuizLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                  {quiz.isPremium ? <Feather name="lock" size={14} color={colors.textSecondary} /> : null}
                </View>
                <Text style={[styles.courseTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{quiz.title}</Text>
                <Text style={[styles.courseSubtitle, { color: colors.textSecondary, fontSize: t.caption }]} numberOfLines={2}>{quiz.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    {playableQuestionCount} questions
                  </Text>
                  {dailyQuizActionLabel ? (
                    <Text style={[styles.footerDone, { color: dailyQuizCompleted ? colors.success : colors.warning }]}>{dailyQuizActionLabel}</Text>
                  ) : completedIds.has(quiz.id) ? (
                    <Text style={[styles.footerDone, { color: colors.primary }]}>Completed</Text>
                  ) : (
                    <Text style={[styles.footerDone, { color: colors.text }]}>Open</Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 58, paddingBottom: 36, gap: 16 },
  headerCopy: { gap: 6 },
  screenTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: 0 },
  screenSub: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 },
  searchShell: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 14 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 11 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17 },
  sectionMeta: { fontFamily: F.medium, fontSize: 12 },
  pinnedDailyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinnedDailyCopy: { flex: 1, gap: 4 },
  pinnedDailyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  pinnedDailyEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0 },
  pinnedDailyState: { fontFamily: F.bold, fontSize: 11 },
  pinnedDailyTitle: { fontFamily: F.bold, fontSize: 15, lineHeight: 21 },
  pinnedDailySubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  courseList: { gap: 10 },
  courseCard: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  courseIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  courseBody: { flex: 1, gap: 5 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0 },
  dailyBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  dailyBadgeText: { fontFamily: F.bold, fontSize: 9, textTransform: 'uppercase' },
  courseTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
  courseSubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 17 },
  cardFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontFamily: F.medium, fontSize: 11 },
  footerDone: { fontFamily: F.bold, fontSize: 11 },
});
