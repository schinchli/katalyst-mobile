import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
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

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const user = useAuthStore((s) => s.user);
  const progress = useProgressStore((s) => s.progress);
  const firstName = user?.name?.split(' ')[0] ?? 'Learner';
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const systemFeatures = useSystemFeatureStore((s) => s.config);
  const visibleQuizzes = quizzes.filter((quiz) => quiz.enabled !== false);
  const popularCourses = visibleQuizzes.slice(0, 6);
  const flashcardItems = flashcards.slice(0, 4);
  const streak = progress.currentStreak;
  const xp = progress.xp ?? 0;
  const level = calculateLevel(xp);
  const levelName = LEVEL_NAMES[level - 1] ?? 'Novice';
  const dailyQuiz = resolveDailyQuiz(systemFeatures, visibleQuizzes);
  const dailyQuizCompleted = dailyQuiz
    ? progress.recentResults.some((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : false;
  const streakMessage =
    streak === 0 ? '🚀 Start your learning streak today!'
    : streak === 1 ? '🔥 1 day streak! Come back tomorrow to keep it going!'
    : streak >= 7 ? `⚡ ${streak} day streak! You're unstoppable!`
    : streak >= 3 ? `🔥 ${streak} day streak! You're on fire!`
    : `🔥 ${streak} day streak! Keep it going!`;
  const actionCards = [
    { icon: 'layers', title: 'Flashcards', subtitle: 'Review your progress', route: '/flashcards' as const, tone: colors.gradientAccent },
    { icon: 'activity', title: 'Practice', subtitle: 'Explore every quiz and start a session', route: '/(tabs)/quizzes' as const, tone: colors.warning },
    { icon: 'globe', title: 'Resources', subtitle: 'Cheat sheets, guides, and updates', route: '/(tabs)/learn' as const, tone: colors.primary },
    { icon: 'star', title: 'Premium', subtitle: 'Unlock all content and projects', route: '/(tabs)/profile' as const, tone: colors.primary },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {platformConfig.widgets.showHomeStats ? (
          <View style={styles.topStats}>
            <StatPill icon="zap" value={`${xp} XP · Lv.${level} ${levelName}`} colors={colors} />
            <StatPill icon="activity" value={streak > 0 ? `🔥 ${streak} day streak` : '🚀 Start streak'} colors={colors} />
          </View>
        ) : null}

        {dailyQuiz ? (
          <Pressable onPress={() => router.push(`/quiz/${dailyQuiz.id}`)} style={[styles.dailyQuizCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.dailyQuizCopy}>
              <View style={styles.dailyQuizHeaderRow}>
                <Text style={[styles.dailyQuizEyebrow, { color: colors.primary }]}>{systemFeatures.dailyQuizLabel}</Text>
                <View style={[styles.dailyQuizStatus, { backgroundColor: dailyQuizCompleted ? colors.success + '18' : colors.warning + '18' }]}>
                  <Text style={[styles.dailyQuizStatusText, { color: dailyQuizCompleted ? colors.success : colors.warning }]}>
                    {dailyQuizCompleted ? 'Completed' : 'Ready'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dailyQuizTitle, { color: colors.text }]}>{dailyQuiz.title}</Text>
              <Text style={[styles.dailyQuizSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                {dailyQuizCompleted ? 'Today\'s daily quiz is complete. Open it again to review or improve your score.' : dailyQuiz.description}
              </Text>
            </View>
            <Feather name={dailyQuizCompleted ? 'check-circle' : 'arrow-right-circle'} size={22} color={dailyQuizCompleted ? colors.success : colors.primary} />
          </Pressable>
        ) : null}

        <LinearGradient colors={[colors.backgroundAlt, colors.surface, colors.surfaceElevated]} style={[styles.heroCard, { borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.heroEyebrow, { color: colors.primary, fontSize: t.micro }]}>{EXPERIENCE_COPY.home.heroEyebrow}</Text>
          <Text style={[styles.heroTitle, { color: colors.text, fontSize: t.screenTitle }]}>Hi {firstName}, {platformConfig.copy.homeHeroTitle}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary, fontSize: t.body }]}>{platformConfig.copy.homeHeroSubtitle}</Text>
          <Text style={[styles.heroStreakMessage, { color: colors.textSecondary, fontSize: t.caption }]}>{streakMessage}</Text>

        </LinearGradient>

        {platformConfig.widgets.showHomeActions ? (
          <View style={platformConfig.layout.homeActionsStyle === 'stack' ? styles.actionStack : styles.actionGrid}>
            {actionCards.map((item) => (
            <Pressable key={item.title} onPress={() => router.push(item.route as any)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={[styles.actionIcon, { backgroundColor: item.tone + '20' }]}>
                <Feather name={item.icon as any} size={18} color={item.tone} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text, fontSize: t.cardTitle }]}>{item.title}</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary, fontSize: t.caption }]}>{item.subtitle}</Text>
            </Pressable>
            ))}
          </View>
        ) : null}

        {platformConfig.widgets.showPopularCourses ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Popular Courses</Text>
              <Pressable onPress={() => router.push('/(tabs)/quizzes')}>
                <Text style={[styles.sectionLink, { color: colors.text }]}>{'See All'}</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {popularCourses.map((quiz, index) => (
                <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  {(() => {
                    const cv = getCategoryVisual(quiz.category, colors);
                    const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                    return (
                      <LinearGradient colors={[cv.from, cv.to]} style={styles.courseVisual}>
                        {catIcon ? (
                          <Image source={catIcon} style={styles.courseVisualIcon} />
                        ) : (
                          <Feather name="book" size={30} color={colors.surface} />
                        )}
                        <Text style={[styles.courseVisualLabel, { color: colors.surface }]}>{cv.label}</Text>
                      </LinearGradient>
                    );
                  })()}
                  <View style={styles.courseBody}>
                    <View style={[styles.courseProgressTrack, { backgroundColor: colors.backgroundAlt }]}>
                      <View style={[styles.courseProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (index + 1) * 14)}%` }]} />
                    </View>
                    <Text style={[styles.courseTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{quiz.title}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {platformConfig.widgets.showFlashcards ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Flashcard Packs</Text>
            </View>

            <View style={styles.flashcardList}>
              {flashcardItems.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/flashcards', params: { category: item.category } })}
                  style={[styles.flashcardRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  {(() => {
                    const svcIcon = AWS_SERVICE_ICONS[item.front];
                    const accent = AWS_SERVICE_ACCENT[item.front] ?? (index % 2 === 0 ? colors.primary : colors.error);
                    return (
                      <View style={[styles.flashcardBadge, { backgroundColor: accent + '18' }]}>
                        {svcIcon ? (
                          <Image source={svcIcon} style={styles.flashcardIcon} />
                        ) : (
                          <Feather name="cpu" size={22} color={accent} />
                        )}
                      </View>
                    );
                  })()}
                  <View style={styles.flashcardBody}>
                    <Text style={[styles.flashcardTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{item.front}</Text>
                    <Text style={[styles.flashcardSubtitle, { color: colors.textSecondary, fontSize: t.caption }]} numberOfLines={1}>
                      {item.tag ?? 'Core concept'} · tap to review
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {platformConfig.widgets.showGrowthWidget ? (
          <LinearGradient colors={[colors.surface, colors.surfaceElevated]} style={[styles.growthCard, { borderColor: colors.surfaceBorder }]}>
            <View style={styles.growthHeader}>
              <Text style={[styles.growthTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Growth snapshot</Text>
              <Text style={[styles.growthChip, { color: colors.primary }]}>{progress.currentStreak} day streak</Text>
            </View>
            <View style={styles.growthGrid}>
              <View>
                <Text style={[styles.growthValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.completedQuizzes}</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Completed</Text>
              </View>
              <View>
                <Text style={[styles.growthValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.averageScore}%</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Average score</Text>
              </View>
              <View>
                <Text style={[styles.growthValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.badges.length}</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Badges</Text>
              </View>
            </View>
          </LinearGradient>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  topStats: { flexDirection: 'row', gap: 10, marginBottom: 2 },
  statPill: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statPillText: { fontFamily: F.bold, fontSize: 14 },
  heroCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 10 },
  heroEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  heroSubtitle: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 },
  heroStreakMessage: { fontFamily: F.medium, fontSize: 12, lineHeight: 18, marginTop: -2 },
  dailyQuizCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  dailyQuizCopy: { flex: 1, gap: 4 },
  dailyQuizHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dailyQuizEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  dailyQuizStatus: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  dailyQuizStatusText: { fontFamily: F.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  dailyQuizTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 24 },
  dailyQuizSubtitle: { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionStack: { gap: 12 },
  actionCard: { width: '48%', borderWidth: 1, borderRadius: 16, padding: 12, minHeight: 130, gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: F.bold, fontSize: 15 },
  actionSubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17 },
  sectionLink: { fontFamily: F.semiBold, fontSize: 14, textDecorationLine: 'underline' },
  horizontalRow: { gap: 12, paddingRight: 16 },
  courseCard: { width: 148, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  courseVisual: { height: 96, alignItems: 'center', justifyContent: 'center', gap: 4 },
  courseVisualIcon: { width: 30, height: 30 },
  courseVisualLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  courseBody: { padding: 10, gap: 8 },
  courseProgressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  courseProgressFill: { height: '100%', borderRadius: 999 },
  courseTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
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
