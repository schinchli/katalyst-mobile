import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { quizzes } from '@/data/quizzes';
import type { Quiz, QuizCategory } from '@/types';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

// ─── Vuexy design tokens ──────────────────────────────────────────────────────
const T = {
  primary:      '#7367F0',
  success:      '#28C76F',
  warning:      '#FF9F43',
  error:        '#FF4C51',
  surface:      '#FFFFFF',
  bg:           '#F8F7FA',
  border:       '#DBDADE',
  text:         '#2F2B3D',
  textSecondary:'#444050',
  muted:        '#A5A3AE',
  primaryFaint: '#EBE9FD',
} as const;

// ─── Category config ──────────────────────────────────────────────────────────
const categories: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'bedrock',       label: 'Bedrock' },
  { key: 'rag',           label: 'RAG' },
  { key: 'agents',        label: 'Agents' },
  { key: 'guardrails',    label: 'Guardrails' },
  { key: 'prompt-eng',    label: 'Prompting' },
  { key: 'routing',       label: 'Routing' },
  { key: 'security',      label: 'Security' },
  { key: 'monitoring',    label: 'Monitoring' },
  { key: 'orchestration', label: 'Orchestration' },
  { key: 'evaluation',    label: 'Evaluation' },
];

// Icon bg tint per category
const categoryIconBg: Record<string, string> = {
  bedrock:       '#EBE9FD',
  rag:           '#E8FAF0',
  agents:        '#FFF3E8',
  guardrails:    '#FFEBEB',
  'prompt-eng':  '#EBE9FD',
  routing:       '#E8FAF0',
  security:      '#FFEBEB',
  monitoring:    '#FFF3E8',
  orchestration: '#EBE9FD',
  evaluation:    '#E8FAF0',
  general:       '#EBE9FD',
};

// Icon color per category (matches tint family)
const categoryIconColor: Record<string, string> = {
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

// Left accent bar color per difficulty
const difficultyAccent: Record<string, string> = {
  beginner:     T.success,
  intermediate: T.warning,
  advanced:     T.primary,
};

// Difficulty badge bg
const difficultyBadgeBg: Record<string, string> = {
  beginner:     '#E8FAF0',
  intermediate: '#FFF3E8',
  advanced:     '#EBE9FD',
};

// ─── QuizCard (full StyleSheet, no NativeWind) ───────────────────────────────
function QuizCard({ quiz, onPress }: { quiz: Quiz; onPress: () => void }) {
  const accentColor = difficultyAccent[quiz.difficulty] ?? T.primary;
  const iconBg      = categoryIconBg[quiz.category]    ?? T.primaryFaint;
  const iconColor   = categoryIconColor[quiz.category] ?? T.primary;
  const badgeBg     = difficultyBadgeBg[quiz.difficulty] ?? T.primaryFaint;
  const badgeColor  = accentColor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${quiz.title} quiz`}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Icon container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Feather name={quiz.icon as any} size={22} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {quiz.title}
          </Text>
          {quiz.isPremium && (
            <View style={styles.premiumBadge}>
              <Feather name="lock" size={10} color="#F59E0B" />
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {quiz.description}
        </Text>

        {/* Footer row */}
        <View style={styles.cardFooter}>
          {/* Difficulty badge */}
          <View style={[styles.diffBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.diffBadgeText, { color: badgeColor }]}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </Text>
          </View>

          {/* Question count */}
          <View style={styles.metaItem}>
            <Feather name="help-circle" size={12} color={T.muted} />
            <Text style={styles.metaText}>{quiz.questionCount} Qs</Text>
          </View>

          {/* Duration */}
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={T.muted} />
            <Text style={styles.metaText}>{quiz.duration} min</Text>
          </View>
        </View>
      </View>

      {/* Chevron */}
      <Feather name="chevron-right" size={18} color={T.muted} style={styles.chevron} />
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function QuizzesScreen() {
  const colors = useThemeColors();
  const { isDesktop, contentContainerWeb } = useWebLayout();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'all'>('all');

  const filtered =
    selectedCategory === 'all'
      ? quizzes
      : quizzes.filter((q) => q.category === selectedCategory);

  return (
    <SafeAreaView style={styles.safeArea} edges={isDesktop ? [] : ['top']}>
      {/* Header */}
      <View style={[styles.header, contentContainerWeb]}>
        <Text style={styles.screenTitle}>Quizzes</Text>
        <Text style={styles.screenSubtitle}>{quizzes.length} quizzes available</Text>
      </View>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
        style={styles.pillScroll}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={[
                styles.pill,
                active ? styles.pillActive : styles.pillInactive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Quiz list */}
      <ScrollView
        contentContainerStyle={[styles.listContent, contentContainerWeb]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="search" size={32} color={T.muted} />
            </View>
            <Text style={styles.emptyTitle}>No quizzes found</Text>
            <Text style={styles.emptySubtitle}>Try a different category filter</Text>
          </View>
        ) : (
          filtered.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onPress={() => router.push(`/quiz/${quiz.id}`)}
            />
          ))
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  screenTitle: {
    fontFamily: F.bold,
    fontSize: 26,
    color: T.text,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: T.muted,
    marginBottom: 12,
  },

  // Filter pills
  pillScroll: {
    flexGrow: 0,
    marginBottom: 4,
  },
  pillRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  pillInactive: {
    backgroundColor: T.surface,
    borderColor: T.border,
  },
  pillText: {
    fontFamily: F.semiBold,
    fontSize: 13,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: T.textSecondary,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: T.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  cardTitle: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    color: T.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  cardDesc: {
    fontFamily: F.regular,
    fontSize: 13,
    color: T.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: T.muted,
  },
  chevron: {
    marginRight: 12,
    flexShrink: 0,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.textSecondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: T.muted,
  },
});
