/**
 * Bookmarks Review Screen
 * Loads all bookmarked questions and runs them through the standard quiz flow.
 * Delegates to the existing /quiz/[id] screen by building a temporary quiz ID.
 * Since the quiz player reads quizQuestions by ID, we inject a virtual quiz entry.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { quizQuestions, quizzes } from '@/data/quizzes';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { F } from '@/constants/Typography';
import type { Question, Quiz } from '@/types';

// ── Build a flat index of ALL questions across ALL quizzes ─────────────────
function buildIndex(): Map<string, { question: Question; quiz: Quiz }> {
  const index = new Map<string, { question: Question; quiz: Quiz }>();
  quizzes.forEach((quiz) => {
    const qs = quizQuestions[quiz.id] ?? [];
    qs.forEach((q) => index.set(q.id, { question: q, quiz }));
  });
  return index;
}

const ALL_QUESTIONS_INDEX = buildIndex();

type ReviewPhase = 'quiz' | 'results';

export default function BookmarksReviewScreen() {
  const colors        = useThemeColors();
  const t             = useTypography();
  const bookmarkedIds = useBookmarkStore((s) => s.bookmarkedIds);
  const resetQuiz     = useQuizStore((s) => s.reset);

  // Collect all bookmarked questions
  const questions = useMemo<Question[]>(() => {
    return bookmarkedIds
      .map((id) => ALL_QUESTIONS_INDEX.get(id)?.question)
      .filter((q): q is Question => Boolean(q));
  }, [bookmarkedIds]);

  const [phase, setPhase]             = useState<ReviewPhase>('quiz');
  const [idx, setIdx]                 = useState(0);
  const [selectedAnswer, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore]             = useState(0);

  useEffect(() => {
    resetQuiz();
    setIdx(0); setScore(0); setSelected(null); setShowFeedback(false); setPhase('quiz');
  }, [resetQuiz]);

  if (questions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => router.back()} style={s.headerBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>Bookmark Review</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.emptyWrap}>
          <Feather name="bookmark" size={48} color={colors.textSecondary} />
          <Text style={[s.emptyTitle, { color: colors.text }]}>No bookmarks to review</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Bookmark questions during a quiz first.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/quizzes' as never)}
            style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1, marginTop: 20 }]}
          >
            <Text style={[s.btnText, { color: colors.surface }]}>Browse Quizzes</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'results') {
    const pct    = Math.round((score / questions.length) * 100);
    const passed = pct >= 70;
    return (
      <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => router.back()} style={s.headerBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>Review Complete</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={s.resultsPad}>
          <View style={s.scoreWrap}>
            <View style={[s.scoreCircle, { borderColor: passed ? colors.success : colors.error, backgroundColor: (passed ? colors.success : colors.error) + '18' }]}>
              <Text style={[s.scorePct, { color: passed ? colors.success : colors.error }]}>{pct}%</Text>
              <Text style={[s.scoreLabel, { color: passed ? colors.success : colors.error }]}>{passed ? 'PASS' : 'RETRY'}</Text>
            </View>
            <Text style={[s.scoreHeading, { color: colors.text }]}>
              {passed ? 'Great recall!' : 'Keep reviewing'}
            </Text>
            <Text style={[s.scoreSub, { color: colors.textSecondary }]}>
              {score}/{questions.length} correct · Bookmarks review
            </Text>
          </View>

          <View style={s.actionRow}>
            <Pressable
              onPress={() => { setIdx(0); setScore(0); setSelected(null); setShowFeedback(false); setPhase('quiz'); }}
              style={({ pressed }) => [s.btn, { backgroundColor: colors.primaryLight, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text style={[s.btnText, { color: colors.primary }]}>Retry Review</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text style={[s.btnText, { color: colors.surface }]}>Done</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQ = questions[idx];
  const isLast   = idx === questions.length - 1;
  const entry    = ALL_QUESTIONS_INDEX.get(currentQ.id);

  const handleSelect = (optId: string) => {
    if (showFeedback) return;
    setSelected(optId);
  };

  const handleCheck = () => {
    if (!selectedAnswer) return;
    setShowFeedback(true);
    if (selectedAnswer === currentQ.correctOptionId) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setShowFeedback(false);
    if (isLast) { setPhase('results'); } else { setIdx((i) => i + 1); }
  };

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={s.headerBack} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text }]}>Bookmark Review</Text>
        <Text style={[s.headerCounter, { color: colors.textSecondary }]}>{idx + 1}/{questions.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={[s.progressWrap, { backgroundColor: colors.surfaceBorder }]}>
        <View style={[s.progressFill, { width: `${((idx + 1) / questions.length) * 100}%` as any, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.quizPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Quiz source label */}
        {entry && (
          <Text style={[s.sourceLabel, { color: colors.textSecondary }]}>
            From: {entry.quiz.title}
          </Text>
        )}

        {/* Question text */}
        <Text style={[s.questionText, { color: colors.text, fontSize: t.body + 1 }]}>
          {currentQ.text}
        </Text>

        {/* Options */}
        <View style={s.optionsWrap}>
          {currentQ.options.map((opt) => {
            const isSelected = selectedAnswer === opt.id;
            const isCorrect  = opt.id === currentQ.correctOptionId;
            let bg    = colors.surface;
            let border = colors.surfaceBorder;
            let textColor = colors.text;
            if (showFeedback) {
              if (isCorrect)         { bg = colors.success + '22'; border = colors.success; textColor = colors.success; }
              else if (isSelected)   { bg = colors.error + '18';   border = colors.error;   textColor = colors.error; }
            } else if (isSelected) {
              bg = colors.primaryLight; border = colors.primary; textColor = colors.primary;
            }
            return (
              <Pressable
                key={opt.id}
                onPress={() => handleSelect(opt.id)}
                disabled={showFeedback}
                style={[s.optionBtn, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={[s.optionText, { color: textColor }]}>{opt.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Feedback explanation */}
        {showFeedback && currentQ.explanation && (
          <View style={[s.explanation, { backgroundColor: selectedAnswer === currentQ.correctOptionId ? colors.success + '18' : colors.error + '10', borderColor: selectedAnswer === currentQ.correctOptionId ? colors.success + '44' : colors.error + '44' }]}>
            <Text style={[s.explanationText, { color: selectedAnswer === currentQ.correctOptionId ? colors.success : colors.error }]}>
              {selectedAnswer === currentQ.correctOptionId ? '✓ Correct! ' : '✗ Incorrect. '}
              {currentQ.explanation}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[s.bottom, { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder }]}>
        {showFeedback ? (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, flex: 1, opacity: pressed ? 0.88 : 1 }]}
            >
            <Text style={[s.btnText, { color: colors.surface }]}>{isLast ? 'See Results' : 'Next →'}</Text>
            </Pressable>
        ) : (
            <Pressable
              onPress={handleCheck}
              disabled={!selectedAnswer}
              style={({ pressed }) => [s.btn, { flex: 1, backgroundColor: selectedAnswer ? colors.primary : colors.surfaceBorder, opacity: pressed ? 0.88 : 1 }]}
            >
            <Text style={[s.btnText, { color: selectedAnswer ? colors.surface : colors.textSecondary }]}>Check Answer</Text>
            </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBack:    { padding: 4 },
  headerTitle:   { fontFamily: F.bold, fontSize: 18, flex: 1 },
  headerCounter: { fontFamily: F.semiBold, fontSize: 13 },

  progressWrap: { height: 4 },
  progressFill: { height: 4 },

  quizPad: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  sourceLabel: { fontFamily: F.medium, fontSize: 12, marginBottom: 10 },
  questionText: { fontFamily: F.semiBold, lineHeight: 26, marginBottom: 24 },

  optionsWrap: { gap: 10 },
  optionBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  optionText: { fontFamily: F.medium, fontSize: 14, lineHeight: 20 },

  explanation: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  explanationText: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },

  bottom: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  btnText: { fontFamily: F.bold, fontSize: 15 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: F.bold, fontSize: 18, textAlign: 'center' },
  emptySub: { fontFamily: F.regular, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  resultsPad: { padding: 20, gap: 20 },
  scoreWrap: { alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 10 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  scorePct: { fontFamily: F.bold, fontSize: 28 },
  scoreLabel: { fontFamily: F.semiBold, fontSize: 12, letterSpacing: 1, marginTop: -2 },
  scoreHeading: { fontFamily: F.bold, fontSize: 22 },
  scoreSub: { fontFamily: F.regular, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12 },
});
