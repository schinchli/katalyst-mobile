import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestionView } from '@/components/quiz/QuestionView';
import { FlashCard } from '@/components/quiz/FlashCard';
import { AdBanner } from '@/components/ads/AdBanner';
import { BadgeCelebrationModal } from '@/components/ui/BadgeCelebrationModal';
import { PremiumGateModal } from '@/components/ui/PremiumGateModal';
import { DailyLimitModal } from '@/components/ui/DailyLimitModal';
import { useInterstitialAd, INTERSTITIAL_AD_INTERVAL } from '@/hooks/useInterstitialAd';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useRateLimitStore } from '@/stores/rateLimitStore';
import { useAuthStore } from '@/stores/authStore';
import { openCheckout, openCourseUnlock } from '@/services/razorpayService';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { CHALLENGE_SCORES } from '@/data/challenges';
import { F } from '@/constants/Typography';

const QUESTION_TIME = 30;

// DataCamp dark theme constants
const DC_BG       = '#050B18';   // page background
const DC_SURFACE  = '#111D35';   // card background
const DC_BORDER   = '#1E3055';   // card border
const DC_TEXT     = '#FFFFFF';   // primary text
const DC_MUTED    = 'rgba(255,255,255,0.5)';  // secondary text
const DC_SUCCESS  = '#28C76F';   // green
const DC_ERROR    = '#EF4444';   // red
const DC_TEAL     = '#3DD6C0';   // "Select the correct answer" label

type Phase = 'intro' | 'quiz' | 'review' | 'results' | 'flashcard';

