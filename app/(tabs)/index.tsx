import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { QuizCard } from '@/components/quiz/QuizCard';
import { BadgeCelebrationModal } from '@/components/ui/BadgeCelebrationModal';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { LEVEL_NAMES } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { getContests } from '@/data/contests';
import { getDailyQuiz } from '@/utils/dailyChallenge';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#4B465C',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// ─── Stat card definition ─────────────────────────────────────────────────────
type StatColorType = 'primary' | 'success' | 'warning' | 'error';

interface StatDef {
  icon: string;
  colorType: StatColorType;
  label: string;
  getValue: (p: ReturnType<typeof useProgressStore.getState>['progress']) => string;
}

const STAT_DEFS: StatDef[] = [
  { icon: 'zap',          colorType: 'primary', label: 'Day Streak', getValue: (p) => String(p.currentStreak) },
  { icon: 'check-circle', colorType: 'success', label: 'Completed',  getValue: (p) => String(p.completedQuizzes) },
  { icon: 'trending-up',  colorType: 'warning', label: 'Avg Score',  getValue: (p) => `${p.averageScore}%` },
  { icon: 'award',        colorType: 'error',   label: 'Badges',     getValue: (p) => String(p.badges?.length ?? 0) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GreetingHeader({ userName, coins, level }: { userName: string; coins: number; level: number }) {
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
      <View style={[styles.headerAccentStrip, { backgroundColor: colors.primary }]} />

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

        <View style={styles.headerRight}>
          {/* Coin balance */}
          <View style={[styles.coinPill, { backgroundColor: colors.warning + '18' }]}>
            <Feather name="zap" size={13} color={colors.warning} />
            <Text style={[styles.coinPillText, { color: colors.warning }]}>{coins.toLocaleString()}</Text>
          </View>
          {/* Level badge */}
          <View style={[styles.levelPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.levelPillText, { color: colors.primary }]}>Lv.{level}</Text>
          </View>
          {/* CTA button */}
          <Pressable
            onPress={() => router.push('/(tabs)/quizzes')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ctaButton, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          >
            <Feather name="play" size={15} color="#FFFFFF" />
            <Text style={styles.ctaButtonText}>Start</Text>
          </Pressable>
        </View>
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
  const iconColor = colors[def.colorType];
  const iconBg    = iconColor + '18';
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface },
        CARD_SHADOW,
        flex && { flex: 1 },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <Feather name={def.icon as any} size={20} color={iconColor} />
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

function RecentResultsStrip() {
  const colors  = useThemeColors();
  const results = useProgressStore((s) => s.progress.recentResults).slice(0, 3);
  if (results.length === 0) return null;
  return (
    <>
      <SectionHeader title="Recent Results" />
      <View style={[styles.recentCard, { backgroundColor: colors.surface }, CARD_SHADOW]}>
        {results.map((r, i) => {
          const quiz = quizzes.find((q) => q.id === r.quizId);
          const pct  = Math.round((r.score / r.totalQuestions) * 100);
          const pass = pct >= 70;
          return (
            <View
              key={`${r.quizId}-${r.completedAt}`}
              style={[styles.recentRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.surfaceBorder }]}
            >
              <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                {quiz?.title ?? r.quizId}
              </Text>
              <View style={[styles.recentBadge, { backgroundColor: (pass ? colors.success : colors.error) + '18' }]}>
                <Text style={[styles.recentBadgeText, { color: pass ? colors.success : colors.error }]}>
                  {pct}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
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
        <Pressable onPress={onViewAll} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.sectionViewAll, { color: colors.primary }]}>View All</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickActionsRow() {
  const colors = useThemeColors();
  const ACTIONS = [
    { icon: 'award',    label: 'Leaderboard', color: colors.warning, bg: colors.warning + '18', route: '/leaderboard' as const },
    { icon: 'zap',      label: 'Challenge',   color: colors.primary, bg: colors.primaryLight,   route: '/challenge' as const },
    { icon: 'calendar', label: 'Contests',    color: colors.error,   bg: colors.error + '18',   route: '/contest' as const },
  ];
  return (
    <View style={styles.quickRow}>
      {ACTIONS.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => router.push(a.route as any)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.quickBtn, { backgroundColor: a.bg, opacity: pressed ? 0.88 : 1 }]}
        >
          <Feather name={a.icon as any} size={22} color={a.color} />
          <Text style={[styles.quickBtnLabel, { color: a.color }]}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function LiveContestBanner() {
  const colors = useThemeColors();
  const live   = getContests('live')[0];
  if (!live) return null;
  return (
    <Pressable
      onPress={() => router.push('/contest' as any)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.liveContest, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.liveContestLeft}>
        <View style={styles.liveContestDot} />
        <Text style={styles.liveContestLabel}>LIVE NOW</Text>
      </View>
      <Text style={styles.liveContestTitle} numberOfLines={1}>{live.title}</Text>
      <Feather name="chevron-right" size={16} color="#fff" />
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const progress = useProgressStore((s) => s.progress);
  const { isDesktop, isWide, contentContainerWeb } = useWebLayout();

  const userName = user?.name ?? 'Learner';

  // ── Desktop two-column layout ─────────────────────────────────────────────
  if (isDesktop) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <BadgeCelebrationModal />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerWeb,
            { paddingHorizontal: isWide ? 40 : 28 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <GreetingHeader userName={userName} coins={progress.coins ?? 0} level={progress.level ?? 1} />

          {/* Stats row — 4 equal columns on desktop */}
          <View style={styles.statsRowDesktop}>
            {STAT_DEFS.map((def) => (
              <View key={def.label} style={styles.statColDesktop}>
                <StatCard def={def} progress={progress} />
              </View>
            ))}
          </View>

          {/* Progress + Topics + Quiz list: side by side on wide screens */}
          <View style={styles.desktopBodyRow}>
            {/* Left col: recent results */}
            <View style={styles.desktopLeftCol}>
              <RecentResultsStrip />
            </View>

            {/* Right col: quiz list */}
            <View style={styles.desktopRightCol}>
              <SectionHeader
                title="Start Practicing"
                onViewAll={() => router.push('/(tabs)/quizzes')}
              />
              {quizzes.slice(0, 5).map((quiz) => (
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
      <BadgeCelebrationModal />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <GreetingHeader userName={userName} coins={progress.coins ?? 0} level={progress.level ?? 1} />

        {/* Live contest banner */}
        <LiveContestBanner />

        {/* Quick actions */}
        <View style={styles.sectionGap}>
          <QuickActionsRow />
        </View>

        {/* Stats — 2×2 grid on mobile */}
        <View style={styles.statsGrid}>
          {STAT_DEFS.map((def) => (
            <View key={def.label} style={styles.statGridCell}>
              <StatCard def={def} progress={progress} />
            </View>
          ))}
        </View>

        {/* Daily Quiz Card */}
        <View style={styles.sectionGap}>
          <SectionHeader title="Daily Quiz" />
          {(() => {
            const dailyQuiz = getDailyQuiz(quizzes);
            return (
              <Pressable
                onPress={() => router.push(`/quiz/${dailyQuiz.id}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.dailyCard,
                  { backgroundColor: colors.surface, opacity: pressed ? 0.92 : 1 },
                  CARD_SHADOW,
                ]}
              >
                <View style={[styles.dailyAccent, { backgroundColor: colors.warning }]} />
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

        {/* Recent Results */}
        <View style={styles.sectionGap}>
          <RecentResultsStrip />
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

  // ── Header right cluster ────────────────────────────────────────────────────
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },
  coinPillText: { fontFamily: F.bold, fontSize: 12 },
  levelPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  levelPillText: { fontFamily: F.bold, fontSize: 12 },

  // ── CTA button ─────────────────────────────────────────────────────────────
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
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
    fontSize: 13,
    letterSpacing: 0.1,
  },

  // ── Live contest banner ─────────────────────────────────────────────────────
  liveContest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EA5455',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#EA5455',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  liveContestLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveContestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveContestLabel: { fontFamily: F.bold, fontSize: 11, color: '#fff', letterSpacing: 0.5 },
  liveContestTitle: { fontFamily: F.semiBold, fontSize: 14, color: '#fff', flex: 1 },

  // ── Quick actions row ───────────────────────────────────────────────────────
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  quickBtnLabel: { fontFamily: F.semiBold, fontSize: 12 },

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

  // ── Recent results strip ───────────────────────────────────────────────────
  recentCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 8,
  },
  recentTitle: {
    fontFamily: F.medium,
    fontSize: 14,
    flex: 1,
  },
  recentBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentBadgeText: {
    fontFamily: F.bold,
    fontSize: 13,
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
  },

  // ── Daily Quiz card ────────────────────────────────────────────────────────
  dailyCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  dailyAccent: {
    height: 3,
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
