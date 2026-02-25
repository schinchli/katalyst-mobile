import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuizCard } from '@/components/quiz/QuizCard';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#2F2B3D',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// Vuexy light-mode design tokens (app is locked to light)
const T = {
  primary:      '#7367F0',
  success:      '#28C76F',
  warning:      '#FF9F43',
  error:        '#FF4C51',
  primaryLight: '#EBE9FD',
  successLight: '#D1F7E2',
  warningLight: '#FFF3E8',
  errorLight:   '#FFE5E6',
} as const;

// ─── Stat card definition ─────────────────────────────────────────────────────
interface StatDef {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  getValue: (p: ReturnType<typeof useProgressStore.getState>['progress']) => string;
}

const STAT_DEFS: StatDef[] = [
  {
    icon: 'zap',
    iconBg: T.primaryLight,
    iconColor: T.primary,
    label: 'Day Streak',
    getValue: (p) => String(p.currentStreak),
  },
  {
    icon: 'check-circle',
    iconBg: T.successLight,
    iconColor: T.success,
    label: 'Completed',
    getValue: (p) => String(p.completedQuizzes),
  },
  {
    icon: 'trending-up',
    iconBg: T.warningLight,
    iconColor: T.warning,
    label: 'Avg Score',
    getValue: (p) => `${p.averageScore}%`,
  },
  {
    icon: 'award',
    iconBg: T.errorLight,
    iconColor: T.error,
    label: 'Badges',
    getValue: (p) => String(p.badges?.length ?? 0),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GreetingHeader({ userName }: { userName: string }) {
  const colors = useThemeColors();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.headerCard, { backgroundColor: colors.surface }, CARD_SHADOW]}>
      {/* Purple accent strip at top */}
      <View style={styles.headerAccentStrip} />

      <View style={styles.headerInner}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.greetingSubtext, { color: colors.textSecondary }]}>
            {greeting()},
          </Text>
          <Text style={[styles.greetingName, { color: colors.text }]}>
            {userName}
          </Text>
          <Text style={[styles.greetingDate, { color: colors.textSecondary }]}>
            {today}
          </Text>
        </View>

        {/* CTA button */}
        <Pressable
          onPress={() => router.push('/(tabs)/quizzes')}
          style={({ pressed }) => [styles.ctaButton, { opacity: pressed ? 0.88 : 1 }]}
        >
          <Feather name="play" size={15} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Start Learning</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatCard({
  def,
  progress,
  flex,
}: {
  def: StatDef;
  progress: ReturnType<typeof useProgressStore.getState>['progress'];
  flex?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface },
        CARD_SHADOW,
        flex && { flex: 1 },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: def.iconBg }]}>
        <Feather name={def.icon as any} size={20} color={def.iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {def.getValue(progress)}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {def.label}
      </Text>
    </View>
  );
}