export default function QuizScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const colors   = useThemeColors();
  const insets   = useSafeAreaInsets();

  const [phase, setPhase]               = useState<Phase>('intro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);
  const [pendingAnswerId, setPendingAnswerId] = useState<string | undefined>(undefined);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [showDailyLimit, setShowDailyLimit]   = useState(false);
  const [badgeReady, setBadgeReady]           = useState(false);

  const [flashIndex, setFlashIndex]   = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  const [showReport, setShowReport]         = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt  = useRef<number>(Date.now());

  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions]   = useState<string[]>([]);
  const [skipsLeft, setSkipsLeft]           = useState(3);

  const quiz         = quizzes.find((q) => q.id === id);
  const rawQuestions = quizQuestions[id ?? ''] ?? [];

  const questions = useMemo(
    () => rawQuestions.map((q) => ({ ...q, options: [...q.options].sort(() => Math.random() - 0.5) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  const currentQuestionIndex  = useQuizStore((s) => s.currentQuestionIndex);
  const selectedAnswers        = useQuizStore((s) => s.selectedAnswers);
  const selectAnswer           = useQuizStore((s) => s.selectAnswer);
  const nextQuestion           = useQuizStore((s) => s.nextQuestion);
  const previousQuestion       = useQuizStore((s) => s.previousQuestion);
  const goToQuestion           = useQuizStore((s) => s.goToQuestion);
  const reset                  = useQuizStore((s) => s.reset);

  const addResult          = useProgressStore((s) => s.addResult);
  const pendingCoins       = useProgressStore((s) => s.pendingCoins);
  const clearPendingCoins  = useProgressStore((s) => s.clearPendingCoins);
  const clearPendingBadges = useProgressStore((s) => s.clearPendingBadges);
  const { showAd }     = useInterstitialAd();
  const toggleBookmark = useBookmarkStore((s) => s.toggle);
  const isBookmarked   = useBookmarkStore((s) => s.isBookmarked);
  const user             = useAuthStore((s) => s.user);
  const upgradeToPremium = useAuthStore((s) => s.upgradeToPremium);
  const unlockCourse     = useAuthStore((s) => s.unlockCourse);
  const checkRateLimit   = useRateLimitStore((s) => s.checkAndConsume);

  const currentQuestion       = questions[currentQuestionIndex];
  const answeredCount         = Object.keys(selectedAnswers).length;
  const isLastQuestion        = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent    = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;
  const committedCurrentAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const selectedCurrentAnswer  = showFeedback
    ? committedCurrentAnswer
    : (pendingAnswerId ?? committedCurrentAnswer);
  const isCurrentCorrect = currentQuestion
    ? selectedCurrentAnswer === currentQuestion.correctOptionId
    : false;
  const runningScore = useMemo(
    () => questions.reduce(
      (score, q) => (selectedAnswers[q.id] === q.correctOptionId ? score + 1 : score), 0,
    ),
    [questions, selectedAnswers],
  );

  // ── Timer ─────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(QUESTION_TIME);
  }, [stopTimer]);

  const calculateScore = useCallback(() =>
    questions.reduce((s, q) => (selectedAnswers[q.id] === q.correctOptionId ? s + 1 : s), 0),
  [questions, selectedAnswers]);

  const finishQuiz = useCallback(() => {
    stopTimer();
    const score     = calculateScore();
    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    addResult({
      quizId: id ?? '', score,
      totalQuestions: questions.length,
      timeTaken,
      answers: selectedAnswers,
      completedAt: new Date().toISOString(),
    });
    setPhase('results');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, calculateScore, addResult, id, questions.length, selectedAnswers]);

  useEffect(() => {
    if (phase !== 'quiz' || showFeedback || !currentQuestion) { stopTimer(); return; }
    timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, currentQuestionIndex]);

  useEffect(() => {
    if (phase !== 'quiz' || showFeedback || timeLeft > 0) return;
    stopTimer();
    setFeedbackDismissed(false);
    setPendingAnswerId(undefined);
    if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, timeLeft, isLastQuestion]);

  useEffect(() => {
    resetTimer();
    setHiddenOptions([]);
    setPendingAnswerId(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (phase !== 'results') { setBadgeReady(false); return; }
    const t = setTimeout(() => setBadgeReady(true), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSelectAnswer = (optionId: string) => {
    if (showFeedback) return;
    setPendingAnswerId(optionId);
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || !pendingAnswerId || showFeedback) return;
    stopTimer();
    selectAnswer(currentQuestion.id, pendingAnswerId);
    setFeedbackDismissed(false);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setFeedbackDismissed(false);
    setShowFeedback(false);
    setPendingAnswerId(undefined);
    if (isLastQuestion) {
      finishQuiz();
    } else {
      if ((currentQuestionIndex + 1) % INTERSTITIAL_AD_INTERVAL === 0) showAd();
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    const prevIdx    = Math.max(0, currentQuestionIndex - 1);
    const prev       = questions[prevIdx];
    const prevAnswer = prev ? selectedAnswers[prev.id] : undefined;
    setFeedbackDismissed(false);
    setPendingAnswerId(undefined);
    setShowFeedback(Boolean(prevAnswer));
    previousQuestion();
  };

  const exitAndReset = (goLeaderboard = false) => {
    stopTimer();
    reset();
    clearPendingCoins();
    clearPendingBadges();
    setShowFeedback(false);
    setFeedbackDismissed(false);
    setPendingAnswerId(undefined);
    setFiftyFiftyUsed(false);
    setHiddenOptions([]);
    setSkipsLeft(3);
    setFlashIndex(0);
    setFlashFlipped(false);
    if (goLeaderboard) {
      router.replace('/leaderboard' as never);
    } else {
      router.back();
    }
  };

  const handleExit = () => {
    if (answeredCount === 0) { exitAndReset(); return; }
    Alert.alert('End Practice?', `You've answered ${answeredCount}/${questions.length} questions.`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'Leaderboard', onPress: () => exitAndReset(true) },
      { text: 'See Scoreboard', onPress: () => finishQuiz() },
      { text: 'Exit', style: 'destructive', onPress: () => exitAndReset() },
    ]);
  };

  const handleFiftyFifty = () => {
    if (fiftyFiftyUsed || showFeedback || !currentQuestion) return;
    const wrong = currentQuestion.options
      .filter((o) => o.id !== currentQuestion.correctOptionId)
      .map((o) => o.id);
    setHiddenOptions(wrong.sort(() => Math.random() - 0.5).slice(0, 2));
    setFiftyFiftyUsed(true);
  };

  const handleSkip = () => {
    if (skipsLeft <= 0 || showFeedback) return;
    setSkipsLeft((s) => s - 1);
    setShowFeedback(false);
    setFeedbackDismissed(false);
    setPendingAnswerId(undefined);
    if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
  };

  const timerColor    = timeLeft <= 10 ? DC_ERROR : DC_TEAL;
  const timerProgress = timeLeft / QUESTION_TIME;

  // ── Safe-area helpers ─────────────────────────────────────────────────────
  // Use an explicit spacer view instead of SafeAreaView for precise control
  const topSpacer    = insets.top;
  const bottomSpacer = Math.max(insets.bottom, 20);

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!quiz || questions.length === 0) {
    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={{ height: topSpacer, backgroundColor: colors.background }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="alert-circle" size={48} color={colors.textSecondary} />
          <Text style={[s.notFoundText, { color: colors.text }]}>Quiz not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const canAccess     = user?.subscription === 'premium' || (user?.unlockedCourses ?? []).includes(quiz.id);
    const isPremiumLocked = quiz.isPremium && !canAccess;

    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Safe-area top spacer */}
        <View style={{ height: topSpacer, backgroundColor: colors.background }} />

        {/* Modals */}
        <DailyLimitModal
          visible={showDailyLimit}
          onClose={() => setShowDailyLimit(false)}
          onUpgrade={() => { setShowDailyLimit(false); setShowPremiumGate(true); }}
        />
        <PremiumGateModal
          visible={showPremiumGate}
          quiz={quiz}
          onClose={() => setShowPremiumGate(false)}
          onUpgrade={async (type: 'subscription' | 'course') => {
            const startQuiz = () => {
              setShowPremiumGate(false);
              reset();
              setShowFeedback(false);
              setFiftyFiftyUsed(false);
              setHiddenOptions([]);
              setSkipsLeft(3);
              resetTimer();
              startedAt.current = Date.now();
              setPhase('quiz');
            };
            if (type === 'course') {
              const result = await openCourseUnlock(quiz.id, quiz.price ?? 149);
              if (result.success) { await unlockCourse(quiz.id); startQuiz(); }
              else Alert.alert('Payment Failed', result.error ?? 'Please try again.', [{ text: 'OK' }]);
            } else {
              const result = await openCheckout('annual');
              if (result.success) { await upgradeToPremium(); startQuiz(); }
              else Alert.alert('Payment Failed', result.error ?? 'Please try again.', [{ text: 'OK' }]);
            }
          }}
        />

        {/* Header */}
        <View style={[s.navBar, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => router.back()} style={s.navBack} hitSlop={10}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.navBackText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.text }]} numberOfLines={1}>Practice</Text>
          <View style={{ width: 72 }} />
        </View>

        <ScrollView contentContainerStyle={s.introPad} showsVerticalScrollIndicator={false}>
          {/* Course card */}
          <View style={[s.courseCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[s.courseStrip, { backgroundColor: colors.primary }]} />
            <View style={s.courseCardBody}>
              <View style={[s.courseIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Feather name={quiz.icon as any} size={34} color={colors.primary} />
              </View>
              <View style={s.courseTextBlock}>
                <View style={[s.diffChip, { backgroundColor: colors.primaryLight }]}>
                  <View style={[s.diffChipDot, { backgroundColor: colors.primary }]} />
                  <Text style={[s.diffChipText, { color: colors.primary }]}>
                    {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                  </Text>
                </View>
                <Text style={[s.courseTitle, { color: colors.text }]}>{quiz.title}</Text>
                <Text style={[s.courseDesc,  { color: colors.textSecondary }]}>{quiz.description}</Text>
              </View>
            </View>
          </View>

          {/* Meta boxes */}
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
                <Text style={[s.metaVal,   { color: colors.text }]}>{item.val}</Text>
                <Text style={[s.metaLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* What's included */}
          <View style={[s.featuresCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.featuresHeader, { color: colors.text }]}>What's Included</Text>
            {[
              { icon: 'eye',       color: colors.success,      text: 'Instant feedback after every answer' },
              { icon: 'book-open', color: colors.primary,      text: 'Full explanations for each question' },
              { icon: 'bookmark',  color: colors.info,         text: 'Bookmark questions for later review' },
              { icon: 'layers',    color: colors.gradientAccent, text: 'Flashcard mode to reinforce learning' },
            ].map((f) => (
              <View key={f.text} style={s.featureRow}>
                <View style={[s.featureIconWrap, { backgroundColor: f.color + '18' }]}>
                  <Feather name={f.icon as any} size={15} color={f.color} />
                </View>
                <Text style={[s.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={s.actionCol}>
            {isPremiumLocked ? (
              <Button title={`Unlock — Rs ${quiz.price ?? 149}`} onPress={() => setShowPremiumGate(true)} size="lg" style={{ width: '100%' }} />
            ) : (
              <Button
                title="Start Practice"
                size="lg"
                onPress={() => {
                  const ok = checkRateLimit();
                  if (!ok.ok) { setShowDailyLimit(true); return; }
                  reset();
                  setShowFeedback(false);
                  setFeedbackDismissed(false);
                  setPendingAnswerId(undefined);
                  setFiftyFiftyUsed(false);
                  setHiddenOptions([]);
                  setSkipsLeft(3);
                  resetTimer();
                  startedAt.current = Date.now();
                  setPhase('quiz');
                }}
                style={{ width: '100%' }}
              />
            )}
            <Button
              title="Review Flashcards"
              variant="outline"
              size="lg"
              onPress={() => { setFlashIndex(0); setFlashFlipped(false); setPhase('flashcard'); }}
              style={{ width: '100%' }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score      = calculateScore();
    const pct        = Math.round((score / questions.length) * 100);
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;

    const statCards = [
      { icon: 'check-circle', val: score,               label: 'Correct', color: DC_SUCCESS },
      { icon: 'x-circle',     val: answeredCount-score, label: 'Wrong',   color: DC_ERROR },
      { icon: 'minus-circle', val: unanswered,          label: 'Skipped', color: colors.textSecondary },
    ] as const;

    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={{ height: topSpacer, backgroundColor: colors.background }} />
        <BadgeCelebrationModal enabled={badgeReady} />

        {/* Header */}
        <View style={[s.navBar, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={exitAndReset} style={s.navBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.navBackText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.text }]}>Scoreboard</Text>
          <View style={{ width: 72 }} />
        </View>

        <ScrollView contentContainerStyle={[s.resultsPad, { paddingBottom: bottomSpacer + 20 }]} showsVerticalScrollIndicator={false}>
          {/* Score circle */}
          <View style={s.scoreCenter}>
            <View style={[s.scoreCircleOuter, { backgroundColor: (passed ? DC_SUCCESS : DC_ERROR) + '15' }]}>
              <View style={[s.scoreCircle, {
                backgroundColor: passed ? DC_SUCCESS + '22' : DC_ERROR + '22',
                borderColor:     passed ? DC_SUCCESS       : DC_ERROR,
                shadowColor:     passed ? DC_SUCCESS       : DC_ERROR,
              }]}>
                <Text style={[s.scorePct,   { color: passed ? DC_SUCCESS : DC_ERROR }]}>{pct}%</Text>
                <Text style={[s.scoreLabel, { color: passed ? DC_SUCCESS : DC_ERROR }]}>
                  {passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
            <Text style={[s.scoreHeading,  { color: colors.text }]}>
              {passed ? 'Great job!' : 'Keep Practicing'}
            </Text>
            <Text style={[s.scoreSubtitle, { color: colors.textSecondary }]}>
              {quiz.title} · {passed ? 'You passed!' : '70% needed to pass'}
            </Text>
          </View>

          <AdBanner style={{ marginBottom: 8 }} />

          {pendingCoins > 0 && (
            <View style={[s.rewardBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <View style={[s.rewardIconWrap, { backgroundColor: colors.warning + '28' }]}>
                <Feather name="zap" size={20} color={colors.warning} />
              </View>
              <View style={s.rewardTextBlock}>
                <Text style={[s.rewardTitle, { color: colors.warning }]}>+{pendingCoins} experience points earned</Text>
                <Text style={[s.rewardSub,   { color: colors.textSecondary }]}>Added to your progress total</Text>
              </View>
            </View>
          )}

          {pct >= (CHALLENGE_SCORES[quiz.id] ?? 70) && (
            <View style={[s.rewardBanner, { backgroundColor: DC_SUCCESS + '18', borderColor: DC_SUCCESS + '44' }]}>
              <View style={[s.rewardIconWrap, { backgroundColor: DC_SUCCESS + '28' }]}>
                <Feather name="award" size={20} color={DC_SUCCESS} />
              </View>
              <View style={s.rewardTextBlock}>
                <Text style={[s.rewardTitle, { color: DC_SUCCESS }]}>Challenge Beaten! 🏆</Text>
                <Text style={[s.rewardSub,   { color: colors.textSecondary }]}>You beat the CPU target score</Text>
              </View>
            </View>
          )}

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

          {/* Breakdown */}
          <Text style={[s.breakdownTitle, { color: colors.text }]}>Question Breakdown</Text>
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect  = userAnswer === q.correctOptionId;
            const skipped    = userAnswer === undefined;
            const dotBg      = skipped ? colors.surfaceBorder : isCorrect ? DC_SUCCESS + '22' : DC_ERROR + '22';
            const dotColor   = skipped ? colors.textSecondary : isCorrect ? DC_SUCCESS : DC_ERROR;
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

          <View style={s.resultsActions}>
            <Button title="Review All Answers" variant="outline" onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }} size="lg" />
            <Button title="Leaderboard" variant="secondary" onPress={() => exitAndReset(true)} size="lg" />
            <Button title="Done" onPress={() => exitAndReset()} size="lg" />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── FLASHCARD ─────────────────────────────────────────────────────────────
  if (phase === 'flashcard') {
    const flashQuestion = questions[flashIndex];
    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={{ height: topSpacer, backgroundColor: colors.background }} />

        {/* Header */}
        <View style={[s.navBar, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={exitAndReset} style={s.navBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.navBackText, { color: colors.textSecondary }]}>Exit</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.text }]}>Flashcards</Text>
          <View style={[s.flashBadge, { backgroundColor: colors.primaryLight }]}>
            <Feather name="layers" size={13} color={colors.primary} />
            <Text style={[s.flashBadgeText, { color: colors.primary }]}>Cards</Text>
          </View>
        </View>

        {/* Progress strip */}
        <View style={[s.flashProgressRow, { borderColor: colors.surfaceBorder }]}>
          <View style={{ flex: 1 }}>
            <ProgressBar progress={(flashIndex + 1) / questions.length} height={5} />
          </View>
          <Text style={[s.flashProgressText, { color: colors.textSecondary }]}>
            {flashIndex + 1} / {questions.length}
          </Text>
        </View>

        <FlashCard
          question={flashQuestion}
          isFlipped={flashFlipped}
          onFlip={() => setFlashFlipped((f) => !f)}
          cardIndex={flashIndex}
          total={questions.length}
        />

        {/* Nav */}
        <View style={[s.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder, paddingBottom: bottomSpacer }]}>
          <Button
            title="Previous"
            variant="outline"
            disabled={flashIndex === 0}
            onPress={() => { setFlashIndex((i) => i - 1); setFlashFlipped(false); }}
            size="lg"
            style={{ flex: 1 }}
          />
          {flashIndex < questions.length - 1 ? (
            <Button
              title="Next Card"
              variant="outline"
              onPress={() => { setFlashIndex((i) => i + 1); setFlashFlipped(false); }}
              size="lg"
              style={{ flex: 1 }}
            />
          ) : (
            <Button title="Done" variant="outline" onPress={exitAndReset} size="lg" style={{ flex: 1 }} />
          )}
        </View>
      </View>
    );
  }

  // ── QUIZ / REVIEW ─────────────────────────────────────────────────────────
  const isReview = phase === 'review';

  return (
    <View style={[s.flex, { backgroundColor: DC_BG }]}>
      {/* ── Notch / Dynamic Island spacer — explicit height, never SafeAreaView ── */}
      <View style={{ height: topSpacer, backgroundColor: DC_BG }} />

      {/* ── Header bar: [⚠️ or ←] [─── progress ───] [timer] [✕] ── */}
      <View style={s.quizTopBar}>
        {/* Left icon */}
        <Pressable
          onPress={isReview ? () => setPhase('results') : () => currentQuestion && setShowReport(true)}
          hitSlop={12}
          style={s.topBarBtn}
        >
          <Feather
            name={isReview ? 'arrow-left' : 'alert-triangle'}
            size={isReview ? 22 : 20}
            color={DC_MUTED}
          />
        </Pressable>

        {/* Progress bar */}
        <View style={s.topBarProgress}>
          <ProgressBar progress={(currentQuestionIndex + 1) / questions.length} height={5} />
        </View>

        {/* Timer — only during live quiz, not review */}
        {!isReview && (
          <View style={[s.timerPill, { borderColor: timerColor + '44', backgroundColor: timerColor + '18' }]}>
            <Feather name="clock" size={11} color={timerColor} />
            <Text style={[s.timerText, { color: timerColor }]}>{timeLeft}s</Text>
          </View>
        )}

        {/* Right X */}
        <Pressable
          onPress={isReview ? () => setPhase('results') : handleExit}
          hitSlop={12}
          style={s.topBarBtn}
        >
          <Feather name="x" size={22} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </View>

      {/* ── Question counter ── */}
      <View style={s.questionCounter}>
        <Text style={s.questionCounterText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        {!isReview && (
          <Text style={[s.scoreChip, { color: DC_SUCCESS }]}>
            ✓ {runningScore} correct
          </Text>
        )}
      </View>

      {/* ── Scrollable question + options ── */}
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.questionPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentQuestion && (
          <QuestionView
            question={currentQuestion}
            selectedOptionId={selectedCurrentAnswer}
            onSelectOption={handleSelectAnswer}
            showResult={showFeedback && hasAnsweredCurrent}
            resultTone={isCurrentCorrect ? 'correct' : 'incorrect'}
            hiddenOptionIds={hiddenOptions}
            onReport={!isReview ? () => setShowReport(true) : undefined}
          />
        )}
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={[s.quizBottomBar, { paddingBottom: bottomSpacer }]}>
        {isReview ? (
          /* Review: Previous + Next side by side */
          <View style={s.twoButtonRow}>
            <Button
              title="Previous"
              variant="outline"
              onPress={handlePrevious}
              size="lg"
              disabled={currentQuestionIndex === 0}
              style={{ flex: 1 }}
            />
            <Button
              title={isLastQuestion ? 'Done' : 'Next'}
              variant="outline"
              onPress={() => {
                if (isLastQuestion) { exitAndReset(); }
                else { setShowFeedback(true); nextQuestion(); }
              }}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        ) : showFeedback && hasAnsweredCurrent ? (
          /* After checking — Continue / See Results */
          <Pressable onPress={handleNext} style={s.continueBtn}>
            <LinearGradient
              colors={[colors.gradientFrom, colors.gradientTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.continueBtnText}>
              {isLastQuestion ? 'See Results' : 'Continue'}
            </Text>
            <Feather name="arrow-right" size={18} color="#04111F" />
          </Pressable>
        ) : (
          /* Before checking — Check button */
          <Pressable
            onPress={handleCheckAnswer}
            disabled={!pendingAnswerId}
            style={[s.checkBtn, !pendingAnswerId && s.checkBtnDisabled]}
          >
            <Text style={s.checkBtnText}>Check</Text>
          </Pressable>
        )}
      </View>

      {/* ── Report question modal ── */}
      <Modal
        visible={showReport}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReport(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowReport(false)}>
          <Pressable style={[s.reportSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {reportSubmitted ? (
              <View style={s.reportThanks}>
                <View style={[s.reportThanksIcon, { backgroundColor: DC_SUCCESS + '22' }]}>
                  <Feather name="check-circle" size={36} color={DC_SUCCESS} />
                </View>
                <Text style={[s.reportThanksTitle, { color: colors.text }]}>Thank you!</Text>
                <Text style={[s.reportThanksSub,   { color: colors.textSecondary }]}>
                  Your report has been submitted. We'll review it shortly.
                </Text>
                <Pressable
                  onPress={() => { setShowReport(false); setReportSubmitted(false); }}
                  style={[s.reportCloseBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={s.reportCloseBtnText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={s.reportHeader}>
                  <Text style={[s.reportTitle, { color: colors.text }]}>Report Question</Text>
                  <Pressable onPress={() => setShowReport(false)} hitSlop={8}>
                    <Feather name="x" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={[s.reportSub, { color: colors.textSecondary }]}>
                  Help us improve by reporting an issue.
                </Text>
                {['Incorrect answer marked', 'Unclear or ambiguous question', 'Outdated information', 'Other issue'].map((reason) => (
                  <Pressable
                    key={reason}
                    onPress={() => setReportSubmitted(true)}
                    style={({ pressed }) => [
                      s.reportOption,
                      { backgroundColor: pressed ? colors.primaryLight : colors.background, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Feather name="flag" size={14} color={colors.textSecondary} />
                    <Text style={[s.reportOptionText, { color: colors.text }]}>{reason}</Text>
                    <Feather name="chevron-right" size={14} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },
  notFoundText: { fontFamily: F.semiBold, fontSize: 18, marginTop: 16 },

  // ── Universal nav bar (intro / results / flashcard) ──
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  navBack:     { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  navBackText: { fontFamily: F.medium, fontSize: 15 },
  navTitle:    { fontFamily: F.bold, fontSize: 17, flex: 1, textAlign: 'center' },

  // ── Intro ──
  introPad: { padding: 20, paddingTop: 14, paddingBottom: 40 },

  courseCard:     { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  courseStrip:    { height: 5 },
  courseCardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 18 },
  courseIconWrap: { width: 68, height: 68, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  courseTextBlock: { flex: 1 },
  courseTitle:    { fontFamily: F.bold, fontSize: 18, lineHeight: 26, marginBottom: 5 },
  courseDesc:     { fontFamily: F.regular, fontSize: 13, lineHeight: 19 },
  diffChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  diffChipDot:    { width: 6, height: 6, borderRadius: 3 },
  diffChipText:   { fontFamily: F.semiBold, fontSize: 11 },

  metaRow:     { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metaBox:     { flex: 1, alignItems: 'center', minHeight: 112, padding: 14, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  metaIconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  metaVal:     { fontFamily: F.bold,    fontSize: 14, marginBottom: 2, textAlign: 'center' },
  metaLabel:   { fontFamily: F.regular, fontSize: 11, textAlign: 'center' },

  featuresCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  featuresHeader: { fontFamily: F.semiBold, fontSize: 15, marginBottom: 12 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featureIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText:    { fontFamily: F.regular, fontSize: 13, lineHeight: 19, flex: 1 },

  actionCol: { flexDirection: 'column', gap: 12 },

  // ── Results ──
  resultsPad:    { padding: 20, paddingTop: 16 },
  scoreCenter:   { alignItems: 'center', marginBottom: 24 },
  scoreCircleOuter: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  scoreCircle:   { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center', borderWidth: 4, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  scorePct:      { fontFamily: F.bold,     fontSize: 36 },
  scoreLabel:    { fontFamily: F.semiBold, fontSize: 11, letterSpacing: 1, marginTop: -2 },
  scoreHeading:  { fontFamily: F.bold,    fontSize: 22, marginBottom: 4 },
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

  resultsActions: { gap: 12, marginTop: 20 },
  rewardBanner:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  rewardIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rewardTextBlock: { flex: 1 },
  rewardTitle:    { fontFamily: F.bold,    fontSize: 14, marginBottom: 2 },
  rewardSub:      { fontFamily: F.regular, fontSize: 12 },

  // ── Flashcard ──
  flashBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 72, justifyContent: 'flex-end' },
  flashBadgeText:    { fontFamily: F.semiBold, fontSize: 12 },
  flashProgressRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  flashProgressText: { fontFamily: F.semiBold, fontSize: 12, minWidth: 44, textAlign: 'right' },

  // ── Quiz / Review — full-dark DataCamp theme ──
  // Header bar
  quizTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: DC_BG,
  },
  topBarBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarProgress: { flex: 1 },

  // Timer pill
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  timerText: { fontFamily: F.bold, fontSize: 12 },

  // Question counter row
  questionCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: DC_BG,
  },
  questionCounterText: { fontFamily: F.medium, fontSize: 13, color: DC_MUTED },
  scoreChip:           { fontFamily: F.semiBold, fontSize: 13 },

  // Question scroll area
  questionPad: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  // Bottom bar
  quizBottomBar: {
    backgroundColor: DC_BG,
    borderTopWidth: 1,
    borderTopColor: DC_BORDER,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Two-button row (review Previous/Next)
  twoButtonRow: { flexDirection: 'row', gap: 12 },

  // Continue button — explicit gradient wrapper (no variant="primary" opacity issues)
  continueBtn: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7367F0', // fallback if gradient fails
  },
  continueBtnText: { fontFamily: F.bold, fontSize: 16, color: '#04111F' },

  // Check button — solid green, always visible
  checkBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: DC_SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DC_SUCCESS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  checkBtnDisabled: { backgroundColor: DC_SURFACE, shadowOpacity: 0 },
  checkBtnText:     { fontFamily: F.bold, fontSize: 16, color: '#04111F' },

  // Report modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  reportSheet:  { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportTitle:  { fontFamily: F.bold,    fontSize: 17 },
  reportSub:    { fontFamily: F.regular, fontSize: 13, marginBottom: 16 },
  reportOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  reportOptionText: { fontFamily: F.medium, flex: 1, fontSize: 14 },
  reportThanks:     { alignItems: 'center', paddingVertical: 16, gap: 10 },
  reportThanksIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  reportThanksTitle: { fontFamily: F.bold,    fontSize: 20 },
  reportThanksSub:   { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reportCloseBtn:    { marginTop: 8, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  reportCloseBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 15 },

  // Bottom bar for flashcard
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
});
