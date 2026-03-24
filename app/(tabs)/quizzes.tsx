import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory } from '@/types';
import { F } from '@/constants/Typography';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { AWS_CATEGORY_ICONS } from '@/constants/awsIcons';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';
import { resolveDailyQuiz } from '@/config/systemFeatures';

// Dark gradients — always vivid enough for white icons, looks great on both light + dark themes
const CARD_GRADIENTS: Array<[string, string]> = [
  ['#312E81', '#0EA5E9'],  // indigo → sky
  ['#064E3B', '#0284C7'],  // dark emerald → blue
  ['#4C1D95', '#2563EB'],  // deep violet → blue
  ['#1E3A5F', '#7C3AED'],  // dark navy → violet
];

function getCardGradient(category: string): [string, string] {
  const score = [...category].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return CARD_GRADIENTS[score % CARD_GRADIENTS.length];
}

const FILTERS: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'genai', label: 'AI' },
  { key: 'bedrock', label: 'Bedrock' },
  { key: 'security', label: 'Security' },
  { key: 'clf-c02', label: 'CLF-C02' },
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
  const platformConfig = usePlatformConfigStore((s) => s.config);
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: t.screenTitle }]}>Explore</Text>

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
          {quizzes.filter((quiz) => quiz.enabled !== false).slice(0, 4).map((quiz, index) => (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {(() => {
                const grad = getCardGradient(quiz.category);
                const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                const isDailyQuiz = dailyQuiz?.id === quiz.id;
                return (
                  <LinearGradient colors={grad} style={styles.trackVisual}>
                    <View style={[styles.trackBadge, { backgroundColor: colors.surface + '2A' }]}>
                      <Text style={[styles.trackBadgeText, { color: colors.surface }]}>{isDailyQuiz ? (dailyQuizCompleted ? 'Review' : 'Daily') : quiz.isPremium ? 'Track' : 'Start'}</Text>
                    </View>
                    {catIcon ? (
                      <View style={styles.trackIconWrap}>
                        <Image source={catIcon} style={styles.trackIcon} />
                      </View>
                    ) : (
                      <Feather name={quiz.icon as any} size={44} color={colors.surface} />
                    )}
                  </LinearGradient>
                );
              })()}
              <View style={styles.trackBody}>
                <View style={styles.trackProgressRow}>
                  <View style={[styles.trackProgressBar, { backgroundColor: colors.backgroundAlt }]}>
                    <View style={[styles.trackProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (index + 2) * 16)}%` }]} />
                  </View>
                  <Text style={[styles.trackPercent, { color: colors.text }]}>{Math.min(100, (index + 2) * 16)}%</Text>
                </View>
                <Text style={[styles.trackTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{quiz.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Available courses</Text>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>
          {visibleCourses.map((quiz) => {
            const playableQuestionCount = getPlayableQuestionCount(quiz);
            const isDailyQuiz = dailyQuiz?.id === quiz.id;
            const dailyQuizActionLabel = isDailyQuiz ? (dailyQuizCompleted ? 'Review Daily Quiz' : 'Play Daily Quiz') : null;
            return (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.courseCard, platformConfig.layout.courseCardColumns === 1 ? styles.courseCardSingleWide : null, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {(() => {
                const grad = getCardGradient(quiz.category);
                const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                return (
                  <LinearGradient colors={grad} style={styles.courseImage}>
                    {catIcon ? (
                      <View style={styles.courseIconWrap}>
                        <Image source={catIcon} style={styles.courseIcon} />
                      </View>
                    ) : (
                      <Feather name={quiz.icon as any} size={40} color={colors.surface} />
                    )}
                  </LinearGradient>
                );
              })()}
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
            </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 16 },
  screenTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  searchShell: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 14 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 11 },
  trackRow: { gap: 10, paddingRight: 16 },
  trackCard: { width: 144, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  trackVisual: { height: 100, justifyContent: 'center', alignItems: 'center' },
  trackIconWrap: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  trackIcon: { width: 44, height: 44 },
  trackBadge: { position: 'absolute', left: 8, top: 8, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  trackBadgeText: { fontFamily: F.bold, fontSize: 10 },
  trackBody: { padding: 8, gap: 6 },
  trackProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trackProgressBar: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  trackProgressFill: { height: '100%', borderRadius: 999 },
  trackPercent: { fontFamily: F.semiBold, fontSize: 10 },
  trackTitle: { fontFamily: F.bold, fontSize: 12, lineHeight: 16 },
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
  pinnedDailyEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  pinnedDailyState: { fontFamily: F.bold, fontSize: 11 },
  pinnedDailyTitle: { fontFamily: F.bold, fontSize: 15, lineHeight: 21 },
  pinnedDailySubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  courseRow: { gap: 10, paddingRight: 16 },
  courseCard: { width: 140, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  courseCardSingleWide: { width: 180 },
  courseImage: { height: 96, alignItems: 'center', justifyContent: 'center' },
  courseIconWrap: { width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  courseIcon: { width: 44, height: 44 },
  courseBody: { padding: 9, gap: 6, minHeight: 110 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  metaLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6 },
  dailyBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  dailyBadgeText: { fontFamily: F.bold, fontSize: 9, textTransform: 'uppercase' },
  courseTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
  courseSubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 17 },
  cardFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontFamily: F.medium, fontSize: 11 },
  footerDone: { fontFamily: F.bold, fontSize: 11 },
});
