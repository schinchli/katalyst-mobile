import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore, calculateLevel, LEVEL_NAMES } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { flashcards } from '@/data/flashcards';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { resolveDailyQuiz } from '@/config/systemFeatures';
import { AWS_SERVICE_ICONS, AWS_SERVICE_ACCENT, AWS_CATEGORY_ICONS } from '@/constants/awsIcons';
import { useLearningPathStore } from '@/stores/learningPathStore';
import { LEARNING_PATHS } from '@/data/learningPaths';
import { getPersonalisedFeed, getGapSummary, type Recommendation } from '@/utils/recommendations';
import { useEffect, useState } from 'react';
import { fetchArticles, articleWebUrl, type ArticleSummary } from '@/services/articlesService';

function getCategoryVisual(category: string, colors: ReturnType<typeof useThemeColors>) {
  const labels: Record<string, string> = {
    'clf-c02': 'CLF-C02',
    bedrock: 'Bedrock',
    genai: 'GenAI',
    security: 'Security',
    mlops: 'MLOps',
    compute: 'Compute',
    networking: 'Network',
    databases: 'Database',
    'cost-optimization': 'Cost',
  };
  const tones: Array<[string, string]> = [
    [colors.gradientFrom, colors.gradientTo],
    [colors.primary, colors.gradientAccent],
    [colors.warning, colors.primary],
    [colors.success, colors.gradientTo],
    [colors.error, colors.gradientAccent],
    [colors.gradientAccent, colors.primary],
  ];
  const score = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [from, to] = tones[score % tones.length];
  return {
    from,
    to,
    label: labels[category] ?? category.toUpperCase().slice(0, 5),
  };
}

