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
import { F } from '@/constants/Typography';

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
    const diffColor = { beginner: colors.success, intermediate: colors.warning, advanced: colors.error }[quiz.difficulty] ?? colors.primary;

    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Back header */}
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={[s.backLabel, { color: colors.textSecondary }]}>Back</Text>
        </Pressable>

        <ScrollView contentContainerStyle={s.introPad} showsVerticalScrollIndicator={false}>

          {/* ── Course header card ── */}
          <View style={[s.courseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[s.courseStrip, { backgroundColor: colors.primary }]} />
            <View style={s.courseCardBody}>
              <View style={[s.courseIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name={quiz.icon as any} size={32} color={colors.primary} />
              </View>
              <View style={s.courseTextBlock}>
                <Text style={[s.courseTitle, { color: colors.text }]}>{quiz.title}</Text>
                <Text style={[s.courseDesc, { color: colors.textSecondary }]}>{quiz.description}</Text>
                <View style={[s.diffChip, { backgroundColor: diffColor + '18' }]}>
                  <Text style={[s.diffChipText, { color: diffColor }]}>
                    {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Metadata boxes ── */}
          <View style={s.metaRow}>
            {[
              { icon: 'bar-chart-2', label: 'Level',     val: quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1) },
              { icon: 'help-circle', label: 'Questions', val: String(questions.length) },
              { icon: 'clock',       label: 'Duration',  val: `${quiz.duration}m` },
            ].map((item) => (
              <View key={item.label} style={[s.metaBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={[s.metaIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[s.metaVal, { color: colors.text }]}>{item.val}</Text>
                <Text style={[s.metaLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* ── What's included ── */}
          <View style={[s.featuresCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.featuresHeader, { color: colors.text }]}>What's Included</Text>
            {[
              { icon: 'percent',      color: colors.warning, text: '50/50 Lifeline — eliminate 2 wrong answers' },
              { icon: 'skip-forward', color: colors.primary, text: '3 Question skips available' },
              { icon: 'clock',        color: colors.info,    text: '30 seconds per question timer' },
              { icon: 'eye',          color: colors.success, text: 'Instant feedback & explanations' },
            ].map((f) => (
              <View key={f.text} style={s.featureRow}>
                <View style={[s.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                  <Feather name={f.icon as any} size={15} color={f.color} />
                </View>
                <Text style={[s.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* ── Practice note ── */}
          <View style={[s.practiceNote, { backgroundColor: colors.primaryLight }]}>
            <Feather name="book-open" size={16} color={colors.primary} />
            <Text style={[s.practiceText, { color: colors.primary }]}>
              Practice Mode — correct answers shown after each choice
            </Text>
          </View>

          {/* ── Start button ── */}
          <Pressable
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
            style={({ pressed }) => [s.startBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          >
            <Feather name="play-circle" size={20} color="#fff" />
            <Text style={s.startBtnText}>Start Practice</Text>
          </Pressable>

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
  backLabel: { fontFamily: F.medium, fontSize: 15 },

  // Not found
  notFoundText: { fontFamily: F.semiBold, fontSize: 18, marginTop: 16 },

  // ── Intro ──
  introPad: { padding: 20, paddingTop: 8, paddingBottom: 40 },

  // Course header card (Vuexy card style)
  courseCard: {
    borderRadius: 12, borderWidth: 1, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  courseStrip: { height: 4 },
  courseCardBody: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16,
  },
  courseIconWrap: {
    width: 64, height: 64, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  courseTextBlock: { flex: 1 },
  courseTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 25, marginBottom: 6 },
  courseDesc:  { fontFamily: F.regular, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  diffChip: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  diffChipText: { fontFamily: F.semiBold, fontSize: 11 },

  // Metadata boxes
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metaBox: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  metaIconWrap: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  metaVal:   { fontFamily: F.bold,    fontSize: 14, marginBottom: 2, textAlign: 'center' },
  metaLabel: { fontFamily: F.regular, fontSize: 11, textAlign: 'center' },

  // What's included card
  featuresCard: {
    borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  featuresHeader: { fontFamily: F.semiBold, fontSize: 15, marginBottom: 12 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featureIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText:    { fontFamily: F.regular, fontSize: 13, lineHeight: 19, flex: 1 },

  // Practice note
  practiceNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, marginBottom: 16,
  },
  practiceText: { fontFamily: F.semiBold, fontSize: 13, flexShrink: 1 },

  // Start button (Vuexy primary button style)
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 52, borderRadius: 10,
    shadowColor: '#5E50EE', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  startBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 16 },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, paddingRight: 16,
  },
  resultsTitle: { flex: 1, textAlign: 'center', fontFamily: F.semiBold, fontSize: 17 },
  resultsPad:   { padding: 20, paddingTop: 16 },

  scoreCenter: { alignItems: 'center', marginBottom: 24 },
  scoreCircle: {
    width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, marginBottom: 14,
  },
  scorePct:      { fontFamily: F.bold, fontSize: 34 },
  scoreHeading:  { fontFamily: F.bold, fontSize: 22, marginBottom: 4 },
  scoreSubtitle: { fontFamily: F.regular, fontSize: 14 },

  statRow:        { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCardResult: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:        { fontFamily: F.bold, fontSize: 22, marginTop: 6, marginBottom: 2 },
  statLbl:        { fontFamily: F.medium, fontSize: 11 },

  breakdownTitle: { fontFamily: F.bold, fontSize: 16, marginBottom: 12 },
  breakdownCard:  { marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 },
  breakdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownDot:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  breakdownNum:   { fontFamily: F.semiBold, fontSize: 13 },
  breakdownQ:     { fontFamily: F.regular, flex: 1, fontSize: 14, lineHeight: 20 },

  resultsActions: { gap: 12, marginTop: 16 },

  // ── Quiz / Review header ──
  quizHeader:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  quizProgressWrap: { flex: 1 },
  quizCount:        { fontFamily: F.semiBold, fontSize: 13, minWidth: 36, textAlign: 'right' },

  // ── Timer ──
  timerRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  timerTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  timerFill:  { height: '100%', borderRadius: 3 },
  timerText:  { fontFamily: F.bold, fontSize: 13, minWidth: 30, textAlign: 'right' },

  // ── Lifeline bar ──
  lifelineRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 8, paddingHorizontal: 16, paddingBottom: 8,
  },
  lifelineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  lifelineBtnText:  { fontFamily: F.medium,   fontSize: 12 },
  lifelineSymbol:   { fontFamily: F.bold,     fontSize: 14 },
  runningScore:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  runningScoreText: { fontFamily: F.semiBold, fontSize: 12 },

  // ── Question area ──
  questionPad: { padding: 20, paddingBottom: 120 },

  // ── Bottom nav ──
  bottomNav: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderTopWidth: 1, paddingBottom: 32,
  },
  promptWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  promptText: { fontFamily: F.medium, fontSize: 14 },
});
