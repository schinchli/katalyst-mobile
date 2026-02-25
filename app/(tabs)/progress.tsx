import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

// ─── Vuexy design tokens ──────────────────────────────────────────────────────
const T = {
  primary:      '#7367F0',
  success:      '#28C76F',
  error:        '#FF4C51',
  warning:      '#FF9F43',
  surface:      '#FFFFFF',
  bg:           '#F8F7FA',
  border:       '#DBDADE',
  text:         '#2F2B3D',
  textSecondary:'#444050',
  muted:        '#A5A3AE',
  primaryFaint: '#EBE9FD',
} as const;

// ─── Stat card config ─────────────────────────────────────────────────────────
type StatKey = 'completedQuizzes' | 'averageScore' | 'currentStreak' | 'badges';

interface StatCard {
  icon: string;
  iconColor: string;
  iconBg: string;
  key: StatKey;
  label: string;
  suffix?: string;
  isArray?: boolean;
}

const STAT_CARDS: StatCard[] = [
  {
    icon: 'check-circle', iconColor: T.primary,  iconBg: '#EBE9FD',
    key: 'completedQuizzes', label: 'Quizzes Done',
  },
  {
    icon: 'award',        iconColor: T.warning,  iconBg: '#FFF3E8',
    key: 'averageScore',  label: 'Avg Score', suffix: '%',
  },
  {
    icon: 'zap',          iconColor: T.success,  iconBg: '#E8FAF0',
    key: 'currentStreak', label: 'Day Streak',
  },
  {
    icon: 'star',         iconColor: T.error,    iconBg: '#FFEBEB',
    key: 'badges',        label: 'Badges', isArray: true,
  },
];

// ─── Category icons ───────────────────────────────────────────────────────────
const categoryIcons: Record<string, string> = {
  bedrock: 'cpu', rag: 'database', agents: 'users', guardrails: 'shield',
  'prompt-eng': 'edit-3', routing: 'shuffle', security: 'lock',
  monitoring: 'activity', orchestration: 'git-branch', evaluation: 'bar-chart',
  general: 'book',
};

const categoryAccent: Record<string, string> = {
  bedrock:       T.primary,
  rag:           T.success,
  agents:        T.warning,
  guardrails:    T.error,
  'prompt-eng':  T.primary,
  routing:       T.success,
  security:      T.error,
  monitoring:    T.warning,
  orchestration: T.primary,
  evaluation:    T.success,
  general:       T.primary,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** 2-column stat card */
function StatCardItem({ cfg, value }: { cfg: StatCard; value: number }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: cfg.iconBg }]}>
        <Feather name={cfg.icon as any} size={20} color={cfg.iconColor} />
      </View>
      <Text style={styles.statValue}>
        {value}{cfg.suffix ?? ''}
      </Text>
      <Text style={styles.statLabel}>{cfg.label}</Text>
    </View>
  );
}

/** Best score highlight card */
function BestScoreCard({ pct, quizTitle }: { pct: number; quizTitle: string }) {
  return (
    <View style={styles.bestScoreCard}>
      {/* Accent strip */}
      <View style={styles.bestScoreStrip} />
      <View style={styles.bestScoreBody}>
        <View style={styles.bestScoreLeft}>
          <View style={styles.bestScoreTrophyWrap}>
            <Feather name="award" size={22} color="#F59E0B" />
          </View>
          <View>
            <Text style={styles.bestScoreLabel}>Best Score</Text>
            <Text style={styles.bestScoreQuiz} numberOfLines={1}>{quizTitle}</Text>
          </View>
        </View>
        <Text style={styles.bestScorePct}>{pct}%</Text>
      </View>
    </View>
  );
}

/** Category breakdown row */
function CategoryRow({
  category,
  total,
  completed,
}: {
  category: string;
  total: number;
  completed: number;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const accent = categoryAccent[category] ?? T.primary;

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIconWrap, { backgroundColor: `${accent}18` }]}>
          <Feather
            name={(categoryIcons[category] ?? 'book') as any}
            size={16}
            color={accent}
          />
        </View>
        <Text style={styles.categoryName}>{capitalize(category)}</Text>
        <Text style={styles.categoryCount}>{completed}/{total}</Text>
        <Text style={[styles.categoryPct, { color: accent }]}>{pct}%</Text>
      </View>
      <View style={styles.categoryBarWrap}>
        <ProgressBar progress={total > 0 ? completed / total : 0} height={6} color={accent} />
      </View>
    </View>
  );
}

