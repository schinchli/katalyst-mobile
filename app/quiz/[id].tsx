import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestionView } from '@/components/quiz/QuestionView';
import { AdBanner } from '@/components/ads/AdBanner';
import { useInterstitialAd, INTERSTITIAL_AD_INTERVAL } from '@/hooks/useInterstitialAd';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { quizzes, quizQuestions } from '@/data/quizzes';

const QUESTION_TIME = 30;

// Tint backgrounds (10% opacity approximation)
const SUCCESS_TINT = '#D1F7E2';
const ERROR_TINT   = '#FFE5E6';

type Phase = 'intro' | 'quiz' | 'review' | 'results';

export default function QuizScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const colors   = useThemeColors();
  const [phase, setPhase]               = useState<Phase>('intro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [runningScore, setRunningScore] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lifelines
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions]   = useState<string[]>([]);
  const [skipsLeft, setSkipsLeft]           = useState(3);

  const quiz      = quizzes.find((q) => q.id === id);
  const questions = quizQuestions[id ?? ''] ?? [];

  const {
    currentQuestionIndex, selectedAnswers,
    selectAnswer, nextQuestion, previousQuestion, goToQuestion, reset,
  } = useQuizStore();

  const addResult      = useProgressStore((s) => s.addResult);
  const { showAd }     = useInterstitialAd();
  const toggleBookmark = useBookmarkStore((s) => s.toggle);
  const isBookmarked   = useBookmarkStore((s) => s.isBookmarked);

  const currentQuestion    = questions[currentQuestionIndex];
  const answeredCount      = Object.keys(selectedAnswers).length;
  const isLastQuestion     = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;

  // ── Timer ─────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
  }, [stopTimer]);

  useEffect(() => {
    if (phase !== 'quiz' || showFeedback || !currentQuestion) { stopTimer(); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setShowFeedback(false);
          if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
          return QUESTION_TIME;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, currentQuestionIndex]);

  useEffect(() => {
    resetTimer();
    setHiddenOptions([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const calculateScore = useCallback(() =>
    questions.reduce((s, q) => (selectedAnswers[q.id] === q.correctOptionId ? s + 1 : s), 0),
  [questions, selectedAnswers]);

  const handleSelectAnswer = (optionId: string) => {
    if (showFeedback) return;
    stopTimer();
    selectAnswer(currentQuestion.id, optionId);
    setShowFeedback(true);
    if (optionId === currentQuestion.correctOptionId) setRunningScore((s) => s + 1);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (isLastQuestion) {
      finishQuiz();
    } else {
      if ((currentQuestionIndex + 1) % INTERSTITIAL_AD_INTERVAL === 0) showAd();
      nextQuestion();
    }
  };

  const handlePrevious = () => { setShowFeedback(true); previousQuestion(); };

  const finishQuiz = () => {
    stopTimer();
    const score = calculateScore();
    addResult({
      quizId: id ?? '', score,
      totalQuestions: questions.length,
      timeTaken: 0,
      answers: selectedAnswers,
      completedAt: new Date().toISOString(),
    });
    setPhase('results');
  };

  const exitAndReset = () => {
    stopTimer();
    reset();
    setShowFeedback(false);
    setRunningScore(0);
    setFiftyFiftyUsed(false);
    setHiddenOptions([]);
    setSkipsLeft(3);
    router.back();
  };

  const handleExit = () => {
    if (answeredCount === 0) { exitAndReset(); return; }
    Alert.alert('End Practice?', `You've answered ${answeredCount}/${questions.length} questions.`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'See Scoreboard', onPress: () => finishQuiz() },
      { text: 'Exit', style: 'destructive', onPress: exitAndReset },
    ]);
  };

  const handleFiftyFifty = () => {
    if (fiftyFiftyUsed || showFeedback || !currentQuestion) return;
    const wrong  = currentQuestion.options
      .filter((o) => o.id !== currentQuestion.correctOptionId)
      .map((o) => o.id);
    setHiddenOptions(wrong.sort(() => Math.random() - 0.5).slice(0, 2));
    setFiftyFiftyUsed(true);
  };

  const handleSkip = () => {
    if (skipsLeft <= 0 || showFeedback) return;
    setSkipsLeft((s) => s - 1);
    setShowFeedback(false);
    if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
  };

  // ── Timer color ────────────────────────────────────────────────────────────
  const timerColor    = timeLeft <= 10 ? colors.error : timeLeft <= 20 ? colors.warning : colors.success;
  const timerProgress = timeLeft / QUESTION_TIME;

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="alert-circle" size={48} color={colors.textSecondary} />
        <Text style={[s.notFoundText, { color: colors.text }]}>Quiz not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Back header */}
        <Pressable
          onPress={() => router.back()}
          style={s.backBtn}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={[s.backLabel, { color: colors.textSecondary }]}>Back</Text>
        </Pressable>

        <ScrollView contentContainerStyle={s.introPad} showsVerticalScrollIndicator={false}>
          {/* Icon + title */}
          <View style={s.introCenter}>
            <View style={[s.introIconWrap, { backgroundColor: colors.primaryLight }]}>
              <Feather name={quiz.icon as any} size={36} color={colors.primary} />
            </View>
            <Text style={[s.introTitle, { color: colors.text }]}>{quiz.title}</Text>
            <Text style={[s.introDesc, { color: colors.textSecondary }]}>{quiz.description}</Text>
          </View>

          {/* Info chips */}
          <View style={s.infoRow}>
            {[
              { icon: 'help-circle', val: String(questions.length), label: 'Questions' },
              { icon: 'clock',       val: `${quiz.duration} min`,   label: 'Duration' },
              { icon: 'bar-chart',   val: quiz.difficulty,          label: 'Level' },
            ].map((chip) => (
              <View key={chip.label} style={s.infoChip}>
                <Feather name={chip.icon as any} size={22} color={colors.primary} />
                <Text style={[s.infoVal, { color: colors.text }]}>{chip.val}</Text>
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{chip.label}</Text>
              </View>
            ))}
          </View>

          {/* Lifelines strip */}
          <View style={[s.lifelineStrip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={s.lifelineItem}>
              <Text style={[s.lifelineSymbol, { color: colors.warning }]}>½</Text>
              <Text style={[s.lifelineText, { color: colors.textSecondary }]}>50/50 × 1</Text>
            </View>
            <View style={[s.lifelineDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={s.lifelineItem}>
              <Feather name="skip-forward" size={14} color={colors.textSecondary} />
              <Text style={[s.lifelineText, { color: colors.textSecondary }]}>Skip × 3</Text>
            </View>
            <View style={[s.lifelineDivider, { backgroundColor: colors.surfaceBorder }]} />
            <View style={s.lifelineItem}>
              <Feather name="clock" size={14} color={colors.textSecondary} />
              <Text style={[s.lifelineText, { color: colors.textSecondary }]}>30s / Q</Text>
            </View>
          </View>

          {/* Practice mode note */}
          <View style={[s.practiceNote, { backgroundColor: colors.primaryLight }]}>
            <Feather name="eye" size={16} color={colors.primary} />
            <Text style={[s.practiceText, { color: colors.primary }]}>
              Practice Mode — answers &amp; explanations shown instantly
            </Text>
          </View>

          <Button
            title="Start Practice"
            onPress={() => {
              reset();
              setShowFeedback(false);
              setRunningScore(0);
              setFiftyFiftyUsed(false);
              setHiddenOptions([]);
              setSkipsLeft(3);
              resetTimer();
              setPhase('quiz');
            }}
            size="lg"
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score      = calculateScore();
    const pct        = Math.round((score / questions.length) * 100);
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;

    const statCards = [
      { icon: 'check-circle', val: score,               label: 'Correct', color: colors.success },
      { icon: 'x-circle',     val: answeredCount-score, label: 'Wrong',   color: colors.error },
      { icon: 'minus-circle', val: unanswered,          label: 'Skipped', color: colors.textSecondary },
    ] as const;

    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.resultsHeader, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={exitAndReset} style={s.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.backLabel, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
          <Text style={[s.resultsTitle, { color: colors.text }]}>Scoreboard</Text>
          <View style={{ width: 72 }} />
        </View>

        <ScrollView contentContainerStyle={s.resultsPad} showsVerticalScrollIndicator={false}>
          {/* Score circle */}
          <View style={s.scoreCenter}>
            <View style={[
              s.scoreCircle,
              {
                backgroundColor: passed ? SUCCESS_TINT : ERROR_TINT,
                borderColor: passed ? colors.success : colors.error,
              },
            ]}>
              <Text style={[s.scorePct, { color: passed ? colors.success : colors.error }]}>{pct}%</Text>
            </View>
            <Text style={[s.scoreHeading, { color: colors.text }]}>
              {passed ? '🎉 Passed!' : 'Keep Practicing'}
            </Text>
            <Text style={[s.scoreSubtitle, { color: colors.textSecondary }]}>
              {quiz.title} · {passed ? 'Great work!' : '70% needed to pass'}
            </Text>
          </View>

          <AdBanner style={{ marginBottom: 8 }} />

          {/* Stat row */}
          <View style={s.statRow}>
            {statCards.map((c) => (
              <Card key={c.label} style={s.statCardResult}>
                <Feather name={c.icon as any} size={20} color={c.color} />
                <Text style={[s.statVal, { color: c.color }]}>{c.val}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>{c.label}</Text>
              </Card>
            ))}
          </View>

          {/* Question breakdown */}
          <Text style={[s.breakdownTitle, { color: colors.text }]}>Question Breakdown</Text>
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect  = userAnswer === q.correctOptionId;
            const skipped    = userAnswer === undefined;
            const dotBg      = skipped ? colors.surfaceBorder : isCorrect ? SUCCESS_TINT : ERROR_TINT;
            const dotColor   = skipped ? colors.textSecondary : isCorrect ? colors.success : colors.error;

            return (
              <Pressable
                key={q.id}
                onPress={() => { goToQuestion(idx); setShowFeedback(true); setPhase('review'); }}
              >
                <Card style={s.breakdownCard}>
                  <View style={s.breakdownRow}>
                    <View style={[s.breakdownDot, { backgroundColor: dotBg }]}>
                      {skipped
                        ? <Text style={[s.breakdownNum, { color: dotColor }]}>{idx + 1}</Text>
                        : <Feather name={isCorrect ? 'check' : 'x'} size={16} color={dotColor} />
                      }
                    </View>
                    <Text style={[s.breakdownQ, { color: colors.text }]} numberOfLines={2}>{q.text}</Text>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {/* Actions */}
          <View style={s.resultsActions}>
            <Button
              title="Review All Answers"
              variant="secondary"
              onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }}
              size="lg"
            />
            <Button title="Done" onPress={exitAndReset} size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── QUIZ / REVIEW ─────────────────────────────────────────────────────────
  const isReview   = phase === 'review';
  const bookmarked = currentQuestion ? isBookmarked(currentQuestion.id) : false;

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={s.quizHeader}>
        <Pressable
          onPress={isReview ? () => setPhase('results') : handleExit}
          hitSlop={8}
          style={isReview ? s.backBtn : undefined}
        >
          <Feather name={isReview ? 'arrow-left' : 'x'} size={isReview ? 22 : 24} color={colors.text} />
          {isReview && <Text style={[s.backLabel, { color: colors.textSecondary }]}>Results</Text>}
        </Pressable>

        <View style={s.quizProgressWrap}>
          <ProgressBar progress={(currentQuestionIndex + 1) / questions.length} height={6} />
        </View>

        <Text style={[s.quizCount, { color: colors.textSecondary }]}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>

        {currentQuestion && (
          <Pressable onPress={() => toggleBookmark(currentQuestion.id)} hitSlop={8}>
            <Feather
              name="bookmark"
              size={20}
              color={bookmarked ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Timer bar */}
      {!isReview && (
        <View style={s.timerRow}>
          <View style={[s.timerTrack, { backgroundColor: colors.surfaceBorder }]}>
            <View style={[s.timerFill, { width: `${timerProgress * 100}%` as any, backgroundColor: timerColor }]} />
          </View>
          <Text style={[s.timerText, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
      )}

      {/* Lifelines */}
      {!isReview && !showFeedback && (
        <View style={s.lifelineRow}>
          <Pressable
            onPress={handleFiftyFifty}
            disabled={fiftyFiftyUsed}
            style={[s.lifelineBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: fiftyFiftyUsed ? 0.35 : 1 }]}
          >
            <Text style={[s.lifelineSymbol, { color: fiftyFiftyUsed ? colors.textSecondary : colors.warning }]}>½</Text>
            <Text style={[s.lifelineBtnText, { color: fiftyFiftyUsed ? colors.textSecondary : colors.text }]}>50/50</Text>
          </Pressable>

          <Pressable
            onPress={handleSkip}
            disabled={skipsLeft <= 0}
            style={[s.lifelineBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: skipsLeft <= 0 ? 0.35 : 1 }]}
          >
            <Feather name="skip-forward" size={14} color={skipsLeft > 0 ? colors.primary : colors.textSecondary} />
            <Text style={[s.lifelineBtnText, { color: skipsLeft > 0 ? colors.text : colors.textSecondary }]}>
              Skip ({skipsLeft})
            </Text>
          </Pressable>

          <View style={s.runningScore}>
            <Feather name="check-circle" size={13} color={colors.success} />
            <Text style={[s.runningScoreText, { color: colors.success }]}>{runningScore}</Text>
          </View>
        </View>
      )}

      {/* Question */}
      <ScrollView contentContainerStyle={s.questionPad} showsVerticalScrollIndicator={false}>
        {currentQuestion && (
          <QuestionView
            question={currentQuestion}
            selectedOptionId={selectedAnswers[currentQuestion.id]}
            onSelectOption={handleSelectAnswer}
            showResult={showFeedback && hasAnsweredCurrent}
            hiddenOptionIds={hiddenOptions}
          />
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
        {currentQuestionIndex > 0 && (
          <Button title="Previous" variant="outline" onPress={handlePrevious} style={{ flex: 1 }} />
        )}
        {isReview ? (
          isLastQuestion
            ? <Button title="Done" onPress={exitAndReset} style={{ flex: 1 }} />
            : <Button title="Next" onPress={() => { setShowFeedback(true); nextQuestion(); }} style={{ flex: 1 }} />
        ) : showFeedback && hasAnsweredCurrent ? (
          <Button
            title={isLastQuestion ? 'See Results' : 'Next Question'}
            onPress={handleNext}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={s.promptWrap}>
            <Text style={[s.promptText, { color: colors.textSecondary }]}>Select an answer above</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },

  // Back button
  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
  backLabel: { fontSize: 15, fontWeight: '500' },

  // Not found
  notFoundText: { fontSize: 18, marginTop: 16 },

  // ── Intro ──
  introPad:    { padding: 24, paddingTop: 8 },
  introCenter: { alignItems: 'center', marginBottom: 24 },
  introIconWrap: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  introTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  introDesc:  { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },

  infoRow:   { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 20 },
  infoChip:  { alignItems: 'center', gap: 4 },
  infoVal:   { fontSize: 15, fontWeight: '600', marginTop: 4 },
  infoLabel: { fontSize: 12 },

  lifelineStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  lifelineItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lifelineDivider: { width: 1, height: 16 },
  lifelineSymbol:  { fontSize: 15, fontWeight: '700' },
  lifelineText:    { fontSize: 12 },

  practiceNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 12, marginBottom: 4,
  },
  practiceText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, paddingRight: 16,
  },
  resultsTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600' },
  resultsPad:   { padding: 24, paddingTop: 16 },

  scoreCenter: { alignItems: 'center', marginBottom: 24 },
  scoreCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, marginBottom: 16,
  },
  scorePct:     { fontSize: 34, fontWeight: '800' },
  scoreHeading: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  scoreSubtitle:{ fontSize: 14 },

  statRow:       { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCardResult: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal:        { fontSize: 22, fontWeight: '700', marginTop: 6, marginBottom: 2 },
  statLbl:        { fontSize: 11 },

  breakdownTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  breakdownCard:  { marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 },
  breakdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownDot:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  breakdownNum:   { fontSize: 13, fontWeight: '600' },
  breakdownQ:     { flex: 1, fontSize: 14, lineHeight: 20 },

  resultsActions: { gap: 12, marginTop: 16 },

  // ── Quiz / Review header ──
  quizHeader:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  quizProgressWrap:{ flex: 1 },
  quizCount:       { fontSize: 13, fontWeight: '600', minWidth: 36, textAlign: 'right' },

  // ── Timer ──
  timerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  timerTrack:{ flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2 },
  timerText: { fontSize: 13, fontWeight: '700', minWidth: 30, textAlign: 'right' },

  // ── Lifeline bar ──
  lifelineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 8, paddingHorizontal: 16, paddingBottom: 8,
  },
  lifelineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  lifelineBtnText: { fontSize: 12 },
  runningScore:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  runningScoreText:{ fontSize: 12, fontWeight: '600' },

  // ── Question area ──
  questionPad: { padding: 20, paddingBottom: 120 },

  // ── Bottom nav ──
  bottomNav: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderTopWidth: 1, paddingBottom: 32,
  },
  promptWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  promptText: { fontSize: 14 },
});
