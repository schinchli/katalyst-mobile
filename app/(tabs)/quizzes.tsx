import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory } from '@/types';
import { F } from '@/constants/Typography';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

const FILTERS: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'genai', label: 'AI' },
  { key: 'bedrock', label: 'Bedrock' },
  { key: 'security', label: 'Security' },
  { key: 'clf-c02', label: 'CLF-C02' },
];

export default function QuizzesScreen() {
  const colors = useThemeColors();
  const progress = useProgressStore((s) => s.progress);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QuizCategory | 'all'>('all');
  const completedIds = new Set(progress.recentResults.map((item) => item.quizId));
  const platformConfig = usePlatformConfigStore((s) => s.config);

  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchFilter = filter === 'all' || quiz.category === filter;
      const matchQuery = normalized.length === 0 || quiz.title.toLowerCase().includes(normalized) || quiz.description.toLowerCase().includes(normalized);
      return matchFilter && matchQuery;
    });
  }, [filter, query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Explore</Text>

        <View style={[styles.searchShell, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search courses"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.filterChipText, { color: active ? '#04111F' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
          {quizzes.slice(0, 4).map((quiz, index) => (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <LinearGradient colors={index % 2 === 0 ? [colors.error, colors.gradientAccent] : [colors.warning, '#F59E0B']} style={styles.trackVisual}>
                <View style={[styles.trackBadge, { backgroundColor: '#04111F' }]}>
                  <Text style={styles.trackBadgeText}>{quiz.isPremium ? 'Track' : 'Start'}</Text>
                </View>
                <Feather name={quiz.icon as any} size={54} color="#F8FAFC" />
              </LinearGradient>
              <View style={styles.trackBody}>
                <View style={styles.trackProgressRow}>
                  <View style={[styles.trackProgressBar, { backgroundColor: colors.backgroundAlt }]}>
                    <View style={[styles.trackProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (index + 2) * 16)}%` }]} />
                  </View>
                  <Text style={[styles.trackPercent, { color: colors.text }]}>{Math.min(100, (index + 2) * 16)}%</Text>
                </View>
                <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={2}>{quiz.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available courses</Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>{visibleCourses.length} total</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>
          {visibleCourses.map((quiz, index) => (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.courseCard, platformConfig.layout.courseCardColumns === 1 ? styles.courseCardSingleWide : null, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <LinearGradient colors={index % 3 === 0 ? [colors.gradientAccent, colors.error] : index % 3 === 1 ? [colors.warning, '#FDE047'] : [colors.primary, colors.gradientAccent]} style={styles.courseImage}>
                <Feather name={quiz.icon as any} size={48} color="#F8FAFC" />
              </LinearGradient>
              <View style={styles.courseBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{quiz.category.toUpperCase()}</Text>
                  {quiz.isPremium && (
                    <View style={[styles.proPill, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.proPillText, { color: colors.primary }]}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>{quiz.title}</Text>
                <Text style={[styles.courseSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>{quiz.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    {quiz.questionCount} questions
                  </Text>
                  {completedIds.has(quiz.id) ? (
                    <Text style={[styles.footerDone, { color: colors.primary }]}>Completed</Text>
                  ) : (
                    <Text style={[styles.footerDone, { color: colors.text }]}>Open</Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 16 },
  screenTitle: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
  searchShell: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 15 },
  filterRow: { gap: 10, paddingRight: 16 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 13 },
  trackRow: { gap: 14, paddingRight: 16 },
  trackCard: { width: 224, borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  trackVisual: { height: 168, justifyContent: 'center', alignItems: 'center' },
  trackBadge: { position: 'absolute', left: 14, top: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  trackBadgeText: { color: '#fff', fontFamily: F.bold, fontSize: 14 },
  trackBody: { padding: 14, gap: 12 },
  trackProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackProgressBar: { flex: 1, height: 12, borderRadius: 999, overflow: 'hidden' },
  trackProgressFill: { height: '100%', borderRadius: 999 },
  trackPercent: { fontFamily: F.semiBold, fontSize: 13 },
  trackTitle: { fontFamily: F.bold, fontSize: 17, lineHeight: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontFamily: F.bold, fontSize: 20 },
  sectionMeta: { fontFamily: F.medium, fontSize: 13 },
  courseRow: { gap: 14, paddingRight: 16 },
  courseCard: { width: 220, borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  courseCardSingleWide: { width: 280 },
  courseImage: { height: 160, alignItems: 'center', justifyContent: 'center' },
  courseBody: { padding: 14, gap: 10, minHeight: 180 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaLabel: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.8 },
  proPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  proPillText: { fontFamily: F.bold, fontSize: 11 },
  courseTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 24 },
  courseSubtitle: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },
  cardFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontFamily: F.medium, fontSize: 12 },
  footerDone: { fontFamily: F.bold, fontSize: 12 },
});
