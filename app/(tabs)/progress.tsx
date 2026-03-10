import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { F } from '@/constants/Typography';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(score: number, total: number) {
  if (!total) return 0;
  return Math.round((score / total) * 100);
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function quizTitle(quizId: string) {
  return quizzes.find((q) => q.id === quizId)?.title ?? quizId;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, accent, colors,
}: {
  icon: string; label: string; value: string; accent: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: accent + '18' }]}>
        <Feather name={icon as any} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const colors    = useThemeColors();
  const userId    = useAuthStore((s) => s.user?.id);
  const step      = useAuthStore((s) => s.step);
  const progress  = useProgressStore((s) => s.progress);
  const initFromSupabase = useProgressStore((s) => s.initFromSupabase);

  // Load history from Supabase on first mount for real users
  useEffect(() => {
    if (step === 'authenticated' && userId) {
      initFromSupabase(userId).catch(() => {});
    }
  }, [step, userId, initFromSupabase]);

  const results   = progress.recentResults ?? [];
  const total     = quizzes.length;
  const completed = progress.completedQuizzes;
  const avgScore  = progress.averageScore;
  const bestScore = results.reduce((best, r) => Math.max(best, pct(r.score, r.totalQuestions)), 0);
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Progress</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Track your learning journey</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Stats grid ──────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard icon="percent"     label="Completion"  value={`${completionPct}%`} accent="#7367F0" colors={colors} />
          <StatCard icon="trending-up" label="Avg Score"   value={`${avgScore}%`}      accent="#28C76F" colors={colors} />
          <StatCard icon="award"       label="Best Score"  value={`${bestScore}%`}     accent="#FF9F43" colors={colors} />
          <StatCard icon="check-circle" label="Taken"      value={String(completed)}   accent="#00BAD1" colors={colors} />
        </View>

        {/* ── Overall completion bar ──────────────────────────────────── */}
        <View style={[styles.completionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionTitle, { color: colors.text }]}>Overall Completion</Text>
            <Text style={[styles.completionPct, { color: colors.primary }]}>{completionPct}%</Text>
          </View>
          <View style={[styles.trackBg, { backgroundColor: colors.surfaceBorder }]}>
            <View style={[styles.trackFill, { width: `${completionPct}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.completionSub, { color: colors.textSecondary }]}>
            {completed} of {total} quizzes completed
          </Text>
        </View>

        {/* ── Quiz history ────────────────────────────────────────────── */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quiz History</Text>

          {results.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Feather name="bar-chart-2" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No quizzes yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Complete your first quiz to see your progress here
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/quizzes')}
                style={[styles.browseBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.browseBtnText}>Browse Quizzes</Text>
              </Pressable>
            </View>
          ) : (
            results.map((r, idx) => {
              const p      = pct(r.score, r.totalQuestions);
              const passed = p >= 70;
              const accent = passed ? '#28C76F' : '#FF4C51';
              return (
                <View
                  key={`${r.quizId}-${idx}`}
                  style={[styles.resultRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  {/* Accent bar */}
                  <View style={[styles.resultAccent, { backgroundColor: accent }]} />

                  <View style={styles.resultBody}>
                    <View style={styles.resultTop}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                        {quizTitle(r.quizId)}
                      </Text>
                      <View style={[styles.passBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                        <Text style={[styles.passBadgeText, { color: accent }]}>
                          {passed ? 'PASS' : 'FAIL'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.resultMeta}>
                      <Text style={[styles.resultScore, { color: accent }]}>{p}%</Text>
                      <Text style={[styles.resultDetail, { color: colors.textSecondary }]}>
                        {r.score}/{r.totalQuestions} correct
                      </Text>
                      <Text style={[styles.resultDate, { color: colors.textSecondary }]}>
                        {fmtDate(r.completedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },

  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: F.bold,    fontSize: 22 },
  headerSub:   { fontFamily: F.regular, fontSize: 13, marginTop: 2 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '45%', padding: 14, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 6,
  },
  statIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: F.bold,    fontSize: 20 },
  statLabel: { fontFamily: F.regular, fontSize: 11 },

  // Completion
  completionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completionTitle:  { fontFamily: F.semiBold, fontSize: 14 },
  completionPct:    { fontFamily: F.bold,     fontSize: 14 },
  trackBg:   { height: 8,  borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  trackFill: { height: '100%' as any, borderRadius: 4 },
  completionSub: { fontFamily: F.regular, fontSize: 12, textAlign: 'center' },

  // History
  historySection: { gap: 10 },
  sectionTitle:   { fontFamily: F.bold, fontSize: 16, marginBottom: 4 },

  emptyCard: {
    padding: 32, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontFamily: F.semiBold, fontSize: 16, marginTop: 8 },
  emptySub:   { fontFamily: F.regular,  fontSize: 13, textAlign: 'center', lineHeight: 20 },
  browseBtn:  { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  browseBtnText: { fontFamily: F.semiBold, fontSize: 14, color: '#fff' },

  resultRow: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  resultAccent: { width: 4 },
  resultBody:   { flex: 1, padding: 14, gap: 6 },
  resultTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resultTitle:  { fontFamily: F.semiBold, fontSize: 14, flex: 1, marginRight: 8 },
  passBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, flexShrink: 0,
  },
  passBadgeText: { fontFamily: F.bold, fontSize: 10 },
  resultMeta:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultScore:  { fontFamily: F.bold,    fontSize: 16 },
  resultDetail: { fontFamily: F.regular, fontSize: 12 },
  resultDate:   { fontFamily: F.regular, fontSize: 11, marginLeft: 'auto' },
});