/** Recent result card with score bar */
function RecentResultCard({
  quizTitle,
  score,
  total,
}: {
  quizTitle: string;
  score: number;
  total: number;
}) {
  const pct  = Math.round((score / total) * 100);
  const pass = pct >= 70;

  return (
    <View style={styles.resultCard}>
      {/* Title + badge */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle} numberOfLines={1}>{quizTitle}</Text>
        <View style={[styles.resultBadge, pass ? styles.resultBadgePass : styles.resultBadgeFail]}>
          <Text style={[styles.resultBadgeText, { color: pass ? T.success : T.error }]}>
            {pass ? 'Pass' : 'Fail'}
          </Text>
        </View>
      </View>

      {/* Score bar row */}
      <View style={styles.resultBarRow}>
        <View style={styles.resultBarWrap}>
          <ProgressBar
            progress={score / total}
            height={6}
            color={pass ? T.success : T.error}
          />
        </View>
        <Text style={[styles.resultPct, { color: pass ? T.success : T.error }]}>{pct}%</Text>
      </View>

      <Text style={styles.resultSubtitle}>{score}/{total} correct</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const progress = useProgressStore((s) => s.progress);
  const { isDesktop, contentContainerWeb } = useWebLayout();

  // Build category breakdown
  const categoryProgress = quizzes.reduce(
    (acc, quiz) => {
      if (!acc[quiz.category]) acc[quiz.category] = { total: 0, completed: 0 };
      acc[quiz.category].total++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>,
  );

  // Best score from recent results
  const bestResult =
    progress.recentResults.length > 0
      ? progress.recentResults.reduce((best, r) =>
          r.score / r.totalQuestions > best.score / best.totalQuestions ? r : best,
        )
      : null;
  const bestQuiz = bestResult ? quizzes.find((q) => q.id === bestResult.quizId) : null;
  const bestPct  = bestResult
    ? Math.round((bestResult.score / bestResult.totalQuestions) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerWeb]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.screenTitle}>Progress</Text>

        {/* Best score highlight (only when results exist) */}
        {bestResult && bestQuiz && (
          <BestScoreCard
            pct={bestPct}
            quizTitle={bestQuiz.title ?? bestResult.quizId}
          />
        )}

        {/* Stats grid — 2 columns */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((cfg) => {
            const raw = progress[cfg.key as keyof typeof progress];
            const val = cfg.isArray ? (raw as unknown[]).length : (raw as number);
            return <StatCardItem key={cfg.key} cfg={cfg} value={val} />;
          })}
        </View>

        {/* Category breakdown */}
        <Text style={styles.sectionHeader}>By Category</Text>
        {Object.entries(categoryProgress).map(([category, data]) => (
          <CategoryRow
            key={category}
            category={category}
            total={data.total}
            completed={data.completed}
          />
        ))}

        {/* Recent results */}
        {progress.recentResults.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Recent Results</Text>
            {progress.recentResults.slice(0, 5).map((result, idx) => {
              const quiz = quizzes.find((q) => q.id === result.quizId);
              return (
                <RecentResultCard
                  key={idx}
                  quizTitle={quiz?.title ?? result.quizId}
                  score={result.score}
                  total={result.totalQuestions}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // Page title
  screenTitle: {
    fontFamily: F.bold,
    fontSize: 26,
    color: T.text,
    marginBottom: 16,
  },

  // Section headers
  sectionHeader: {
    fontFamily: F.bold,
    fontSize: 18,
    color: T.text,
    marginTop: 24,
    marginBottom: 12,
  },

  // ── Best score card ────────────────────────────────────────────────────────
  bestScoreCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: T.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bestScoreStrip: {
    height: 4,
    backgroundColor: T.warning,
  },
  bestScoreBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  bestScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bestScoreTrophyWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestScoreLabel: {
    fontSize: 12,
    color: T.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  bestScoreQuiz: {
    fontSize: 15,
    fontWeight: '600',
    color: T.text,
    maxWidth: 180,
  },
  bestScorePct: {
    fontSize: 28,
    fontWeight: '700',
    color: T.warning,
  },

  // ── Stats grid ─────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    width: '47.5%',
    alignItems: 'flex-start',
    shadowColor: T.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: F.bold,
    fontSize: 24,
    color: T.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: T.muted,
  },

  // ── Category breakdown ─────────────────────────────────────────────────────
  categoryCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: T.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    color: T.text,
  },
  categoryCount: {
    fontSize: 13,
    color: T.muted,
    marginRight: 4,
  },
  categoryPct: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  categoryBarWrap: {
    marginTop: 2,
  },

  // ── Recent results ─────────────────────────────────────────────────────────
  resultCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: T.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: T.text,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultBadgePass: {
    backgroundColor: '#E8FAF0',
  },
  resultBadgeFail: {
    backgroundColor: '#FFEBEB',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  resultBarWrap: {
    flex: 1,
  },
  resultPct: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  resultSubtitle: {
    fontSize: 12,
    color: T.muted,
  },
});
