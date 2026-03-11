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

// DataCamp-style dark constants (used in quiz/review phase)
const DC_BG      = '#050B18';
const DC_SURFACE = '#111D35';
const DC_BORDER  = '#1E3055';
const DC_SUCCESS = '#28C76F';
const DC_ERROR   = '#EF4444';

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
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(Date.now());

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

  const currentQuestionIndex   = useQuizStore((s) => s.currentQuestionIndex);
  const selectedAnswers         = useQuizStore((s) => s.selectedAnswers);
  const selectAnswer            = useQuizStore((s) => s.selectAnswer);
  const nextQuestion            = useQuizStore((s) => s.nextQuestion);
  const previousQuestion        = useQuizStore((s) => s.previousQuestion);
  const goToQuestion            = useQuizStore((s) => s.goToQuestion);
  const reset                   = useQuizStore((s) => s.reset);

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

  const currentQuestion        = questions[currentQuestionIndex];
  const answeredCount          = Object.keys(selectedAnswers).length;
  const isLastQuestion         = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent     = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;
  const committedCurrentAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const selectedCurrentAnswer  = showFeedback
    ? committedCurrentAnswer
    : (pendingAnswerId ?? committedCurrentAnswer);
  const isCurrentCorrect = currentQuestion
    ? selectedCurrentAnswer === currentQuestion.correctOptionId
    : false;

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

  // ── Safe-area helpers ─────────────────────────────────────────────────────
  const topSpacer    = insets.top;
  const bottomSpacer = Math.max(insets.bottom, 20);

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!quiz || questions.length === 0) {
    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={{ height: topSpacer }} />
        <View style={s.centeredFill}>
          <Feather name="alert-circle" size={48} color={colors.textSecondary} />
          <Text style={[s.notFoundText, { color: colors.text }]}>Quiz not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  // ── INTRO ─────────────────────────────────────────────────────────────────
  // DataCamp-inspired: vibrant gradient bg, centered icon/title, minimal text,
  // two action buttons pinned to the bottom.
  if (phase === 'intro') {
    const canAccess     = user?.subscription === 'premium' || (user?.unlockedCourses ?? []).includes(quiz.id);
    const isPremiumLocked = quiz.isPremium && !canAccess;

    return (
      <View style={s.flex}>
        {/* Gradient background fills entire screen */}
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={{ height: topSpacer }} />

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

        {/* ── Back arrow only — no header bar ── */}
        <Pressable onPress={() => router.back()} style={s.introBackArrow} hitSlop={12}>
          <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* ── Top label: dumbbell icon + "Practice Quiz" ── */}
        <View style={s.introTopLabel}>
          <Feather name="activity" size={22} color="rgba(255,255,255,0.9)" />
          <Text style={s.introTopLabelText}>Practice Quiz</Text>
        </View>

        {/* ── Center: icon circle + course info ── */}
        <View style={s.introCenterBlock}>
          <View style={s.introIconCircle}>
            <Feather name={quiz.icon as any} size={42} color="#FFFFFF" />
          </View>
          <Text style={s.introCourseLabel}>Quiz</Text>
          <Text style={s.introTitle}>{quiz.title}</Text>
          <View style={s.introChipsRow}>
            <View style={s.introChip}>
              <Text style={s.introChipText}>{questions.length} Questions</Text>
            </View>
            <View style={s.introChip}>
              <Text style={s.introChipText}>{quiz.duration} min</Text>
            </View>
          </View>
        </View>

        {/* ── Bottom buttons pinned ── */}
        <View style={[s.introBottomButtons, { paddingBottom: bottomSpacer + 8 }]}>
          {isPremiumLocked ? (
            <Pressable onPress={() => setShowPremiumGate(true)} style={s.introStartBtn}>
              <Text style={s.introStartBtnText}>Unlock — Rs {quiz.price ?? 149}</Text>
            </Pressable>
          ) : (
            <Pressable
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
              style={s.introStartBtn}
            >
              <Text style={s.introStartBtnText}>Start Practice</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { setFlashIndex(0); setFlashFlipped(false); setPhase('flashcard'); }}
            style={s.introFlashBtn}
          >
            <Text style={s.introFlashBtnText}>Review Flashcards</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score      = calculateScore();
    const pct        = Math.round((score / questions.length) * 100);
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;

    return (
      <View style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={{ height: topSpacer, backgroundColor: colors.background }} />
        <BadgeCelebrationModal enabled={badgeReady} />

        {/* Header */}
        <View style={[s.navBar, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => exitAndReset()} style={s.navBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.navBackText, { color: colors.textSecondary }]}>Back</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.text }]}>Scoreboard</Text>
          <View style={{ width: 72 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.resultsPad, { paddingBottom: bottomSpacer + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Score circle */}
          <View style={s.scoreCenter}>
            <View style={[s.scoreCircleOuter, { backgroundColor: (passed ? DC_SUCCESS : DC_ERROR) + '18' }]}>
              <View style={[s.scoreCircle, {
                backgroundColor: passed ? DC_SUCCESS + '20' : DC_ERROR + '20',
                borderColor:     passed ? DC_SUCCESS : DC_ERROR,
                shadowColor:     passed ? DC_SUCCESS : DC_ERROR,
              }]}>
                <Text style={[s.scorePct,   { color: passed ? DC_SUCCESS : DC_ERROR }]}>{pct}%</Text>
                <Text style={[s.scoreLabel, { color: passed ? DC_SUCCESS : DC_ERROR }]}>
                  {passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
            <Text style={[s.scoreHeading,  { color: colors.text }]}>{passed ? 'Great job!' : 'Keep Practicing'}</Text>
            <Text style={[s.scoreSubtitle, { color: colors.textSecondary }]}>
              {quiz.title} · {passed ? 'You passed!' : '70% needed to pass'}
            </Text>
          </View>

          <AdBanner style={{ marginBottom: 8 }} />

          {/* XP banner */}
          {pendingCoins > 0 && (
            <View style={[s.rewardBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <View style={[s.rewardIcon, { backgroundColor: colors.warning + '28' }]}>
                <Feather name="zap" size={20} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rewardTitle, { color: colors.warning }]}>+{pendingCoins} XP earned</Text>
                <Text style={[s.rewardSub,   { color: colors.textSecondary }]}>Added to your progress</Text>
              </View>
            </View>
          )}

          {/* Challenge beaten */}
          {pct >= (CHALLENGE_SCORES[quiz.id] ?? 70) && (
            <View style={[s.rewardBanner, { backgroundColor: DC_SUCCESS + '18', borderColor: DC_SUCCESS + '44' }]}>
              <View style={[s.rewardIcon, { backgroundColor: DC_SUCCESS + '28' }]}>
                <Feather name="award" size={20} color={DC_SUCCESS} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.rewardTitle, { color: DC_SUCCESS }]}>Challenge Beaten! 🏆</Text>
                <Text style={[s.rewardSub,   { color: colors.textSecondary }]}>You beat the target score</Text>
              </View>
            </View>
          )}

          {/* Stats row */}
          <View style={s.statRow}>
            {([
              { icon: 'check-circle', val: score,               label: 'Correct', color: DC_SUCCESS },
              { icon: 'x-circle',     val: answeredCount-score, label: 'Wrong',   color: DC_ERROR },
              { icon: 'minus-circle', val: unanswered,          label: 'Skipped', color: colors.textSecondary },
            ] as const).map((c) => (
              <Card key={c.label} style={s.statCard}>
                <Feather name={c.icon as any} size={20} color={c.color} />
                <Text style={[s.statVal, { color: c.color }]}>{c.val}</Text>
                <Text style={[s.statLbl, { color: colors.textSecondary }]}>{c.label}</Text>
              </Card>
            ))}
          </View>

          {/* Question breakdown */}
          <Text style={[s.breakdownTitle, { color: colors.text }]}>Question Breakdown</Text>
          {questions.map((q, idx) => {
            const ans     = selectedAnswers[q.id];
            const correct = ans === q.correctOptionId;
            const skipped = ans === undefined;
            return (
              <Pressable key={q.id} onPress={() => { goToQuestion(idx); setShowFeedback(true); setPhase('review'); }}>
                <Card style={s.breakdownCard}>
                  <View style={s.breakdownRow}>
                    <View style={[s.breakdownDot, {
                      backgroundColor: skipped ? colors.surfaceBorder : correct ? DC_SUCCESS + '22' : DC_ERROR + '22',
                    }]}>
                      {skipped
                        ? <Text style={[s.breakdownNum, { color: colors.textSecondary }]}>{idx + 1}</Text>
                        : <Feather name={correct ? 'check' : 'x'} size={14} color={correct ? DC_SUCCESS : DC_ERROR} />
                      }
                    </View>
                    <Text style={[s.breakdownQ, { color: colors.text }]} numberOfLines={2}>{q.text}</Text>
                    <Feather name="chevron-right" size={14} color={colors.textSecondary} />
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
        <View style={[s.navBar, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => exitAndReset()} style={s.navBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.navBackText, { color: colors.textSecondary }]}>Exit</Text>
          </Pressable>
          <Text style={[s.navTitle, { color: colors.text }]}>Flashcards</Text>
          <View style={[s.flashBadge, { backgroundColor: colors.primaryLight }]}>
            <Feather name="layers" size={13} color={colors.primary} />
            <Text style={[s.flashBadgeText, { color: colors.primary }]}>Cards</Text>
          </View>
        </View>
        <View style={[s.flashProgressRow, { borderBottomColor: colors.surfaceBorder }]}>
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
        <View style={[s.twoButtonBar, {
          backgroundColor: colors.background,
          borderTopColor: colors.surfaceBorder,
          paddingBottom: bottomSpacer,
        }]}>
          <Button title="Previous" variant="outline" disabled={flashIndex === 0}
            onPress={() => { setFlashIndex((i) => i - 1); setFlashFlipped(false); }} size="lg" style={{ flex: 1 }} />
          {flashIndex < questions.length - 1 ? (
            <Button title="Next Card" variant="outline"
              onPress={() => { setFlashIndex((i) => i + 1); setFlashFlipped(false); }} size="lg" style={{ flex: 1 }} />
          ) : (
            <Button title="Done" variant="outline" onPress={() => exitAndReset()} size="lg" style={{ flex: 1 }} />
          )}
        </View>
      </View>
    );
  }

  // ── QUIZ / REVIEW ─────────────────────────────────────────────────────────
  // Exact DataCamp reference layout:
  // [⚠️] [──progress──] [✕]
  // <scrollable question + options (flex space-between inside)>
  // [Check / Continue / Prev+Next] pinned bottom
  const isReview = phase === 'review';

  return (
    <View style={[s.flex, { backgroundColor: DC_BG }]}>
      {/* Notch / Dynamic Island spacer */}
      <View style={{ height: topSpacer, backgroundColor: DC_BG }} />

      {/* ── Header: [⚠️ or ←] [─progress─] [✕] ── */}
      <View style={s.quizHeader}>
        <Pressable
          onPress={isReview ? () => setPhase('results') : () => currentQuestion && setShowReport(true)}
          hitSlop={14}
          style={s.quizHeaderBtn}
        >
          <Feather
            name={isReview ? 'arrow-left' : 'alert-triangle'}
            size={isReview ? 22 : 20}
            color="rgba(255,255,255,0.5)"
          />
        </Pressable>

        <View style={s.quizHeaderProgress}>
          <ProgressBar progress={(currentQuestionIndex + 1) / questions.length} height={5} />
        </View>

        <Pressable
          onPress={isReview ? () => setPhase('results') : handleExit}
          hitSlop={14}
          style={s.quizHeaderBtn}
        >
          <Feather name="x" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* ── Question + options scroll area ──
           flexGrow:1 lets QuestionView (flex:1 + space-between) work correctly:
           question floats to top, options anchor to bottom of available space  ── */}
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.quizScroll}
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
          <View style={s.twoButtonRow}>
            <Button title="Previous" variant="outline" onPress={handlePrevious}
              disabled={currentQuestionIndex === 0} size="lg" style={{ flex: 1 }} />
            <Button
              title={isLastQuestion ? 'Done' : 'Next'}
              variant="outline"
              onPress={() => {
                if (isLastQuestion) { exitAndReset(); }
                else { setShowFeedback(true); nextQuestion(); }
              }}
              size="lg" style={{ flex: 1 }}
            />
          </View>
        ) : showFeedback && hasAnsweredCurrent ? (
          /* Continue / See Results — gradient button */
          <Pressable onPress={handleNext} style={s.continueBtn}>
            <LinearGradient
              colors={[colors.gradientFrom, colors.gradientTo]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
            />
            <Text style={s.continueBtnText}>{isLastQuestion ? 'See Results' : 'Continue'}</Text>
            <Feather name="arrow-right" size={18} color="#04111F" />
          </Pressable>
        ) : (
          /* Check — solid green, always opaque */
          <Pressable
            onPress={handleCheckAnswer}
            disabled={!pendingAnswerId}
            style={[s.checkBtn, !pendingAnswerId && s.checkBtnOff]}
          >
            <Text style={[s.checkBtnText, !pendingAnswerId && s.checkBtnTextOff]}>Check</Text>
          </Pressable>
        )}
      </View>

      {/* ── Report modal ── */}
      <Modal visible={showReport} transparent animationType="fade" onRequestClose={() => setShowReport(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowReport(false)}>
          <Pressable style={s.reportSheet} onPress={() => {}}>
            {reportSubmitted ? (
              <View style={s.reportThanks}>
                <View style={[s.reportThanksIcon, { backgroundColor: DC_SUCCESS + '22' }]}>
                  <Feather name="check-circle" size={36} color={DC_SUCCESS} />
                </View>
                <Text style={s.reportThanksTitle}>Thank you!</Text>
                <Text style={s.reportThanksSub}>Your report has been submitted.</Text>
                <Pressable
                  onPress={() => { setShowReport(false); setReportSubmitted(false); }}
                  style={s.reportCloseBtn}
                >
                  <Text style={s.reportCloseBtnText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={s.reportHeader}>
                  <Text style={s.reportTitle}>Report Question</Text>
                  <Pressable onPress={() => setShowReport(false)} hitSlop={8}>
                    <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                </View>
                <Text style={s.reportSub}>Help us improve by reporting an issue.</Text>
                {['Incorrect answer marked', 'Unclear or ambiguous', 'Outdated information', 'Other'].map((reason) => (
                  <Pressable
                    key={reason}
                    onPress={() => setReportSubmitted(true)}
                    style={({ pressed }) => [s.reportOption, pressed && { backgroundColor: DC_SURFACE }]}
                  >
                    <Feather name="flag" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={s.reportOptionText}>{reason}</Text>
                    <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.3)" />
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
  flex:        { flex: 1 },
  centeredFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontFamily: F.semiBold, fontSize: 18, marginTop: 16 },

  // ── Shared nav bar (results / flashcard) ──
  navBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 14, minHeight: 52 },
  navBack:    { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  navBackText: { fontFamily: F.medium, fontSize: 15 },
  navTitle:   { fontFamily: F.bold, fontSize: 17, flex: 1, textAlign: 'center' },

  // ── Intro: DataCamp-style practice screen ──
  introBackArrow: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTopLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  introTopLabelText: {
    fontFamily: F.bold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  introCenterBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  introIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  introCourseLabel: {
    fontFamily: F.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  introTitle: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  introChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  introChip: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
  },
  introChipText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  introBottomButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  introStartBtn: {
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introStartBtnText: {
    fontFamily: F.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  introFlashBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introFlashBtnText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Results ──
  resultsPad:    { padding: 20, paddingTop: 16 },
  scoreCenter:   { alignItems: 'center', marginBottom: 24 },
  scoreCircleOuter: { width: 148, height: 148, borderRadius: 74, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1 },
  scoreCircle:   { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center', borderWidth: 4, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  scorePct:      { fontFamily: F.bold,     fontSize: 36 },
  scoreLabel:    { fontFamily: F.semiBold, fontSize: 11, letterSpacing: 1, marginTop: -2 },
  scoreHeading:  { fontFamily: F.bold,     fontSize: 22, marginBottom: 4 },
  scoreSubtitle: { fontFamily: F.regular,  fontSize: 14 },

  statRow:  { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:  { fontFamily: F.bold,   fontSize: 22, marginTop: 6, marginBottom: 2 },
  statLbl:  { fontFamily: F.medium, fontSize: 11 },

  rewardBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  rewardIcon:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rewardTitle:  { fontFamily: F.bold,    fontSize: 14, marginBottom: 2 },
  rewardSub:    { fontFamily: F.regular, fontSize: 12 },

  breakdownTitle: { fontFamily: F.bold, fontSize: 16, marginBottom: 12 },
  breakdownCard:  { marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 },
  breakdownRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownDot:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  breakdownNum:   { fontFamily: F.semiBold, fontSize: 13 },
  breakdownQ:     { fontFamily: F.regular, flex: 1, fontSize: 14, lineHeight: 20 },
  resultsActions: { gap: 12, marginTop: 20 },

  // ── Flashcard ──
  flashBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 72, justifyContent: 'flex-end' },
  flashBadgeText:    { fontFamily: F.semiBold, fontSize: 12 },
  flashProgressRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  flashProgressText: { fontFamily: F.semiBold, fontSize: 12, minWidth: 44, textAlign: 'right' },

  // ── Quiz / Review ──
  // Header bar — matches reference: ⚠️ | progress | X
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: DC_BG,
  },
  quizHeaderBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quizHeaderProgress: { flex: 1 },

  // Question scroll — flexGrow:1 is the key that lets QuestionView's flex:1 work
  quizScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },

  // Bottom bar
  quizBottomBar: {
    backgroundColor: DC_BG,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Continue button (gradient)
  continueBtn: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#7367F0',
  },
  continueBtnText: { fontFamily: F.bold, fontSize: 16, color: '#FFFFFF', zIndex: 1 },

  // Check button (solid green — always crisp)
  checkBtn: {
    height: 56,
    borderRadius: 14,
    backgroundColor: DC_SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DC_SUCCESS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  checkBtnOff:     { backgroundColor: DC_SURFACE, shadowOpacity: 0, elevation: 0 },
  checkBtnText:    { fontFamily: F.bold, fontSize: 17, color: '#04111F' },
  checkBtnTextOff: { color: 'rgba(255,255,255,0.25)' },

  // Two-button row (Previous / Next in review)
  twoButtonRow: { flexDirection: 'row', gap: 12 },
  twoButtonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Report modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  reportSheet:       { backgroundColor: '#0D1B34', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  reportHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportTitle:       { fontFamily: F.bold,    fontSize: 17, color: '#FFFFFF' },
  reportSub:         { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
  reportOption:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10, marginBottom: 6 },
  reportOptionText:  { fontFamily: F.medium, flex: 1, fontSize: 14, color: '#FFFFFF' },
  reportThanks:      { alignItems: 'center', paddingVertical: 16, gap: 10 },
  reportThanksIcon:  { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  reportThanksTitle: { fontFamily: F.bold,    fontSize: 20, color: '#FFFFFF' },
  reportThanksSub:   { fontFamily: F.regular, fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  reportCloseBtn:    { marginTop: 8, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, backgroundColor: DC_SUCCESS },
  reportCloseBtnText: { fontFamily: F.semiBold, color: '#04111F', fontSize: 15 },
});
