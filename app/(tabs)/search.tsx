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
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { F } from '@/constants/Typography';
import type { Quiz, Question } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'search' | 'bookmarks';

interface QuestionHit {
  quizId: string;
  quizTitle: string;
  questionId: string;
  questionText: string;
}

type QuestionEntry = { question: Question; quiz: Quiz };

// ─── Difficulty accent colors ─────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  beginner:     '#28C76F',
  intermediate: '#FF9F43',
  advanced:     '#EA5455',
};

// ─── Build searchable question list ──────────────────────────────────────────
function buildQuestionList(): QuestionHit[] {
  const list: QuestionHit[] = [];
  quizzes.forEach((quiz) => {
    (quizQuestions[quiz.id] ?? []).forEach((q) => {
      list.push({ quizId: quiz.id, quizTitle: quiz.title, questionId: q.id, questionText: q.text });
    });
  });
  return list;
}

// ─── Build question index (for bookmarks) ────────────────────────────────────
function buildQuestionIndex(): Record<string, QuestionEntry> {
  const index: Record<string, QuestionEntry> = {};
  quizzes.forEach((quiz) => {
    (quizQuestions[quiz.id] ?? []).forEach((q) => { index[q.id] = { question: q, quiz }; });
  });
  return index;
}

const ALL_QUESTIONS   = buildQuestionList();
const QUESTION_INDEX  = buildQuestionIndex();

// ─── Search logic ─────────────────────────────────────────────────────────────
function searchAll(query: string): { quizHits: Quiz[]; questionHits: QuestionHit[] } {
  if (!query.trim()) return { quizHits: [], questionHits: [] };
  const q = query.toLowerCase();
  return {
    quizHits: quizzes.filter((qz) =>
      qz.title.toLowerCase().includes(q) ||
      qz.description.toLowerCase().includes(q) ||
      qz.category.toLowerCase().includes(q) ||
      (qz.examCode ?? '').toLowerCase().includes(q),
    ),
    questionHits: ALL_QUESTIONS.filter((h) =>
      h.questionText.toLowerCase().includes(q),
    ).slice(0, 20),
  };
}

// ─── Highlight matched text ───────────────────────────────────────────────────
function highlight(text: string, query: string, color: string) {
  if (!query.trim()) return <Text>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text>{text}</Text>;
  return (
    <>
      <Text>{text.slice(0, idx)}</Text>
      <Text style={{ color, fontFamily: F.semiBold }}>{text.slice(idx, idx + query.length)}</Text>
      <Text>{text.slice(idx + query.length)}</Text>
    </>
  );
}

