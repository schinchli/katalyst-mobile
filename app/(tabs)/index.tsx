import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
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
import { PLAYLIST } from '@/data/videos';
import { flashcards, type FlashcardCategory } from '@/data/flashcards';

// ─── Constants ────────────────────────────────────────────────────────────────
const CARD_SHADOW = {
  shadowColor: '#4B465C',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

// ─── Stat card definition ─────────────────────────────────────────────────────
interface StatDef {
  icon: string;
  label: string;
  getValue: (p: ReturnType<typeof useProgressStore.getState>['progress']) => string;
}

const STAT_DEFS: StatDef[] = [
  { icon: 'zap',          label: 'Day Streak', getValue: (p) => String(p.currentStreak) },
  { icon: 'check-circle', label: 'Completed',  getValue: (p) => String(p.completedQuizzes) },
  { icon: 'trending-up',  label: 'Avg Score',  getValue: (p) => `${p.averageScore}%` },
  { icon: 'award',        label: 'Badges',     getValue: (p) => String(p.badges?.length ?? 0) },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GreetingHeader({ userName, coins, level, badges }: { userName: string; coins: number; level: number; badges: number }) {
  const colors = useThemeColors();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <View style={[styles.headerCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder }, CARD_SHADOW]}>
      <View style={[styles.headerAccentStrip, { backgroundColor: colors.primary }]} />
      <View style={styles.headerInner}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greetingSubtext, { color: colors.textSecondary }]}>{greeting},</Text>
          <Text style={[styles.greetingName, { color: colors.text }]} numberOfLines={1}>{userName}</Text>
          <View style={styles.headerPillsRow}>
            <View style={[styles.hPill, { backgroundColor: colors.warning + '18' }]}>
              <Feather name="zap" size={11} color={colors.warning} />
              <Text style={[styles.hPillText, { color: colors.warning }]}>{coins.toLocaleString()}</Text>
            </View>
            <View style={[styles.hPill, { backgroundColor: colors.primaryLight }]}>
              <Feather name="shield" size={11} color={colors.primary} />
              <Text style={[styles.hPillText, { color: colors.primary }]}>Lv.{level}</Text>
            </View>
            <View style={[styles.hPill, { backgroundColor: colors.success + '18' }]}>
              <Feather name="award" size={11} color={colors.success} />
              <Text style={[styles.hPillText, { color: colors.success }]}>{badges} badges</Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/quizzes')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ctaButton, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
        >
          <Feather name="play" size={15} color="#FFFFFF" />
          <Text style={styles.ctaButtonText} numberOfLines={1}>Start</Text>
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
        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
        CARD_SHADOW,
        flex && { flex: 1 },
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
        <Feather name={def.icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.statTextCol}>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {def.getValue(progress)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {def.label}
        </Text>
      </View>
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
      <View style={[styles.sectionAccentBar, { backgroundColor: colors.primary }]} />
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
    { icon: 'award',    label: 'Leaderboard', color: colors.warning, route: '/leaderboard' as const },
    { icon: 'zap',      label: 'Challenge',   color: colors.primary, route: '/challenge' as const },
    { icon: 'calendar', label: 'Contests',    color: colors.error,   route: '/contest' as const },
  ];
  return (
    <View style={styles.quickRow}>
      {ACTIONS.map((a) => (
        <Pressable
          key={a.label}
          onPress={() => router.push(a.route as any)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.quickBtn,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.88 : 1, flexDirection: 'row', alignItems: 'center' },
          ]}
        >
          <View style={[styles.quickIconWrap, { backgroundColor: a.color + '18' }]}>
            <Feather name={a.icon as any} size={20} color={a.color} />
          </View>
          <Text style={[styles.quickBtnLabel, { color: colors.text }]} numberOfLines={1}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function LearnPreviewRow() {
  const colors = useThemeColors();
  const items  = PLAYLIST.slice(0, 5);
  return (
    <View style={styles.learnWrap}>
      {items.map((v) => (
        <Pressable
          key={v.id}
          onPress={() => router.push('/(tabs)/learn')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.learnCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.learnCardRow}>
            <View style={[styles.learnThumb, { backgroundColor: v.tagColor + '18' }]}>
              <Feather name="play" size={16} color={v.tagColor} />
            </View>
            <View style={styles.learnBody}>
              <Text style={[styles.learnTitle, { color: colors.text }]} numberOfLines={2}>{v.title}</Text>
              <Text style={[styles.learnMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {v.author} · {v.views} · {v.duration}
              </Text>
              <View style={[styles.learnTag, { backgroundColor: v.tagColor + '15' }]}>
                <Text style={[styles.learnTagText, { color: v.tagColor }]}>{v.tag}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function FlashcardStrip({ isWide }: { isWide?: boolean }) {
  const colors = useThemeColors();
  const [flipped, setFlipped]   = useState<Record<string, boolean>>({});
  const categories: FlashcardCategory[] = ['aws-practitioner', 'genai-practitioner'];

  return (
    <View style={[styles.flashContainer, isWide && styles.flashContainerRow]}>
      {categories.map((cat) => {
        const label = cat === 'aws-practitioner' ? 'AWS Practitioner' : 'GenAI Practitioner';
        const catColor = cat === 'aws-practitioner' ? colors.primary : colors.warning;
        const cards = flashcards.filter((c) => c.category === cat).slice(0, 5);
        return (
          <View key={cat} style={[styles.flashSection, isWide && styles.flashSectionWide]}>
            <Text style={[styles.flashSectionTitle, { color: colors.text }]}>{label}</Text>
            <View style={styles.flashColumn}>
              {cards.map((c) => {
                const isFlipped = flipped[c.id];
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setFlipped((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                    style={[
                      styles.flashCard,
                      { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <View style={[styles.flashBadge, { backgroundColor: catColor + '15' }]}>
                      <Text style={[styles.flashBadgeText, { color: catColor }]}>{c.tag ?? 'Core'}</Text>
                    </View>
                    <Text style={[styles.flashFront, { color: colors.text }]} numberOfLines={3}>
                      {isFlipped ? c.back : c.front}
                    </Text>
                    <Text style={[styles.flashHint, { color: colors.textSecondary }]}>
                      {isFlipped ? 'Tap to see term' : 'Tap to see answer'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
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
          <GreetingHeader userName={userName} coins={progress.coins ?? 0} level={progress.level ?? 1} badges={progress.badges?.length ?? 0} />

          {/* Stats row — 4 equal columns on desktop */}
          <View style={styles.statsRowDesktop}>
            {STAT_DEFS.map((def) => (
              <View key={def.label} style={styles.statColDesktop}>
                <StatCard def={def} progress={progress} />
              </View>
            ))}
          </View>

          {/* Quiz list */}
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

          <SectionHeader
            title="Learn Videos"
            onViewAll={() => router.push('/(tabs)/learn')}
          />
          <LearnPreviewRow />

          <SectionHeader title="Flashcards" />
          <FlashcardStrip isWide />
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
        <GreetingHeader userName={userName} coins={progress.coins ?? 0} level={progress.level ?? 1} badges={progress.badges?.length ?? 0} />

        {/* Quick actions */}
        <View style={styles.sectionGap}>
          <QuickActionsRow />
        </View>

        {/* Stats — 2×2 grid on mobile */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SectionHeader title="Your Stats" />
          <View style={styles.statsGrid}>
            {STAT_DEFS.map((def) => (
              <View key={def.label} style={styles.statGridCell}>
                <StatCard def={def} progress={progress} />
              </View>
            ))}
          </View>
        </View>

        {/* Daily Quiz Card */}
        <View style={[styles.sectionGap, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
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

        {/* Quizzes preview */}
        <View style={[styles.sectionGap, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SectionHeader
            title="Featured Quizzes"
            onViewAll={() => router.push('/(tabs)/quizzes')}
          />
          {quizzes.slice(0, 5).map((quiz) => (
            <Pressable
              key={quiz.id}
              onPress={() => router.push(`/quiz/${quiz.id}`)}
              style={({ pressed }) => [
                styles.featureCard,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name={quiz.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureBody}>
                <Text style={[styles.featureTitle, { color: colors.text }]} numberOfLines={1}>{quiz.title}</Text>
                <Text style={[styles.featureMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {quiz.questionCount} Q · {quiz.difficulty.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.featurePill, { backgroundColor: colors.primary }]}>
                <Text style={styles.featurePillText}>Start</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Learn preview */}
        <View style={[styles.sectionGap, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SectionHeader
            title="Learn Videos"
            onViewAll={() => router.push('/(tabs)/learn')}
          />
          <LearnPreviewRow />
        </View>

        {/* Flashcards */}
        <View style={[styles.sectionGap, styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <SectionHeader title="Flashcards" />
          <FlashcardStrip />
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 52,
  },

  // ── Header card ────────────────────────────────────────────────────────────
  headerCard: {
    borderRadius: 16,
    marginBottom: 22,
    overflow: 'hidden',
  },
  headerAccentStrip: {
    height: 4,
  },
  headerInner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
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

  // ── Header pills row ────────────────────────────────────────────────────────
  headerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  hPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hPillText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },

  // ── CTA button ─────────────────────────────────────────────────────────────
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 0,
  },
  quickBtn: {
    flexBasis: '30%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#4B465C',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: { fontFamily: F.semiBold, fontSize: 13, lineHeight: 16, textAlign: 'left', flex: 1 },

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
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextCol: { flex: 1, gap: 2 },
  statValue: { fontFamily: F.bold, fontSize: 18, lineHeight: 22 },
  statLabel: { fontFamily: F.medium, fontSize: 11, lineHeight: 15 },

  // ── Recent results strip ───────────────────────────────────────────────────
  recentCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginTop: 22,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },
  sectionAccentBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 18,
  },
  sectionViewAll: {
    fontFamily: F.semiBold,
    fontSize: 13,
  },

  // ── Learn preview ─────────────────────────────────────────────────────────
  learnWrap: {
    gap: 10,
  },
  learnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  learnCardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  learnThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  learnDuration: { fontFamily: F.medium, fontSize: 10 },
  learnBody: { flex: 1, gap: 4 },
  learnTitle: { fontFamily: F.semiBold, fontSize: 13, lineHeight: 18 },
  learnMeta: { fontFamily: F.regular, fontSize: 11 },
  learnTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  learnTagText: { fontFamily: F.semiBold, fontSize: 10, letterSpacing: 0.3 },

  // ── Featured list cards ───────────────────────────────────────────────────
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1, gap: 2 },
  featureTitle: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 19 },
  featureMeta: { fontFamily: F.regular, fontSize: 11 },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featurePillText: { fontFamily: F.semiBold, fontSize: 12, color: '#fff' },

  // ── Flashcards ────────────────────────────────────────────────────────────
  flashContainer: { gap: 12 },
  flashContainerRow: { flexDirection: 'row', gap: 16 },
  flashSection: { gap: 8 },
  flashSectionWide: { flex: 1 },
  flashSectionTitle: { fontFamily: F.bold, fontSize: 14 },
  flashColumn: { gap: 10 },
  flashCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  flashBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  flashBadgeText: { fontFamily: F.semiBold, fontSize: 10, letterSpacing: 0.3 },
  flashFront: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  flashHint: { fontFamily: F.regular, fontSize: 11 },

  // ── Daily Quiz card ────────────────────────────────────────────────────────
  dailyCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  dailyAccent: {
    height: 0,
  },

  // Daily card internals
  dailyBody: {
    padding: 18,
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
    borderRadius: 10,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
