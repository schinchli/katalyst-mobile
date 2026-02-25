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

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#2F2B3D',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

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
    iconBg: '#EBE9FD',
    iconColor: '#7367F0',
    label: 'Day Streak',
    getValue: (p) => String(p.currentStreak),
  },
  {
    icon: 'check-circle',
    iconBg: '#D1F7E2',
    iconColor: '#28C76F',
    label: 'Completed',
    getValue: (p) => String(p.completedQuizzes),
  },
  {
    icon: 'trending-up',
    iconBg: '#FEF3C7',
    iconColor: '#FF9F43',
    label: 'Avg Score',
    getValue: (p) => `${p.averageScore}%`,
  },
  {
    icon: 'award',
    iconBg: '#FFE5E6',
    iconColor: '#FF4C51',
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
          <Text style={[styles.progressPercent, { color: '#7367F0' }]}>
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
    backgroundColor: '#7367F0',
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
    fontSize: 13,
    lineHeight: 18,
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginTop: 1,
  },
  greetingDate: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },

  // ── CTA button (purple gradient via layered views) ─────────────────────────
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#7367F0',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    // Subtle inner shadow by slightly darker bottom border-like edge
    shadowColor: '#5E50EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 12,
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
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Progress card ──────────────────────────────────────────────────────────
  progressCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressAccentStrip: {
    height: 4,
    backgroundColor: '#7367F0',
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
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  progressSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  progressFooterRow: {
    marginTop: 12,
  },
  progressFooterText: {
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
    fontSize: 18,
    fontWeight: '700',
  },
  sectionViewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7367F0',
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