// ─── Quiz hit row ─────────────────────────────────────────────────────────────
function QuizHitRow({ quiz, query }: { quiz: Quiz; query: string }) {
  const colors     = useThemeColors();
  const diffColor  = DIFF_COLOR[quiz.difficulty] ?? '#7367F0';
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

// ─── Question hit row ─────────────────────────────────────────────────────────
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

// ─── Bookmark card ────────────────────────────────────────────────────────────
function BookmarkCard({ entry, onRemove }: { entry: QuestionEntry; onRemove: () => void }) {
  const colors    = useThemeColors();
  const { question, quiz } = entry;
  const diffColor = DIFF_COLOR[quiz.difficulty] ?? '#7367F0';
  return (
    <Pressable
      onPress={() => router.push(`/quiz/${quiz.id}`)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.bookmarkCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: diffColor }]} />
      <View style={styles.bmContent}>
        <View style={styles.bmQuizRow}>
          <View style={[styles.bmIconWrap, { backgroundColor: diffColor + '18' }]}>
            <Feather name={quiz.icon as any} size={13} color={diffColor} />
          </View>
          <Text style={[styles.bmQuizName, { color: colors.textSecondary }]} numberOfLines={1}>
            {quiz.title}
          </Text>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '18' }]}>
            <Text style={[styles.diffBadgeText, { color: diffColor }]}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.bmText, { color: colors.text }]} numberOfLines={3}>{question.text}</Text>
        <View style={styles.bmFooter}>
          <Text style={[styles.bmHint, { color: colors.primary }]}>Tap to review →</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
            hitSlop={8}
            accessibilityRole="button"
            style={[styles.removeBtn, { backgroundColor: '#EA545518' }]}
          >
            <Feather name="bookmark" size={13} color="#EA5455" />
            <Text style={styles.removeBtnText} numberOfLines={1}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const colors                                  = useThemeColors();
  const { isDesktop, contentContainerWeb }      = useWebLayout();
  const [activeTab, setActiveTab]               = useState<Tab>('search');
  const [query, setQuery]                       = useState('');
  const bookmarkedIds                           = useBookmarkStore((s) => s.bookmarkedIds);
  const toggle                                  = useBookmarkStore((s) => s.toggle);

  const { quizHits, questionHits } = searchAll(query);
  const hasResults   = quizHits.length > 0 || questionHits.length > 0;
  const totalResults = quizHits.length + questionHits.length;
  const clearSearch  = useCallback(() => setQuery(''), []);

  const bookmarkEntries: QuestionEntry[] = bookmarkedIds
    .map((id) => QUESTION_INDEX[id])
    .filter(Boolean) as QuestionEntry[];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={isDesktop ? [] : ['top']}
    >
      {/* ── Segmented control ── */}
      <View style={[styles.segmentWrap, { backgroundColor: colors.background, borderBottomColor: colors.surfaceBorder }]}>
        {(['search', 'bookmarks'] as Tab[]).map((t) => {
          const active = activeTab === t;
          const icon   = t === 'search' ? 'search' : 'bookmark';
          const label  = t === 'search' ? 'Search' : `Bookmarks${bookmarkEntries.length > 0 ? ` (${bookmarkEntries.length})` : ''}`;
          return (
            <Pressable
              key={t}
              onPress={() => setActiveTab(t)}
              accessibilityRole="button"
              style={[
                styles.segmentBtn,
                active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Feather name={icon} size={15} color={active ? colors.primary : colors.textSecondary} />
              <Text style={[styles.segmentText, { color: active ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── SEARCH TAB ── */}
      {activeTab === 'search' && (
        <>
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
            {query.length > 0 && hasResults && (
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </Text>
            )}

            {!hasResults && (
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={query.length > 0 ? 'search' : 'compass'} size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {query.length > 0 ? 'No results found' : 'Search quizzes & questions'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {query.length > 0
                    ? 'Try different keywords or browse all quizzes below.'
                    : 'Type a topic, quiz name, or question to find what you need.'}
                </Text>
              </View>
            )}

            {quizHits.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="book-open" size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Quizzes</Text>
                  <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{quizHits.length}</Text>
                </View>
                {quizHits.map((quiz) => <QuizHitRow key={quiz.id} quiz={quiz} query={query} />)}
              </>
            )}

            {questionHits.length > 0 && (
              <>
                <View style={[styles.sectionHeader, quizHits.length > 0 && styles.sectionHeaderSpaced]}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Feather name="help-circle" size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions</Text>
                  <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{questionHits.length}</Text>
                </View>
                {questionHits.map((hit) => <QuestionHitRow key={hit.questionId} hit={hit} query={query} />)}
              </>
            )}

            {!hasResults && query.length > 0 && (
              <>
                <Text style={[styles.browseLabel, { color: colors.text }]}>Browse All Quizzes</Text>
                {quizzes.map((quiz) => <QuizHitRow key={quiz.id} quiz={quiz} query="" />)}
              </>
            )}
          </ScrollView>
        </>
      )}

      {/* ── BOOKMARKS TAB ── */}
      {activeTab === 'bookmarks' && (
        <ScrollView
          contentContainerStyle={[styles.scroll, contentContainerWeb as any]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Bookmarks</Text>
            {bookmarkEntries.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{bookmarkEntries.length}</Text>
              </View>
            )}
          </View>

          {bookmarkEntries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name="bookmark" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookmarks yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Bookmark questions during a quiz to review them here.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/quizzes')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.emptyBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
              >
                <Feather name="book-open" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>Browse Quizzes</Text>
              </Pressable>
            </View>
          ) : (
            bookmarkEntries.map(({ question, quiz }) => (
              <BookmarkCard
                key={question.id}
                entry={{ question, quiz }}
                onRemove={() => toggle(question.id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // ── Segmented control ──
  segmentWrap: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 13,
    gap: 7,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentText: { fontFamily: F.semiBold, fontSize: 14 },

  // ── Search bar ──
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 52 },
  resultsCount: { fontFamily: F.medium, fontSize: 13, marginBottom: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionHeaderSpaced: { marginTop: 20 },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: F.bold, fontSize: 16, flex: 1 },
  sectionCount: { fontFamily: F.medium, fontSize: 13 },

  hitRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    padding: 13, marginBottom: 10, gap: 12,
  },
  hitIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  hitBody:  { flex: 1, gap: 3 },
  hitTitle: { fontFamily: F.medium, fontSize: 14, lineHeight: 20 },
  hitSub:   { fontFamily: F.regular, fontSize: 12, lineHeight: 16 },
  diffBadge: { minHeight: 24, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, flexShrink: 0, justifyContent: 'center' },
  diffBadgeText: { fontFamily: F.semiBold, fontSize: 11 },

  browseLabel: { fontFamily: F.bold, fontSize: 16, marginTop: 20, marginBottom: 10 },

  // ── Bookmarks ──
  pageHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  pageTitle:      { fontFamily: F.bold, fontSize: 22 },
  countBadge:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countBadgeText: { fontFamily: F.bold, fontSize: 13 },

  bookmarkCard: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    marginBottom: 13, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  accentBar:   { width: 4, flexShrink: 0 },
  bmContent:   { flex: 1, padding: 15, gap: 9 },
  bmQuizRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bmIconWrap:  { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bmQuizName:  { fontFamily: F.medium, fontSize: 12, flex: 1 },
  bmText:      { fontFamily: F.medium, fontSize: 14, lineHeight: 21 },
  bmFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  bmHint:      { fontFamily: F.semiBold, fontSize: 12 },
  removeBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  removeBtnText: { fontFamily: F.semiBold, fontSize: 11, color: '#EA5455' },

  // ── Empty state ──
  emptyWrap:    { alignItems: 'center', paddingTop: 48, paddingHorizontal: 28, gap: 10 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontFamily: F.bold, fontSize: 18, textAlign: 'center' },
  emptySubtitle:{ fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 46, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 14 },
});