function StatPill({ icon, value, colors }: { icon: keyof typeof Feather.glyphMap; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statPillText, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ── Articles Carousel ─────────────────────────────────────────────────────────

const PROVIDER_ACCENT: Record<string, string> = {
  AWS: '#FF9900', GCP: '#4285F4', Azure: '#0078D4',
  Oracle: '#F80000', Databricks: '#FF3621', Snowflake: '#29B5E8',
  'Data & AI': '#7C3AED', General: '#6B7280',
};

function ArticlesCarouselWidget({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const t = useTypography();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    fetchArticles({ limit: 5 }).then(setArticles);
  }, []);

  if (articles.length === 0) return null;

  return (
    <View style={carousel.wrapper}>
      <View style={carousel.headerRow}>
        <Text style={[carousel.title, { color: colors.text }]}>Latest Reads</Text>
        <Pressable onPress={() => router.push('/(tabs)/learn')}>
          <Text style={[carousel.seeAll, { color: colors.primary }]}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={carousel.scroll}>
        {articles.map((a) => {
          const accent = PROVIDER_ACCENT[a.provider] ?? colors.primary;
          return (
            <Pressable
              key={a._id}
              onPress={() => Linking.openURL(articleWebUrl(a.slug))}
              style={({ pressed }) => [carousel.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[carousel.badge, { backgroundColor: accent + '22' }]}>
                <Text style={[carousel.badgeText, { color: accent }]}>{a.provider}</Text>
              </View>
              <Text style={[carousel.cardTitle, { color: colors.text }]} numberOfLines={2}>{a.title}</Text>
              <Text style={[carousel.cardMeta, { color: colors.textSecondary }]}>{a.organisation}{a.readTime ? ` • ${a.readTime}` : ''}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const carousel = StyleSheet.create({
  wrapper:    { gap: 10 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0 },
  title:      { fontFamily: F.bold, fontSize: 16 },
  seeAll:     { fontFamily: F.semiBold, fontSize: 13 },
  scroll:     { gap: 10, paddingRight: 4 },
  card:       { width: 200, borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  badge:      { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText:  { fontFamily: F.bold, fontSize: 10 },
  cardTitle:  { fontFamily: F.bold, fontSize: 13, lineHeight: 18 },
  cardMeta:   { fontFamily: F.medium, fontSize: 11 },
});

// ── Personalised Feed ─────────────────────────────────────────────────────────

function PersonalisedFeedWidget({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const recentResults = useProgressStore((s) => s.progress.recentResults);
  const { activePathId, completedStepIds } = useLearningPathStore();

  // Find the next uncompleted quiz step in the active path
  const nextPathQuizId = (() => {
    if (!activePathId) return undefined;
    const path = LEARNING_PATHS.find((p) => p.id === activePathId);
    if (!path) return undefined;
    const completedQuizIds = new Set(recentResults.map((r) => r.quizId));
    const nextStep = path.steps.find((s) => {
      if (s.type === 'quiz') return !completedQuizIds.has(s.resourceId);
      return !completedStepIds.includes(s.id);
    });
    return nextStep?.type === 'quiz' ? nextStep.resourceId : undefined;
  })();

  const feed = getPersonalisedFeed(recentResults, 4, nextPathQuizId);
  const gap = getGapSummary(recentResults);

  if (feed.length === 0) return null;

  const priorityColor = (p: Recommendation['priority']) => {
    if (p === 'weak')    return colors.error;
    if (p === 'new')     return colors.primary;
    if (p === 'review')  return '#FF9F43';
    return colors.success;
  };

  const priorityLabel = (p: Recommendation['priority']) => {
    if (p === 'weak')   return 'Needs work';
    if (p === 'new')    return 'New topic';
    if (p === 'review') return 'Review due';
    return 'Level up';
  };

  return (
    <View style={pfStyles.section}>
      <View style={pfStyles.header}>
        <View>
          <Text style={[pfStyles.title, { color: colors.text }]}>For You</Text>
          {gap.topGap ? (
            <Text style={[pfStyles.sub, { color: colors.textSecondary }]}>
              Focus on <Text style={{ color: colors.error }}>{gap.topGap}</Text> · {gap.overallScore}% avg across all topics
            </Text>
          ) : (
            <Text style={[pfStyles.sub, { color: colors.textSecondary }]}>
              Based on your {recentResults.length} quiz sessions
            </Text>
          )}
        </View>
        <Pressable onPress={() => router.push('/(tabs)/learn')} hitSlop={8}>
          <Text style={[pfStyles.seeAll, { color: colors.primary }]}>See All</Text>
        </Pressable>
      </View>

      {feed.map((rec) => (
        <Pressable
          key={rec.id}
          onPress={() => {
            if (rec.type === 'video' && rec.youtubeId) {
              Linking.openURL(`https://youtu.be/${rec.youtubeId}`);
            } else if (rec.type === 'quiz' && rec.quizId) {
              router.push(`/quiz/${rec.quizId}` as never);
            } else if (rec.type === 'flashcard' && rec.flashcardCategory) {
              router.push({ pathname: '/flashcards', params: { category: rec.flashcardCategory } } as never);
            }
          }}
          style={({ pressed }) => [
            pfStyles.card,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[pfStyles.typeIcon, { backgroundColor: priorityColor(rec.priority) + '18' }]}>
            <Feather
              name={rec.type === 'video' ? 'play-circle' : rec.type === 'quiz' ? 'edit-3' : 'layers'}
              size={16}
              color={priorityColor(rec.priority)}
            />
          </View>
          <View style={pfStyles.cardBody}>
            <View style={pfStyles.cardTop}>
              <Text style={[pfStyles.cardTitle, { color: colors.text }]} numberOfLines={1}>{rec.title}</Text>
              <View style={[pfStyles.badge, { backgroundColor: priorityColor(rec.priority) + '18' }]}>
                <Text style={[pfStyles.badgeText, { color: priorityColor(rec.priority) }]}>{priorityLabel(rec.priority)}</Text>
              </View>
            </View>
            <Text style={[pfStyles.reason, { color: colors.textSecondary }]} numberOfLines={2}>{rec.reason}</Text>
          </View>
          <Feather name="chevron-right" size={14} color={colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
}

const pfStyles = StyleSheet.create({
  section: { gap: 10 },
  header:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:   { fontFamily: F.bold, fontSize: 16 },
  sub:     { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  seeAll:  { fontFamily: F.semiBold, fontSize: 13 },
  card:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  typeIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody:{ flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle:{ fontFamily: F.semiBold, fontSize: 13, flex: 1 },
  badge:   { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:{ fontFamily: F.bold, fontSize: 10 },
  reason:  { fontFamily: F.regular, fontSize: 12, lineHeight: 17 },
});

function LearningPathWidget({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  const { activePathId, completedStepIds, setShowSelector } = useLearningPathStore();
  const recentResults = useProgressStore((s) => s.progress.recentResults);

  const path = LEARNING_PATHS.find((p) => p.id === activePathId);

  if (!path) {
    // Prompt user to pick a track
    return (
      <Pressable
        onPress={() => router.push('/learning-path' as any)}
        style={({ pressed }) => [lpStyles.pickCard, { backgroundColor: colors.surface, borderColor: colors.primary + '44', opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[lpStyles.pickIcon, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="map" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[lpStyles.pickTitle, { color: colors.text }]}>Choose a Learning Track</Text>
          <Text style={[lpStyles.pickSub, { color: colors.textSecondary }]}>CLF-C02 · AIP-C01 · GenAI — step-by-step guidance</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.primary} />
      </Pressable>
    );
  }

  const isQuizPassed = (quizId: string) => recentResults.some((r) => r.quizId === quizId && r.score > 0);
  const isStepDone = (step: typeof path.steps[0]) =>
    step.type === 'quiz' ? isQuizPassed(step.resourceId) : completedStepIds.includes(step.id);

  const completedCount = path.steps.filter(isStepDone).length;
  const pct = Math.round((completedCount / path.steps.length) * 100);
  const nextStep = path.steps.find((s) => !isStepDone(s));

  return (
    <Pressable
      onPress={() => router.push('/learning-path' as any)}
      style={({ pressed }) => [lpStyles.widget, { backgroundColor: colors.surface, borderColor: path.color + '55', opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={lpStyles.widgetTop}>
        <View style={[lpStyles.certBadge, { backgroundColor: path.color + '18' }]}>
          <Text style={[lpStyles.certCode, { color: path.color }]}>{path.certCode}</Text>
        </View>
        <Text style={[lpStyles.widgetTitle, { color: colors.text }]}>{path.certName}</Text>
        <Text style={[lpStyles.widgetPct, { color: path.color }]}>{pct}%</Text>
      </View>

      <View style={[lpStyles.bar, { backgroundColor: colors.backgroundAlt }]}>
        <View style={[lpStyles.barFill, { width: `${pct}%` as any, backgroundColor: path.color }]} />
      </View>

      {nextStep ? (
        <View style={lpStyles.nextRow}>
          <Feather name="arrow-right-circle" size={14} color={path.color} />
          <Text style={[lpStyles.nextText, { color: colors.textSecondary }]} numberOfLines={1}>
            Next: <Text style={{ color: colors.text }}>{nextStep.title}</Text>
          </Text>
        </View>
      ) : (
        <View style={lpStyles.nextRow}>
          <Feather name="award" size={14} color={colors.success} />
          <Text style={[lpStyles.nextText, { color: colors.success }]}>All steps complete!</Text>
        </View>
      )}
    </Pressable>
  );
}

const lpStyles = StyleSheet.create({
  pickCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, padding: 14, borderStyle: 'dashed' },
  pickIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pickTitle: { fontFamily: F.semiBold, fontSize: 14 },
  pickSub:   { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  widget:    { borderWidth: 1.5, borderRadius: 16, padding: 14, gap: 10 },
  widgetTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  certBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  certCode:  { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.5 },
  widgetTitle: { fontFamily: F.semiBold, fontSize: 14, flex: 1 },
  widgetPct: { fontFamily: F.bold, fontSize: 14 },
  bar:       { height: 6, borderRadius: 999, overflow: 'hidden' },
  barFill:   { height: 6, borderRadius: 999 },
  nextRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextText:  { fontFamily: F.regular, fontSize: 12, flex: 1 },
});

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const user = useAuthStore((s) => s.user);
  const step = useAuthStore((s) => s.step);
  const progress = useProgressStore((s) => s.progress);
  const firstName = step === 'guest' ? 'Guest' : (user?.name?.split(' ')[0] ?? 'Learner');
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const systemFeatures = useSystemFeatureStore((s) => s.config);
  const visibleQuizzes = quizzes.filter((quiz) => quiz.enabled !== false);
  const nextQuizzes = visibleQuizzes.slice(0, 3);
  const streak = progress.currentStreak;
  const xp = progress.xp ?? 0;
  const level = calculateLevel(xp);
  const levelName = LEVEL_NAMES[level - 1] ?? 'Novice';
  const dailyQuiz = resolveDailyQuiz(systemFeatures, visibleQuizzes);
  const dailyQuizCompleted = dailyQuiz
    ? progress.recentResults.some((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : false;
  const actionCards = [
    { icon: 'activity', title: 'Practice', route: '/(tabs)/quizzes' as const, tone: colors.warning },
    { icon: 'layers', title: 'Flashcards', route: '/flashcards' as const, tone: colors.gradientAccent },
    { icon: 'book-open', title: 'Learn', route: '/(tabs)/learn' as const, tone: colors.primary },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <Text style={[styles.heroEyebrow, { color: colors.primary, fontSize: t.micro }]}>
            {EXPERIENCE_COPY.home.heroEyebrow}
          </Text>
          <Text style={[styles.heroTitle, { color: colors.text, fontSize: t.screenTitle }]}>
            Hi {firstName}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary, fontSize: t.body }]}>
            Pick up one focused cloud certification task and keep moving.
          </Text>
        </View>

        {platformConfig.widgets.showHomeStats ? (
          <View style={styles.topStats}>
            <StatPill icon="zap" value={`${xp} XP · Lv.${level} ${levelName}`} colors={colors} />
            <StatPill icon="calendar" value={streak > 0 ? `${streak} day streak` : 'Start streak'} colors={colors} />
          </View>
        ) : null}

        {dailyQuiz ? (
          <Pressable onPress={() => router.push(`/quiz/${dailyQuiz.id}`)} style={[styles.dailyQuizCard, { backgroundColor: colors.surface, borderColor: colors.primary + '55' }]}>
            <View style={styles.dailyQuizCopy}>
              <View style={styles.dailyQuizHeaderRow}>
                <Text style={[styles.dailyQuizEyebrow, { color: colors.primary }]}>Start here</Text>
                <View style={[styles.dailyQuizStatus, { backgroundColor: dailyQuizCompleted ? colors.success + '18' : colors.warning + '18' }]}>
                  <Text style={[styles.dailyQuizStatusText, { color: dailyQuizCompleted ? colors.success : colors.warning }]}>
                    {dailyQuizCompleted ? 'Completed' : 'Ready'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dailyQuizTitle, { color: colors.text }]}>{systemFeatures.dailyQuizLabel}: {dailyQuiz.title}</Text>
              <Text style={[styles.dailyQuizSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {dailyQuizCompleted ? 'Today\'s daily quiz is complete. Open it again to review or improve your score.' : dailyQuiz.description}
              </Text>
            </View>
            <Feather name={dailyQuizCompleted ? 'check-circle' : 'arrow-right-circle'} size={22} color={dailyQuizCompleted ? colors.success : colors.primary} />
          </Pressable>
        ) : null}

        <LearningPathWidget colors={colors} />

        {platformConfig.widgets.showHomeActions ? (
          <View style={styles.actionRow}>
            {actionCards.map((item) => (
              <Pressable key={item.title} onPress={() => router.push(item.route as any)} style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={[styles.actionIcon, { backgroundColor: item.tone + '18' }]}>
                  <Feather name={item.icon as any} size={16} color={item.tone} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text, fontSize: t.caption }]} numberOfLines={1}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {platformConfig.widgets.showPopularCourses ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Next quizzes</Text>
              <Pressable onPress={() => router.push('/(tabs)/quizzes')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>{'See All →'}</Text>
              </Pressable>
            </View>

            <View style={styles.quizList}>
              {nextQuizzes.map((quiz, index) => (
                <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.quizRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  {(() => {
                    const cv = getCategoryVisual(quiz.category, colors);
                    const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                    return (
                      <LinearGradient colors={[cv.from, cv.to]} style={styles.quizVisual}>
                        {catIcon ? (
                          <Image source={catIcon} style={styles.quizVisualIcon} />
                        ) : (
                          <Feather name="book" size={22} color={colors.surface} />
                        )}
                      </LinearGradient>
                    );
                  })()}
                  <View style={styles.quizBody}>
                    <Text style={[styles.quizTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={1}>{quiz.title}</Text>
                    <Text style={[styles.quizMeta, { color: colors.textSecondary, fontSize: t.caption }]} numberOfLines={1}>
                      {quiz.questionCount} questions · {quiz.duration} min
                    </Text>
                  </View>
                  <Feather name={index === 0 ? 'play-circle' : 'chevron-right'} size={18} color={index === 0 ? colors.primary : colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36, gap: 12 },
  homeHeader: { gap: 4 },
  topStats: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  statPill: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statPillText: { fontFamily: F.bold, fontSize: 14 },
  heroCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 10 },
  heroEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0 },
  heroTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: 0 },
  heroSubtitle: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 },
  heroStreakMessage: { fontFamily: F.medium, fontSize: 12, lineHeight: 18, marginTop: -2 },
  dailyQuizCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dailyQuizCopy: { flex: 1, gap: 4 },
  dailyQuizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dailyQuizEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0 },
  dailyQuizStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  dailyQuizStatusText: { fontFamily: F.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0 },
  dailyQuizTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 24 },
  dailyQuizSubtitle: { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionStack: { gap: 12 },
  actionCard: { width: '48%', borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 130, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionChip: { flex: 1, minHeight: 74, borderWidth: 1, borderRadius: 14, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: F.bold, fontSize: 15 },
  actionSubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17 },
  sectionLink: { fontFamily: F.semiBold, fontSize: 14 },
  horizontalRow: { gap: 12, paddingRight: 16 },
  courseCard: { width: 148, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  courseVisual: { height: 96, alignItems: 'center', justifyContent: 'center', gap: 4 },
  courseVisualIcon: { width: 30, height: 30 },
  courseVisualLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0, textTransform: 'uppercase' },
  courseBody: { padding: 10, gap: 8 },
  courseProgressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  courseProgressFill: { height: '100%', borderRadius: 999 },
  courseTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
  quizList: { gap: 10 },
  quizRow: { borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizVisual: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quizVisualIcon: { width: 24, height: 24 },
  quizBody: { flex: 1, gap: 3 },
  quizTitle: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  quizMeta: { fontFamily: F.regular, fontSize: 12 },
  flashcardList: { gap: 10 },
  flashcardRow: { borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  flashcardBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flashcardBadgeText: { fontFamily: F.bold, fontSize: 13 },
  flashcardIcon: { width: 24, height: 24 },
  flashcardBody: { flex: 1, gap: 4 },
  flashcardTitle: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  flashcardSubtitle: { fontFamily: F.regular, fontSize: 12 },
  growthCard: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 12, marginTop: 2 },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthTitle: { fontFamily: F.bold, fontSize: 17 },
  growthChip: { fontFamily: F.semiBold, fontSize: 11 },
  growthGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  growthValue: { fontFamily: F.bold, fontSize: 20 },
  growthLabel: { fontFamily: F.regular, fontSize: 11, marginTop: 3 },
});
