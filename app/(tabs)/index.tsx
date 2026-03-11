import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore, calculateLevel, LEVEL_NAMES } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { flashcards } from '@/data/flashcards';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

function StatPill({ icon, value, colors }: { icon: keyof typeof Feather.glyphMap; value: string; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={[styles.statPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <Text style={[styles.statPillText, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const progress = useProgressStore((s) => s.progress);
  const featuredQuiz = quizzes[0];
  const popularCourses = quizzes.slice(0, 6);
  const flashcardItems = flashcards.slice(0, 4);
  const courseCompletion = featuredQuiz ? Math.min(100, Math.max(8, Math.round((progress.completedQuizzes / quizzes.length) * 100))) : 0;
  const firstName = user?.name?.split(' ')[0] ?? 'Learner';
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const streak = progress.currentStreak;
  const xp = progress.xp ?? 0;
  const level = calculateLevel(xp);
  const levelName = LEVEL_NAMES[level - 1] ?? 'Novice';
  const streakMessage =
    streak === 0 ? '🚀 Start your learning streak today!'
    : streak === 1 ? '🔥 1 day streak! Come back tomorrow to keep it going!'
    : streak >= 7 ? `⚡ ${streak} day streak! You're unstoppable!`
    : streak >= 3 ? `🔥 ${streak} day streak! You're on fire!`
    : `🔥 ${streak} day streak! Keep it going!`;
  const actionCards = [
    { icon: 'layers', title: 'Flashcards', subtitle: 'Review your progress', route: '/flashcards' as const, tone: '#8B5CF6' },
    { icon: 'activity', title: 'Practice', subtitle: 'Explore every quiz and start a session', route: '/(tabs)/quizzes' as const, tone: '#F59E0B' },
    { icon: 'globe', title: 'Resources', subtitle: 'Cheat sheets, guides, and updates', route: '/(tabs)/learn' as const, tone: '#60A5FA' },
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

        <LinearGradient colors={[colors.backgroundAlt, colors.surface, colors.surfaceElevated]} style={[styles.heroCard, { borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.heroEyebrow, { color: colors.primary }]}>{EXPERIENCE_COPY.home.heroEyebrow}</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Hi {firstName}, {platformConfig.copy.homeHeroTitle}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{platformConfig.copy.homeHeroSubtitle}</Text>
          <Text style={[styles.heroStreakMessage, { color: colors.textSecondary }]}>{streakMessage}</Text>

          <View style={[styles.heroCourseCard, { backgroundColor: platformConfig.colors.homeHeroCourseBg }]}>
            <View style={styles.heroCourseTop}>
              <View>
                <Text style={[styles.heroCourseTitle, { color: colors.text }]}>{featuredQuiz?.title ?? 'Featured course'}</Text>
                <View style={[styles.desktopOnlyChip, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.desktopOnlyText, { color: colors.primary }]}>
                    {featuredQuiz?.isPremium ? 'Premium track' : 'Available everywhere'}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressRing, { borderColor: colors.primary + '25' }]}>
                <View style={[styles.progressRingInner, { borderColor: colors.primary }]}>
                  <Text style={[styles.progressRingText, { color: colors.text }]}>{courseCompletion}%</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={() => router.push(featuredQuiz ? `/quiz/${featuredQuiz.id}` : '/(tabs)/quizzes')} style={[styles.heroPrimaryCta, { backgroundColor: colors.primary }]}>
              <Text style={styles.heroPrimaryText}>{EXPERIENCE_COPY.home.primaryCta}</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {platformConfig.widgets.showHomeActions ? (
          <View style={platformConfig.layout.homeActionsStyle === 'stack' ? styles.actionStack : styles.actionGrid}>
            {actionCards.map((item) => (
            <Pressable key={item.title} onPress={() => router.push(item.route as any)} style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={[styles.actionIcon, { backgroundColor: item.tone + '20' }]}>
                <Feather name={item.icon as any} size={22} color={item.tone} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </Pressable>
            ))}
          </View>
        ) : null}

        {platformConfig.widgets.showPopularCourses ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Courses</Text>
              <Pressable onPress={() => router.push('/(tabs)/quizzes')}>
                <Text style={[styles.sectionLink, { color: colors.text }]}>{'See All'}</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
              {popularCourses.map((quiz, index) => (
                <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.courseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <LinearGradient
                    colors={index % 2 === 0 ? [colors.gradientAccent, colors.error] : [colors.warning, '#FACC15']}
                    style={styles.courseVisual}
                  >
                    <Feather name={quiz.icon as any} size={44} color="#F8FAFC" />
                  </LinearGradient>
                  <View style={styles.courseBody}>
                    <View style={[styles.courseProgressTrack, { backgroundColor: colors.backgroundAlt }]}>
                      <View style={[styles.courseProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (index + 1) * 14)}%` }]} />
                    </View>
                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>{quiz.title}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {platformConfig.widgets.showFlashcards ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Flashcard Packs</Text>
            </View>

            <View style={styles.flashcardList}>
              {flashcardItems.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/flashcards', params: { category: item.category } })}
                  style={[styles.flashcardRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <View style={[styles.flashcardBadge, { backgroundColor: index % 2 === 0 ? colors.primaryLight : colors.error + '20' }]}>
                    <Text style={[styles.flashcardBadgeText, { color: index % 2 === 0 ? colors.primary : colors.error }]}>
                      {item.category === 'aws-practitioner' ? 'AWS' : 'AI'}
                    </Text>
                  </View>
                  <View style={styles.flashcardBody}>
                    <Text style={[styles.flashcardTitle, { color: colors.text }]} numberOfLines={2}>{item.front}</Text>
                    <Text style={[styles.flashcardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
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
              <Text style={[styles.growthTitle, { color: colors.text }]}>Growth snapshot</Text>
              <Text style={[styles.growthChip, { color: colors.primary }]}>{progress.currentStreak} day streak</Text>
            </View>
            <View style={styles.growthGrid}>
              <View>
                <Text style={[styles.growthValue, { color: colors.text }]}>{progress.completedQuizzes}</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
              <View>
                <Text style={[styles.growthValue, { color: colors.text }]}>{progress.averageScore}%</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary }]}>Average score</Text>
              </View>
              <View>
                <Text style={[styles.growthValue, { color: colors.text }]}>{progress.badges.length}</Text>
                <Text style={[styles.growthLabel, { color: colors.textSecondary }]}>Badges</Text>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 44, gap: 18 },
  topStats: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  statPill: { flex: 1, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statPillText: { fontFamily: F.bold, fontSize: 16 },
  heroCard: { borderWidth: 1, borderRadius: 30, padding: 20, gap: 14 },
  heroEyebrow: { fontFamily: F.bold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontFamily: F.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  heroSubtitle: { fontFamily: F.regular, fontSize: 15, lineHeight: 24 },
  heroStreakMessage: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, marginTop: -4 },
  heroCourseCard: { backgroundColor: '#0E1830', borderRadius: 24, padding: 18, gap: 18 },
  heroCourseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  heroCourseTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 24, maxWidth: 190 },
  desktopOnlyChip: { alignSelf: 'flex-start', borderRadius: 999, marginTop: 8, paddingHorizontal: 12, paddingVertical: 7 },
  desktopOnlyText: { fontFamily: F.semiBold, fontSize: 13 },
  progressRing: { width: 124, height: 124, borderRadius: 62, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  progressRingInner: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  progressRingText: { fontFamily: F.bold, fontSize: 30 },
  heroPrimaryCta: { borderRadius: 20, minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  heroPrimaryText: { color: '#04111F', fontFamily: F.bold, fontSize: 16 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionStack: { gap: 14 },
  actionCard: { width: '48%', borderWidth: 1, borderRadius: 24, padding: 16, minHeight: 168, gap: 12 },
  actionIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: F.bold, fontSize: 18 },
  actionSubtitle: { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontFamily: F.bold, fontSize: 18 },
  sectionLink: { fontFamily: F.semiBold, fontSize: 15, textDecorationLine: 'underline' },
  horizontalRow: { gap: 14, paddingRight: 16 },
  courseCard: { width: 184, borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  courseVisual: { height: 128, alignItems: 'center', justifyContent: 'center' },
  courseBody: { padding: 14, gap: 12 },
  courseProgressTrack: { height: 12, borderRadius: 999, overflow: 'hidden' },
  courseProgressFill: { height: '100%', borderRadius: 999 },
  courseTitle: { fontFamily: F.bold, fontSize: 17, lineHeight: 24 },
  flashcardList: { gap: 12 },
  flashcardRow: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  flashcardBadge: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flashcardBadgeText: { fontFamily: F.bold, fontSize: 16 },
  flashcardBody: { flex: 1, gap: 5 },
  flashcardTitle: { fontFamily: F.semiBold, fontSize: 16, lineHeight: 22 },
  flashcardSubtitle: { fontFamily: F.regular, fontSize: 13 },
  growthCard: { borderWidth: 1, borderRadius: 28, padding: 18, gap: 18, marginTop: 4 },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthTitle: { fontFamily: F.bold, fontSize: 18 },
  growthChip: { fontFamily: F.semiBold, fontSize: 13 },
  growthGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  growthValue: { fontFamily: F.bold, fontSize: 26 },
  growthLabel: { fontFamily: F.regular, fontSize: 13, marginTop: 4 },
});