function ProgressCard({
  completionRate,
  completed,
  total,
}: {
  completionRate: number;
  completed: number;
  total: number;
}) {
  const colors = useThemeColors();
  const pct = Math.round(completionRate * 100);

  return (
    <View style={[styles.progressCard, { backgroundColor: colors.surface }, CARD_SHADOW]}>
      {/* Purple accent strip */}
      <View style={styles.progressAccentStrip} />

      <View style={styles.progressInner}>
        <View style={styles.progressHeaderRow}>
          <View>
            <Text style={[styles.progressTitle, { color: colors.text }]}>
              Course Completion
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              {completed} of {total} quizzes done
            </Text>
          </View>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {pct}%
          </Text>
        </View>

        <ProgressBar progress={completionRate} height={8} />

        <View style={styles.progressFooterRow}>
          <Text style={[styles.progressFooterText, { color: colors.textSecondary }]}>
            Keep going — you're building real AWS expertise!
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.sectionViewAll}>View All</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const progress = useProgressStore((s) => s.progress);
  const { isDesktop, isWide, contentContainerWeb } = useWebLayout();

  const userName = user?.name ?? 'Learner';
  const completionRate =
    quizzes.length > 0 ? progress.completedQuizzes / quizzes.length : 0;

  // ── Desktop two-column layout ─────────────────────────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerWeb,
            { paddingHorizontal: isWide ? 40 : 28 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GreetingHeader userName={userName} />

          {/* Stats row — 4 equal columns on desktop */}
          <View style={styles.statsRowDesktop}>
            {STAT_DEFS.map((def) => (
              <View key={def.label} style={styles.statColDesktop}>
                <StatCard def={def} progress={progress} />
              </View>
            ))}
          </View>

          {/* Progress + Continue Learning: side by side on wide screens */}
          <View style={styles.desktopBodyRow}>
            {/* Left col: progress card */}
            <View style={styles.desktopLeftCol}>
              <ProgressCard
                completionRate={completionRate}
                completed={progress.completedQuizzes}
                total={quizzes.length}
              />
            </View>

            {/* Right col: quiz list */}
            <View style={styles.desktopRightCol}>
              <SectionHeader
                title="Continue Learning"
                onViewAll={() => router.push('/(tabs)/quizzes')}
              />
              {quizzes.slice(0, 3).map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onPress={() => router.push(`/quiz/${quiz.id}`)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GreetingHeader userName={userName} />

        {/* Stats — 2×2 grid on mobile */}
        <View style={styles.statsGrid}>
          {STAT_DEFS.map((def, i) => (
            <View key={def.label} style={styles.statGridCell}>
              <StatCard def={def} progress={progress} />
            </View>
          ))}
        </View>

        {/* Daily Quiz Card */}
        <View style={styles.sectionGap}>
          <SectionHeader title="Daily Quiz" />
          {(() => {
            const dailyQuiz = quizzes[new Date().getDate() % quizzes.length];
            return (
              <Pressable
                onPress={() => router.push(`/quiz/${dailyQuiz.id}`)}
                style={({ pressed }) => [
                  styles.dailyCard,
                  { backgroundColor: colors.surface, opacity: pressed ? 0.92 : 1 },
                  CARD_SHADOW,
                ]}
              >
                <View style={styles.dailyAccent} />
                <View style={styles.dailyBody}>
                  <View style={[styles.dailyIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Feather name={dailyQuiz.icon as any} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.dailyInfo}>
                    <Text style={[styles.dailyLabel, { color: colors.primary }]}>TODAY'S CHALLENGE</Text>
                    <Text style={[styles.dailyTitle, { color: colors.text }]}>{dailyQuiz.title}</Text>
                    <Text style={[styles.dailyMeta, { color: colors.textSecondary }]}>
                      {dailyQuiz.questionCount} questions · {dailyQuiz.duration} min
                    </Text>
                  </View>
                  <View style={[styles.dailyStartBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.dailyStartText}>Start</Text>
                  </View>
                </View>
              </Pressable>
            );
          })()}
        </View>

        {/* Overall Progress */}
        <View style={styles.sectionGap}>
          <ProgressCard
            completionRate={completionRate}
            completed={progress.completedQuizzes}
            total={quizzes.length}
          />
        </View>

        {/* Continue Learning */}
        <View style={styles.sectionGap}>
          <SectionHeader
            title="Continue Learning"
            onViewAll={() => router.push('/(tabs)/quizzes')}
          />
          {quizzes.slice(0, 3).map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onPress={() => router.push(`/quiz/${quiz.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Header card ────────────────────────────────────────────────────────────
  headerCard: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerAccentStrip: {
    height: 4,
    backgroundColor: T.primary,
  },
  headerInner: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  greetingSubtext: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  greetingName: {
    fontFamily: F.bold,
    fontSize: 24,
    lineHeight: 32,
    marginTop: 1,
  },
  greetingDate: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },

  // ── CTA button ─────────────────────────────────────────────────────────────
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    shadowColor: '#5E50EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButtonText: {
    fontFamily: F.semiBold,
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.1,
  },

  // ── Stats (mobile 2×2 grid) ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 0,
  },
  statGridCell: {
    width: '47.5%',
  },
  statCard: {
    borderRadius: 10,
    padding: 16,
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Progress card ──────────────────────────────────────────────────────────
  progressCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressAccentStrip: {
    height: 4,
    backgroundColor: T.primary,
  },
  progressInner: {
    padding: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressTitle: {
    fontFamily: F.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  progressSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  progressPercent: {
    fontFamily: F.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  progressFooterRow: {
    marginTop: 12,
  },
  progressFooterText: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 17,
  },

  // ── Section header ─────────────────────────────────────────────────────────
  sectionGap: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
  },
  sectionViewAll: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: T.primary,
  },

  // ── Daily Quiz card ────────────────────────────────────────────────────────
  dailyCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dailyAccent: {
    height: 3,
    backgroundColor: T.warning,
  },

  // Daily card internals
  dailyBody: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dailyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dailyInfo: {
    flex: 1,
  },
  dailyLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dailyTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  dailyMeta: {
    fontFamily: F.regular,
    fontSize: 12,
    marginTop: 2,
  },
  dailyStartBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexShrink: 0,
  },
  dailyStartText: {
    fontFamily: F.semiBold,
    color: '#FFFFFF',
    fontSize: 13,
  },

  // ── Desktop layout ─────────────────────────────────────────────────────────
  statsRowDesktop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statColDesktop: {
    flex: 1,
  },
  desktopBodyRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  desktopLeftCol: {
    width: '36%',
  },
  desktopRightCol: {
    flex: 1,
  },
});
