import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { F } from '@/constants/Typography';
import type { Quiz, Question } from '@/types';

// ─── Difficulty accent colors ─────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  beginner:     '#28C76F',
  intermediate: '#FF9F43',
  advanced:     '#EA5455',
};

// ─── Build a flat searchable question list (id + text + quizId) ──────────────
interface QuestionHit {
  quizId: string;
  quizTitle: string;
  questionId: string;
  questionText: string;
}

function buildQuestionList(): QuestionHit[] {
  const list: QuestionHit[] = [];
  quizzes.forEach((quiz) => {
    (quizQuestions[quiz.id] ?? []).forEach((q) => {
      list.push({
        quizId: quiz.id,
        quizTitle: quiz.title,
        questionId: q.id,
        questionText: q.text,
      });
    });
  });
  return list;
}

const ALL_QUESTIONS = buildQuestionList();

// ─── Search logic ─────────────────────────────────────────────────────────────
function searchAll(query: string): { quizHits: Quiz[]; questionHits: QuestionHit[] } {
  if (!query.trim()) return { quizHits: [], questionHits: [] };
  const q = query.toLowerCase();
  const quizHits = quizzes.filter(
    (qz) =>
      qz.title.toLowerCase().includes(q) ||
      qz.description.toLowerCase().includes(q) ||
      qz.category.toLowerCase().includes(q),
  );
  const questionHits = ALL_QUESTIONS.filter((hit) =>
    hit.questionText.toLowerCase().includes(q),
  ).slice(0, 20);
  return { quizHits, questionHits };
}

// ─── Highlight matched text ───────────────────────────────────────────────────
function highlight(text: string, query: string, highlightColor: string) {
  if (!query.trim()) return <Text>{text}</Text>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <Text>{text}</Text>;
  return (
    <>
      <Text>{text.slice(0, idx)}</Text>
      <Text style={{ color: highlightColor, fontFamily: F.semiBold }}>
        {text.slice(idx, idx + query.length)}
      </Text>
      <Text>{text.slice(idx + query.length)}</Text>
    </>
  );
}

// ─── Quiz result row ──────────────────────────────────────────────────────────
function QuizHitRow({ quiz, query }: { quiz: Quiz; query: string }) {
  const colors = useThemeColors();
  const diffColor = DIFF_COLOR[quiz.difficulty] ?? '#7367F0';

  return (
    <Pressable
      onPress={() => router.push(`/quiz/${quiz.id}`)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.hitRow,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.hitIconWrap, { backgroundColor: diffColor + '18' }]}>
        <Feather name={quiz.icon as any} size={16} color={diffColor} />
      </View>
      <View style={styles.hitBody}>
        <Text style={[styles.hitTitle, { color: colors.text }]} numberOfLines={1}>
          {highlight(quiz.title, query, colors.primary)}
        </Text>
        <Text style={[styles.hitSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {highlight(quiz.description, query, colors.primary)}
        </Text>
      </View>
      <View style={[styles.diffBadge, { backgroundColor: diffColor + '18' }]}>
        <Text style={[styles.diffBadgeText, { color: diffColor }]}>
          {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Question result row ──────────────────────────────────────────────────────
function QuestionHitRow({ hit, query }: { hit: QuestionHit; query: string }) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => router.push(`/quiz/${hit.quizId}`)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.hitRow,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.hitIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name="help-circle" size={16} color={colors.primary} />
      </View>
      <View style={styles.hitBody}>
        <Text style={[styles.hitTitle, { color: colors.text }]} numberOfLines={2}>
          {highlight(hit.questionText, query, colors.primary)}
        </Text>
        <Text style={[styles.hitSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {hit.quizTitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

// ─── Empty / initial state ────────────────────────────────────────────────────
function EmptyState({ hasQuery, colors }: {
  hasQuery: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={hasQuery ? 'search' : 'compass'} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {hasQuery ? 'No results found' : 'Search quizzes & questions'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {hasQuery
          ? 'Try different keywords or browse all quizzes below.'
          : 'Type a topic, quiz name, or question to find what you need.'}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const colors = useThemeColors();
  const { isDesktop, contentContainerWeb } = useWebLayout();
  const [query, setQuery] = useState('');

  const { quizHits, questionHits } = searchAll(query);
  const hasResults = quizHits.length > 0 || questionHits.length > 0;
  const totalResults = quizHits.length + questionHits.length;

  const clearSearch = useCallback(() => setQuery(''), []);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={isDesktop ? [] : ['top']}
    >
      {/* Search bar */}
      <View style={[styles.searchBarWrap, { backgroundColor: colors.background, borderBottomColor: colors.surfaceBorder }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search quizzes and questions…"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text, fontFamily: F.regular }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearSearch} hitSlop={8} accessibilityRole="button">
              <Feather name="x-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, contentContainerWeb as any]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Results count */}
        {query.length > 0 && hasResults && (
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </Text>
        )}

        {/* No results / initial */}
        {(!hasResults) && <EmptyState hasQuery={query.length > 0} colors={colors} />}

        {/* Quiz results */}
        {quizHits.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="book-open" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quizzes</Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {quizHits.length}
              </Text>
            </View>
            {quizHits.map((quiz) => (
              <QuizHitRow key={quiz.id} quiz={quiz} query={query} />
            ))}
          </>
        )}

        {/* Question results */}
        {questionHits.length > 0 && (
          <>
            <View style={[styles.sectionHeader, quizHits.length > 0 && styles.sectionHeaderSpaced]}>
              <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="help-circle" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions</Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {questionHits.length}
              </Text>
            </View>
            {questionHits.map((hit) => (
              <QuestionHitRow key={hit.questionId} hit={hit} query={query} />
            ))}
          </>
        )}

        {/* Browse all quizzes (shown when no results or empty state) */}
        {!hasResults && query.length > 0 && (
          <>
            <Text style={[styles.browseLabel, { color: colors.text }]}>Browse All Quizzes</Text>
            {quizzes.map((quiz) => (
              <QuizHitRow key={quiz.id} quiz={quiz} query="" />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  scroll: {
    padding: 16,
    paddingBottom: 48,
  },

  resultsCount: {
    fontFamily: F.medium,
    fontSize: 13,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeaderSpaced: {
    marginTop: 20,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    flex: 1,
  },
  sectionCount: {
    fontFamily: F.medium,
    fontSize: 13,
  },

  hitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  hitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hitBody: {
    flex: 1,
    gap: 2,
  },
  hitTitle: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  hitSub: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  diffBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  browseLabel: {
    fontFamily: F.bold,
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
});
