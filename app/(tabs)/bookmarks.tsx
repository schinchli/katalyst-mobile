import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { F } from '@/constants/Typography';
import type { Question, Quiz } from '@/types';

// ─── Build a flat index of all questions keyed by question ID ─────────────────
type QuestionEntry = { question: Question; quiz: Quiz };

function buildQuestionIndex(): Record<string, QuestionEntry> {
  const index: Record<string, QuestionEntry> = {};
  quizzes.forEach((quiz) => {
    const qs = quizQuestions[quiz.id] ?? [];
    qs.forEach((q) => { index[q.id] = { question: q, quiz }; });
  });
  return index;
}

const QUESTION_INDEX = buildQuestionIndex();

// ─── Difficulty accent colors — resolved from theme ───────────────────────────
function getDiffColor(difficulty: string, colors: ReturnType<typeof useThemeColors>): string {
  switch (difficulty) {
    case 'beginner':     return colors.success;
    case 'intermediate': return colors.warning;
    case 'advanced':     return colors.error;
    default:             return colors.primary;
  }
}

// ─── Bookmark card ────────────────────────────────────────────────────────────
function BookmarkCard({
  entry,
  onRemove,
  onPress,
}: {
  entry: QuestionEntry;
  onRemove: () => void;
  onPress:  () => void;
}) {
  const colors = useThemeColors();
  const { question, quiz } = entry;
  const diffColor = getDiffColor(quiz.difficulty, colors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Accent left bar */}
      <View style={[styles.accentBar, { backgroundColor: diffColor }]} />

      <View style={styles.cardContent}>
        {/* Quiz info row */}
        <View style={styles.quizRow}>
          <View style={[styles.quizIconWrap, { backgroundColor: diffColor + '18' }]}>
            <Feather name={quiz.icon as any} size={13} color={diffColor} />
          </View>
          <Text style={[styles.quizName, { color: colors.textSecondary }]} numberOfLines={1}>
            {quiz.title}
          </Text>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '18' }]}>
            <Text style={[styles.diffBadgeText, { color: diffColor }]}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        {/* Question text */}
        <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={3}>
          {question.text}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to review →</Text>
          {/* Remove bookmark */}
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
            hitSlop={8}
            accessibilityRole="button"
            style={[styles.removeBtn, { backgroundColor: colors.error + '18' }]}
          >
            <Feather name="bookmark" size={14} color={colors.error} />
            <Text style={[styles.removeBtnText, { color: colors.error }]} numberOfLines={1}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
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
        style={({ pressed }) => [
          styles.emptyBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
        ]}
      >
        <Feather name="book-open" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Browse Quizzes</Text>
      </Pressable>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function BookmarksScreen() {
  const colors         = useThemeColors();
  const bookmarkedIds  = useBookmarkStore((s) => s.bookmarkedIds);
  const toggle         = useBookmarkStore((s) => s.toggle);
  const { isDesktop, contentContainerWeb } = useWebLayout();

  // Resolve bookmarks to entries (filter out deleted questions)
  const entries: QuestionEntry[] = bookmarkedIds
    .map((id) => QUESTION_INDEX[id])
    .filter(Boolean) as QuestionEntry[];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={isDesktop ? [] : ['top']}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, contentContainerWeb as any]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <View style={styles.pageHeader}>
          <Text style={[styles.title, { color: colors.text }]}>Bookmarks</Text>
          {entries.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>{entries.length}</Text>
            </View>
          )}
        </View>

        {entries.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          entries.map(({ question, quiz }) => (
            <BookmarkCard
              key={question.id}
              entry={{ question, quiz }}
              onRemove={() => toggle(question.id)}
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
  safeArea: { flex: 1 },
  scroll:   { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 52 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 26,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: F.bold,
    fontSize: 13,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 13,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accentBar: {
    width: 4,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    padding: 15,
    gap: 9,
  },

  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quizName: {
    fontFamily: F.medium,
    fontSize: 12,
    flex: 1,
  },
  diffBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    justifyContent: 'center',
  },
  diffBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },

  questionText: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 21,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tapHint: {
    fontFamily: F.semiBold,
    fontSize: 12,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  removeBtnText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    minHeight: 46,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontFamily: F.semiBold,
    color: '#fff',
    fontSize: 14,
  },
});
