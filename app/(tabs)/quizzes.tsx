import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory } from '@/types';
import { F } from '@/constants/Typography';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { AWS_CATEGORY_ICONS } from '@/constants/awsIcons';

const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  'clf-c02':           ['#FF9900', '#E8650A'],
  bedrock:             ['#7C3AED', '#4338CA'],
  genai:               ['#0EA5E9', '#0369A1'],
  security:            ['#EF4444', '#B91C1C'],
  mlops:               ['#10B981', '#047857'],
  compute:             ['#F59E0B', '#B45309'],
  networking:          ['#3B82F6', '#1D4ED8'],
  databases:           ['#8B5CF6', '#6D28D9'],
  'cost-optimization': ['#34D399', '#059669'],
};

const FILTERS: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'genai', label: 'AI' },
  { key: 'bedrock', label: 'Bedrock' },
  { key: 'security', label: 'Security' },
  { key: 'clf-c02', label: 'CLF-C02' },
];

export default function QuizzesScreen() {
  const colors = useThemeColors();
  const t = useTypography();
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
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: t.screenTitle }]}>Explore</Text>

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
                <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trackRow}>
          {quizzes.slice(0, 4).map((quiz, index) => (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.trackCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {(() => {
                const grad = CATEGORY_GRADIENT[quiz.category] ?? [colors.error, colors.gradientAccent];
                const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                return (
                  <LinearGradient colors={grad} style={styles.trackVisual}>
                    <View style={[styles.trackBadge, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                      <Text style={styles.trackBadgeText}>{quiz.isPremium ? 'Track' : 'Start'}</Text>
                    </View>
                    {catIcon ? (
                      <Image source={catIcon} style={styles.trackIcon} />
                    ) : (
                      <Feather name={quiz.icon as any} size={40} color="#F8FAFC" />
                    )}
                  </LinearGradient>
                );
              })()}
              <View style={styles.trackBody}>
                <View style={styles.trackProgressRow}>
                  <View style={[styles.trackProgressBar, { backgroundColor: colors.backgroundAlt }]}>
                    <View style={[styles.trackProgressFill, { backgroundColor: colors.primary, width: `${Math.min(100, (index + 2) * 16)}%` }]} />
                  </View>
                  <Text style={[styles.trackPercent, { color: colors.text }]}>{Math.min(100, (index + 2) * 16)}%</Text>
                </View>
                <Text style={[styles.trackTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{quiz.title}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: t.sectionTitle }]}>Available courses</Text>
          <Text style={[styles.sectionMeta, { color: colors.textSecondary }]}>{visibleCourses.length} total</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.courseRow}>
          {visibleCourses.map((quiz, index) => (
            <Pressable key={quiz.id} onPress={() => router.push(`/quiz/${quiz.id}`)} style={[styles.courseCard, platformConfig.layout.courseCardColumns === 1 ? styles.courseCardSingleWide : null, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {(() => {
                const grad = CATEGORY_GRADIENT[quiz.category] ?? [colors.primary, colors.gradientAccent];
                const catIcon = AWS_CATEGORY_ICONS[quiz.category];
                return (
                  <LinearGradient colors={grad} style={styles.courseImage}>
                    {catIcon ? (
                      <Image source={catIcon} style={styles.courseIcon} />
                    ) : (
                      <Feather name={quiz.icon as any} size={36} color="#F8FAFC" />
                    )}
                  </LinearGradient>
                );
              })()}
              <View style={styles.courseBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{quiz.category.toUpperCase()}</Text>
                  {quiz.isPremium ? <Feather name="lock" size={14} color={colors.textSecondary} /> : null}
                </View>
                <Text style={[styles.courseTitle, { color: colors.text, fontSize: t.body }]} numberOfLines={2}>{quiz.title}</Text>
                <Text style={[styles.courseSubtitle, { color: colors.textSecondary, fontSize: t.caption }]} numberOfLines={2}>{quiz.description}</Text>
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
  screenTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  searchShell: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontFamily: F.medium, fontSize: 14 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 11 },
  trackRow: { gap: 10, paddingRight: 16 },
  trackCard: { width: 144, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  trackVisual: { height: 100, justifyContent: 'center', alignItems: 'center' },
  trackIcon: { width: 38, height: 38 },
  trackBadge: { position: 'absolute', left: 8, top: 8, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  trackBadgeText: { color: '#fff', fontFamily: F.bold, fontSize: 10 },
  trackBody: { padding: 8, gap: 6 },
  trackProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trackProgressBar: { flex: 1, height: 6, borderRadius: 999, overflow: 'hidden' },
  trackProgressFill: { height: '100%', borderRadius: 999 },
  trackPercent: { fontFamily: F.semiBold, fontSize: 10 },
  trackTitle: { fontFamily: F.bold, fontSize: 12, lineHeight: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontFamily: F.bold, fontSize: 17 },
  sectionMeta: { fontFamily: F.medium, fontSize: 12 },
  courseRow: { gap: 10, paddingRight: 16 },
  courseCard: { width: 140, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  courseCardSingleWide: { width: 180 },
  courseImage: { height: 96, alignItems: 'center', justifyContent: 'center' },
  courseIcon: { width: 34, height: 34 },
  courseBody: { padding: 9, gap: 6, minHeight: 110 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6 },
  courseTitle: { fontFamily: F.bold, fontSize: 14, lineHeight: 20 },
  courseSubtitle: { fontFamily: F.regular, fontSize: 12, lineHeight: 17 },
  cardFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontFamily: F.medium, fontSize: 11 },
  footerDone: { fontFamily: F.bold, fontSize: 11 },
});
