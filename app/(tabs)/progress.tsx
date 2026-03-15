import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useProgressStore } from '@/stores/progressStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';
import { quizzes } from '@/data/quizzes';
import { resolveDailyQuiz } from '@/config/systemFeatures';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function isSameLocalDay(isoDate: string, reference = new Date()) {
  return new Date(isoDate).toDateString() === reference.toDateString();
}

export default function ProgressScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const progress = useProgressStore((s) => s.progress);
  const systemFeatures = useSystemFeatureStore((s) => s.config);
  const activeDay = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const streakLength = Math.max(0, Math.min(7, progress.currentStreak));
  const streakMessage = progress.currentStreak > 0
    ? 'Keep showing up today to protect your streak.'
    : 'Open the app daily to build your first streak.';
  const dailyQuiz = resolveDailyQuiz(systemFeatures, quizzes.filter((quiz) => quiz.enabled !== false));
  const dailyQuizResult = dailyQuiz
    ? progress.recentResults.find((result) => result.quizId === dailyQuiz.id && isSameLocalDay(result.completedAt))
    : undefined;
  const recentAttempts = progress.recentResults.slice(0, 3);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: t.screenTitle }]}>Growth</Text>

        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'bell',      title: 'Notifications', badge: '1', route: null },
            { icon: 'award',     title: 'Leaderboard',              route: '/leaderboard' as const },
            { icon: 'book-open', title: 'My library',               route: '/(tabs)/bookmarks' as const },
          ].map((item, index) => (
            <View key={item.title}>
              <Pressable onPress={() => item.route && router.push(item.route as any)} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.backgroundAlt }]}>
                  <Feather name={item.icon as any} size={18} color={colors.text} />
                </View>
                <Text style={[styles.menuTitle, { color: colors.text, fontSize: t.cardTitle }]}>{item.title}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
              {index < 2 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>{EXPERIENCE_COPY.progress.streakTitle}</Text>
          <Text style={[styles.panelHint, { color: colors.textSecondary, fontSize: t.caption }]}>{streakMessage}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.currentStreak} days</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{Math.max(0, 2 - Math.min(2, progress.currentStreak))} freezes</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Left</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {WEEK.map((label, index) => {
              const distance = (activeDay - index + 7) % 7;
              const active = distance < streakLength;
              return (
                <View key={`${label}-${index}`} style={styles.weekCell}>
                  <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <View style={[styles.weekBolt, { borderColor: active ? colors.warning : 'transparent' }]}>
                    <Feather name="zap" size={16} color={active ? colors.warning : colors.surfaceBorder} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {dailyQuiz ? (
            <View style={[styles.dailyQuizCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
              <View style={styles.dailyQuizRow}>
                <View>
                  <Text style={[styles.dailyQuizEyebrow, { color: colors.primary }]}>{systemFeatures.dailyQuizLabel}</Text>
                  <Text style={[styles.dailyQuizTitle, { color: colors.text }]}>{dailyQuiz.title}</Text>
                </View>
                <View style={[styles.dailyQuizStatus, { backgroundColor: dailyQuizResult ? colors.success + '18' : colors.warning + '18' }]}>
                  <Text style={[styles.dailyQuizStatusText, { color: dailyQuizResult ? colors.success : colors.warning }]}>
                    {dailyQuizResult ? `${Math.round((dailyQuizResult.score / Math.max(1, dailyQuizResult.totalQuestions)) * 100)}%` : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.dailyQuizSubtitle, { color: colors.textSecondary, fontSize: t.caption }]}>
                {dailyQuizResult ? 'Completed today. Reopen the daily quiz from Home to improve your result.' : 'Today\'s daily quiz is still available from Home.'}
              </Text>
              <Pressable
                onPress={() => router.push(`/quiz/${dailyQuiz.id}`)}
                style={[styles.dailyQuizCta, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
              >
                <Text style={styles.dailyQuizCtaText}>{dailyQuizResult ? 'Review Daily Quiz' : 'Open Daily Quiz'}</Text>
                <Feather name="arrow-right" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>{EXPERIENCE_COPY.progress.xpTitle}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.xp ?? 0}</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Last 30 days</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.averageScore}%</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Today</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={row} style={styles.chartRow}>
                <Text style={[styles.chartAxisLabel, { color: colors.textSecondary }]}>1</Text>
                <View style={[styles.chartLine, { borderColor: colors.surfaceBorder }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartFooter}>
            <Text style={[styles.chartFooterText, { color: colors.textSecondary }]}>09 February</Text>
            <Text style={[styles.chartFooterText, { color: colors.textSecondary }]}>Today</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Recent attempts</Text>
          {recentAttempts.length === 0 ? (
            <Text style={[styles.panelHint, { color: colors.textSecondary, fontSize: t.caption }]}>
              Your latest quiz attempts will appear here.
            </Text>
          ) : (
            <View style={styles.attemptList}>
              {recentAttempts.map((result) => {
                const quiz = quizzes.find((item) => item.id === result.quizId);
                const pct = Math.round((result.score / Math.max(1, result.totalQuestions)) * 100);
                const isDailyQuizAttempt = dailyQuiz?.id === result.quizId && isSameLocalDay(result.completedAt);
                return (
                  <View key={`${result.quizId}-${result.completedAt}`} style={[styles.attemptCard, { borderColor: colors.surfaceBorder, backgroundColor: colors.backgroundAlt }]}>
                    <View style={styles.attemptHeader}>
                      <View style={styles.attemptTitleWrap}>
                        <Text style={[styles.attemptTitle, { color: colors.text }]} numberOfLines={1}>
                          {quiz?.title ?? result.quizId}
                        </Text>
                        {isDailyQuizAttempt ? (
                          <View style={[styles.dailyAttemptBadge, { backgroundColor: colors.warning + '18' }]}>
                            <Text style={[styles.dailyAttemptBadgeText, { color: colors.warning }]}>{systemFeatures.dailyQuizLabel}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.attemptScore, { color: pct >= 70 ? colors.success : colors.error }]}>{pct}%</Text>
                    </View>
                    <Text style={[styles.attemptMeta, { color: colors.textSecondary }]}>
                      {result.score}/{result.totalQuestions} · {new Date(result.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  screenTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  menuCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontFamily: F.semiBold, fontSize: 15, flex: 1 },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 12 },
  divider: { height: 1, marginHorizontal: 14 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 12 },
  panelTitle: { fontFamily: F.bold, fontSize: 17 },
  panelHint: { fontFamily: F.medium, fontSize: 12, lineHeight: 18, marginTop: -4 },
  dailyQuizCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  dailyQuizRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dailyQuizEyebrow: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  dailyQuizTitle: { fontFamily: F.semiBold, fontSize: 15, marginTop: 4 },
  dailyQuizSubtitle: { fontFamily: F.regular, lineHeight: 18 },
  dailyQuizStatus: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  dailyQuizStatusText: { fontFamily: F.bold, fontSize: 11 },
  dailyQuizCta: {
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyQuizCtaText: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 12 },
  attemptList: { gap: 10 },
  attemptCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  attemptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  attemptTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  attemptTitle: { fontFamily: F.semiBold, fontSize: 14, flexShrink: 1 },
  attemptScore: { fontFamily: F.bold, fontSize: 14 },
  attemptMeta: { fontFamily: F.regular, fontSize: 12 },
  dailyAttemptBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  dailyAttemptBadgeText: { fontFamily: F.bold, fontSize: 9, textTransform: 'uppercase' },
  streakNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontFamily: F.bold, fontSize: 20 },
  subLabel: { fontFamily: F.regular, fontSize: 12, marginTop: 3 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: 6 },
  weekLabel: { fontFamily: F.medium, fontSize: 11 },
  weekBolt: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  chartArea: { gap: 12, marginTop: 2 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chartAxisLabel: { width: 12, fontFamily: F.regular, fontSize: 11 },
  chartLine: { flex: 1, borderBottomWidth: 1, borderStyle: 'dotted' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartFooterText: { fontFamily: F.regular, fontSize: 11 },
});
