/**
 * Quiz screen — all 5 phases: intro · quiz · review · results · flashcard
 *
 * Design rules (must match rest of app):
 *  - Colors:  ALL from useThemeColors() — zero hardcoded hex
 *  - SafeArea: SafeAreaView edges={['top']} for intro/results/flashcard
 *              (consistent with home, leaderboard, quizzes tabs)
 *              Quiz/review phase uses useSafeAreaInsets for precise bottom inset only
 *  - Header:  identical to leaderboard — surface bg, surfaceBorder bottom, bold title
 *  - Cards:   <Card> component or manually: surface bg, surfaceBorder, radius 16
 *  - Buttons: <Button> component throughout
 *  - Fonts:   F.bold / F.semiBold / F.medium / F.regular (PublicSans)
 *  - Spacing: 16px horizontal, 18px section gap
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet, PanResponder } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
const MEDAL_GOLD    = '#FFD700';
const MEDAL_SILVER  = '#C0C0C0';
const MEDAL_BRONZE  = '#CD7F32';

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
  const [flashIndex, setFlashIndex]           = useState(0);
  const [flashFlipped, setFlashFlipped]       = useState(false);
  const [showReport, setShowReport]           = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [timeLeft, setTimeLeft]               = useState(QUESTION_TIME);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt    = useRef<number>(Date.now());
  // Flashcard swipe — ref tracks latest index to avoid stale closure in PanResponder
  const flashIdxRef  = useRef(0);
  useEffect(() => { flashIdxRef.current = flashIndex; }, [flashIndex]);
  const flashPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderRelease: (_, gs) => {
        const curr = flashIdxRef.current;
        if (gs.dx < -50 && curr < (quizQuestions[id ?? ''] ?? []).length - 1) {
          setFlashIndex(curr + 1); setFlashFlipped(false);
        } else if (gs.dx > 50 && curr > 0) {
          setFlashIndex(curr - 1); setFlashFlipped(false);
        }
      },
    })
  ).current;
  const [fiftyFiftyUsed, setFiftyFiftyUsed]   = useState(false);
  const [hiddenOptions, setHiddenOptions]     = useState<string[]>([]);
  const [skipsLeft, setSkipsLeft]             = useState(3);

  const quiz         = quizzes.find((q) => q.id === id);
  const rawQuestions = quizQuestions[id ?? ''] ?? [];
  const questions    = useMemo(
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
  const addResult               = useProgressStore((s) => s.addResult);
  const pendingCoins            = useProgressStore((s) => s.pendingCoins);
  const clearPendingCoins       = useProgressStore((s) => s.clearPendingCoins);
  const clearPendingBadges      = useProgressStore((s) => s.clearPendingBadges);
  const { showAd }              = useInterstitialAd();
  const toggleBookmark          = useBookmarkStore((s) => s.toggle);
  const isBookmarked            = useBookmarkStore((s) => s.isBookmarked);
  const user                    = useAuthStore((s) => s.user);
  const upgradeToPremium        = useAuthStore((s) => s.upgradeToPremium);
  const unlockCourse            = useAuthStore((s) => s.unlockCourse);
  const checkRateLimit          = useRateLimitStore((s) => s.checkAndConsume);

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

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const resetTimer = useCallback(() => { stopTimer(); setTimeLeft(QUESTION_TIME); }, [stopTimer]);
  const calculateScore = useCallback(() =>
    questions.reduce((s, q) => (selectedAnswers[q.id] === q.correctOptionId ? s + 1 : s), 0),
  [questions, selectedAnswers]);

  const finishQuiz = useCallback(() => {
    stopTimer();
    const score     = calculateScore();
    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    addResult({ quizId: id ?? '', score, totalQuestions: questions.length, timeTaken, answers: selectedAnswers, completedAt: new Date().toISOString() });
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
    stopTimer(); setPendingAnswerId(undefined);
    if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, timeLeft, isLastQuestion]);

  useEffect(() => { resetTimer(); setHiddenOptions([]); setPendingAnswerId(undefined); }, [currentQuestionIndex]); // eslint-disable-line

  useEffect(() => {
    if (phase !== 'results') { setBadgeReady(false); return; }
    const t = setTimeout(() => setBadgeReady(true), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectAnswer = (optionId: string) => { if (!showFeedback) setPendingAnswerId(optionId); };
  const handleCheckAnswer  = () => {
    if (!currentQuestion || !pendingAnswerId || showFeedback) return;
    stopTimer(); selectAnswer(currentQuestion.id, pendingAnswerId); setFeedbackDismissed(false); setShowFeedback(true);
  };
  const handleNext = () => {
    setFeedbackDismissed(false); setShowFeedback(false); setPendingAnswerId(undefined);
    if (isLastQuestion) { finishQuiz(); }
    else { if ((currentQuestionIndex + 1) % INTERSTITIAL_AD_INTERVAL === 0) showAd(); nextQuestion(); }
  };
  const handlePrevious = () => {
    const prev = questions[Math.max(0, currentQuestionIndex - 1)];
    setFeedbackDismissed(false); setPendingAnswerId(undefined);
    setShowFeedback(Boolean(prev && selectedAnswers[prev.id])); previousQuestion();
  };
  const exitAndReset = (goLeaderboard = false) => {
    stopTimer(); reset(); clearPendingCoins(); clearPendingBadges();
    setShowFeedback(false); setFeedbackDismissed(false); setPendingAnswerId(undefined);
    setFiftyFiftyUsed(false); setHiddenOptions([]); setSkipsLeft(3);
    setFlashIndex(0); setFlashFlipped(false);
    if (goLeaderboard) router.replace('/leaderboard' as never); else router.back();
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

  const timerUrgent   = timeLeft <= 10;
  const timerColor    = timerUrgent ? colors.error : colors.gradientAccent;
  const bottomSpacer  = Math.max(insets.bottom, 20);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
        <View style={s.centeredFill}>
          <Feather name="alert-circle" size={48} color={colors.textSecondary} />
          <Text style={[s.notFoundText, { color: colors.text }]}>Quiz not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTRO — bold gradient full-screen design (matches reference image style)
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    const canAccess       = user?.subscription === 'premium' || (user?.unlockedCourses ?? []).includes(quiz.id);
    const isPremiumLocked = quiz.isPremium && !canAccess;

    const handleStart = () => {
      const ok = checkRateLimit();
      if (!ok.ok) { setShowDailyLimit(true); return; }
      reset(); setShowFeedback(false); setFeedbackDismissed(false); setPendingAnswerId(undefined);
      setFiftyFiftyUsed(false); setHiddenOptions([]); setSkipsLeft(3);
      resetTimer(); startedAt.current = Date.now(); setPhase('quiz');
    };

    return (
      <View style={s.flex}>
        <DailyLimitModal visible={showDailyLimit} onClose={() => setShowDailyLimit(false)}
          onUpgrade={() => { setShowDailyLimit(false); setShowPremiumGate(true); }} />
        <PremiumGateModal visible={showPremiumGate} quiz={quiz} onClose={() => setShowPremiumGate(false)}
          onUpgrade={async (type: 'subscription' | 'course') => {
            const go = () => { setShowPremiumGate(false); reset(); setShowFeedback(false); setFiftyFiftyUsed(false); setHiddenOptions([]); setSkipsLeft(3); resetTimer(); startedAt.current = Date.now(); setPhase('quiz'); };
            if (type === 'course') {
              const r = await openCourseUnlock(quiz.id, quiz.price ?? 149);
              if (r.success) { await unlockCourse(quiz.id); go(); }
              else Alert.alert('Payment Failed', r.error ?? 'Please try again.');
            } else {
              const r = await openCheckout('annual');
              if (r.success) { await upgradeToPremium(); go(); }
              else Alert.alert('Payment Failed', r.error ?? 'Please try again.');
            }
          }} />

        {/* Full-screen vivid gradient */}
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }} end={{ x: 0.35, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView edges={['top', 'bottom']} style={s.flex}>

          {/* Back arrow — top left, no bar */}
          <View style={s.introHdr}>
            <Pressable onPress={() => router.back()} style={s.introBackBtn} hitSlop={8}>
              <Feather name="arrow-left" size={24} color="rgba(255,255,255,0.9)" />
            </Pressable>
          </View>

          {/* Top branding label */}
          <View style={s.introTopBrand}>
            <Feather name="zap" size={24} color="rgba(255,255,255,0.8)" />
            <Text style={s.introTopBrandText}>Practice Quiz</Text>
          </View>

          {/* ── Center block: icon + course info ── */}
          <View style={s.introCenterBlock}>
            <View style={s.introCourseCircle}>
              <Feather name={(quiz.icon ?? 'cpu') as any} size={44} color="#fff" />
            </View>
            <Text style={s.introCourseLabel}>Course</Text>
            <Text style={s.introCourseTitle} numberOfLines={3}>{quiz.title}</Text>
            <View style={s.introMetaChip}>
              <Text style={s.introMetaChipText}>
                {questions.length} Questions · {quiz.duration} min
              </Text>
            </View>
          </View>

          {/* ── Bottom CTA buttons ── */}
          <View style={[s.introFooter, { paddingBottom: bottomSpacer + 8 }]}>
            {isPremiumLocked ? (
              <Pressable onPress={() => setShowPremiumGate(true)} style={s.introMainBtn}>
                <Feather name="lock" size={16} color="#fff" />
                <Text style={s.introMainBtnText}>Unlock — Rs {quiz.price ?? 149}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleStart} style={s.introMainBtn}>
                <Text style={s.introMainBtnText}>Start Practice</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { setFlashIndex(0); setFlashFlipped(false); setPhase('flashcard'); }}
              style={s.introGhostBtn}
            >
              <Text style={s.introGhostBtnText}>Review Flashcards</Text>
            </Pressable>
          </View>

        </SafeAreaView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS — scoreboard
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'results') {
    const score      = calculateScore();
    const pct        = Math.round((score / questions.length) * 100);
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;
    const resultColor = passed ? colors.success : colors.error;

    return (
      <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
        <BadgeCelebrationModal enabled={badgeReady} />

        {/* Header */}
        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => exitAndReset()} style={s.headerBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>Scoreboard</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={[s.resultsPad, { paddingBottom: bottomSpacer + 20 }]} showsVerticalScrollIndicator={false}>

          {/* Score circle */}
          <View style={s.scoreCenter}>
            <View style={[s.scoreOuter, { backgroundColor: resultColor + '15', borderColor: resultColor + '30' }]}>
              <View style={[s.scoreInner, { backgroundColor: resultColor + '20', borderColor: resultColor, shadowColor: resultColor }]}>
                <Text style={[s.scorePct,   { color: resultColor }]}>{pct}%</Text>
                <Text style={[s.scorePass,  { color: resultColor }]}>{passed ? 'PASS' : 'FAIL'}</Text>
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
            <View style={[s.banner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <View style={[s.bannerIcon, { backgroundColor: colors.warning + '28' }]}>
                <Feather name="zap" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bannerTitle, { color: colors.warning }]}>+{pendingCoins} XP earned</Text>
                <Text style={[s.bannerSub,   { color: colors.textSecondary }]}>Added to your progress</Text>
              </View>
            </View>
          )}

          {/* Challenge beaten */}
          {pct >= (CHALLENGE_SCORES[quiz.id] ?? 70) && (
            <View style={[s.banner, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
              <View style={[s.bannerIcon, { backgroundColor: colors.success + '28' }]}>
                <Feather name="award" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bannerTitle, { color: colors.success }]}>Challenge Beaten! 🏆</Text>
                <Text style={[s.bannerSub,   { color: colors.textSecondary }]}>You beat the target score</Text>
              </View>
            </View>
          )}

          {/* Stats row */}
          <View style={s.statRow}>
            {([
              { icon: 'check-circle', val: score,               label: 'Correct', color: colors.success },
              { icon: 'x-circle',     val: answeredCount-score, label: 'Wrong',   color: colors.error },
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
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Question Breakdown</Text>
          </View>
          {questions.map((q, idx) => {
            const ans     = selectedAnswers[q.id];
            const correct = ans === q.correctOptionId;
            const skipped = ans === undefined;
            const dotColor = skipped ? colors.textSecondary : correct ? colors.success : colors.error;
            return (
              <Pressable key={q.id} onPress={() => { goToQuestion(idx); setShowFeedback(true); setPhase('review'); }}>
                <Card style={s.breakdownCard}>
                  <View style={s.breakdownRow}>
                    <View style={[s.breakdownDot, {
                      backgroundColor: skipped ? colors.surfaceBorder : (correct ? colors.success : colors.error) + '22',
                    }]}>
                      {skipped
                        ? <Text style={[s.breakdownNum, { color: dotColor }]}>{idx + 1}</Text>
                        : <Feather name={correct ? 'check' : 'x'} size={14} color={dotColor} />
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
            <Button title="Review All Answers" variant="outline" size="lg"
              onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }} />
            <Button title="Leaderboard" variant="secondary" size="lg"
              onPress={() => exitAndReset(true)} />
            <Button title="Done" size="lg" onPress={() => exitAndReset()} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FLASHCARD — swipe left/right to navigate, tap to flip
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'flashcard') {
    return (
      <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => exitAndReset()} style={s.headerBack} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>Flashcards</Text>
          <View style={[s.flashBadge, { backgroundColor: colors.primaryLight }]}>
            <Feather name="layers" size={12} color={colors.primary} />
            <Text style={[s.flashBadgeText, { color: colors.primary }]}>Cards</Text>
          </View>
        </View>

        {/* Progress strip */}
        <View style={[s.flashProgress, { borderBottomColor: colors.surfaceBorder }]}>
          <View style={{ flex: 1 }}>
            <ProgressBar progress={(flashIndex + 1) / questions.length} height={5} />
          </View>
          <Text style={[s.flashProgressText, { color: colors.textSecondary }]}>
            {flashIndex + 1} / {questions.length}
          </Text>
        </View>

        {/* Card area — PanResponder catches horizontal swipes, tap still flips */}
        <View style={s.flex} {...flashPan.panHandlers}>
          <FlashCard
            question={questions[flashIndex]}
            isFlipped={flashFlipped}
            onFlip={() => setFlashFlipped((f) => !f)}
            cardIndex={flashIndex}
            total={questions.length}
          />
        </View>

        {/* Navigation bar — Previous (left) | Next → (right, primary) */}
        <View style={[s.flashNav, {
          backgroundColor: colors.surface,
          borderTopColor:  colors.surfaceBorder,
          paddingBottom:   bottomSpacer,
        }]}>
          <Button
            title="← Prev"
            variant="outline"
            disabled={flashIndex === 0}
            onPress={() => { setFlashIndex((i) => i - 1); setFlashFlipped(false); }}
            size="lg"
            style={s.flashNavBtn}
          />
          {flashIndex < questions.length - 1 ? (
            <Button
              title="Next →"
              variant="primary"
              onPress={() => { setFlashIndex((i) => i + 1); setFlashFlipped(false); }}
              size="lg"
              style={s.flashNavBtn}
            />
          ) : (
            <Button
              title="Done"
              variant="primary"
              onPress={() => exitAndReset()}
              size="lg"
              style={s.flashNavBtn}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUIZ + REVIEW — DataCamp layout using app theme colors
  // Header: [⚠️ or ←] [──progress──] [✕]
  // Scroll: question floats top, options bottom (flexGrow:1)
  // Bottom: Check (success) → Continue (primary gradient) | review: Prev+Next
  // ══════════════════════════════════════════════════════════════════════════
  const isReview = phase === 'review';

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: colors.background }]}>

      {/* ── Quiz header ── */}
      <View style={[s.quizHeader, { backgroundColor: colors.background }]}>
        <Pressable
          onPress={isReview ? () => setPhase('results') : () => currentQuestion && setShowReport(true)}
          hitSlop={14}
          style={s.quizHeaderBtn}
        >
          <Feather
            name={isReview ? 'arrow-left' : 'alert-triangle'}
            size={isReview ? 22 : 20}
            color={colors.textSecondary}
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
          <Feather name="x" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Question + options — compact top-aligned layout ── */}
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
      <View style={[s.quizBottom, {
        backgroundColor: colors.surfaceElevated,
        borderTopColor:  colors.surfaceBorder,
        paddingBottom:   bottomSpacer,
      }]}>
        {/* All 3 states share the same symmetric two-button row */}
        <View style={s.twoButtonRow}>
          {/* Left button — always Previous */}
          <Button
            title="Previous"
            variant="outline"
            size="lg"
            style={{ flex: 1 }}
            disabled={currentQuestionIndex === 0}
            onPress={isReview ? handlePrevious : (showFeedback && hasAnsweredCurrent ? handlePrevious : handlePrevious)}
          />

          {/* Right button — context-sensitive primary action */}
          {isReview ? (
            <Button
              title={isLastQuestion ? 'Done' : 'Next'}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => {
                if (isLastQuestion) { exitAndReset(); }
                else { setShowFeedback(true); nextQuestion(); }
              }}
            />
          ) : showFeedback && hasAnsweredCurrent ? (
            <Button
              title={isLastQuestion ? 'See Results' : 'Next'}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              onPress={handleNext}
            />
          ) : (
            <Button
              title="Check"
              variant="success"
              size="lg"
              style={{ flex: 1 }}
              disabled={!pendingAnswerId}
              onPress={handleCheckAnswer}
            />
          )}
        </View>
      </View>

      {/* ── Report modal ── */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Pressable style={[s.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={() => setShowReport(false)}>
          <Pressable style={[s.reportSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {reportSubmitted ? (
              <View style={s.reportThanks}>
                <View style={[s.reportThanksIcon, { backgroundColor: colors.success + '22' }]}>
                  <Feather name="check-circle" size={36} color={colors.success} />
                </View>
                <Text style={[s.reportThanksTitle, { color: colors.text }]}>Thank you!</Text>
                <Text style={[s.reportThanksSub, { color: colors.textSecondary }]}>Report submitted.</Text>
                <Pressable onPress={() => { setShowReport(false); setReportSubmitted(false); }}
                  style={[s.reportCloseBtn, { backgroundColor: colors.primary }]}>
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
                <Text style={[s.reportSub, { color: colors.textSecondary }]}>Select an issue to report.</Text>
                {['Incorrect answer', 'Unclear question', 'Outdated info', 'Other'].map((r) => (
                  <Pressable key={r} onPress={() => setReportSubmitted(true)}
                    style={({ pressed }) => [s.reportOption, {
                      backgroundColor: pressed ? colors.primaryLight : colors.surfaceElevated,
                      borderColor: colors.surfaceBorder,
                    }]}>
                    <Feather name="flag" size={14} color={colors.textSecondary} />
                    <Text style={[s.reportOptionText, { color: colors.text }]}>{r}</Text>
                    <Feather name="chevron-right" size={14} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles — zero hardcoded colors, all from colors.* at render time ────────
const s = StyleSheet.create({
  flex:        { flex: 1 },
  centeredFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontFamily: F.semiBold, fontSize: 18, marginTop: 16 },

  // ── Shared header — identical to leaderboard.tsx ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBack:  { padding: 4 },
  headerTitle: { fontFamily: F.bold, fontSize: 18, flex: 1 },
  premiumChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  premiumChipText: { fontFamily: F.bold, fontSize: 11 },

  // ── Intro ──
  introPad: { padding: 16, paddingTop: 20, gap: 16 },

  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  heroStrip: { height: 4 },
  heroBody:  { flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 20, paddingBottom: 8 },
  heroIconCircle: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroText:    { flex: 1 },
  heroEyebrow: { fontFamily: F.medium, fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle:   { fontFamily: F.bold, fontSize: 20, lineHeight: 28, marginBottom: 6 },
  heroDesc:    { fontFamily: F.regular, fontSize: 13, lineHeight: 19 },
  heroChips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4 },
  heroChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  heroChipText: { fontFamily: F.semiBold, fontSize: 12 },

  ctaCol: { gap: 10 },

  // ── Results ──
  resultsPad:   { padding: 16, paddingTop: 20, gap: 16 },
  scoreCenter:  { alignItems: 'center', gap: 12 },
  scoreOuter:   { width: 152, height: 152, borderRadius: 76, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scoreInner:   { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 4, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  scorePct:     { fontFamily: F.bold,     fontSize: 34 },
  scorePass:    { fontFamily: F.semiBold, fontSize: 11, letterSpacing: 1, marginTop: -2 },
  scoreHeading: { fontFamily: F.bold,     fontSize: 22 },
  scoreSubtitle:{ fontFamily: F.regular,  fontSize: 14 },

  statRow:  { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statVal:  { fontFamily: F.bold,   fontSize: 22 },
  statLbl:  { fontFamily: F.medium, fontSize: 11 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  bannerIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerTitle: { fontFamily: F.bold,    fontSize: 14, marginBottom: 2 },
  bannerSub:   { fontFamily: F.regular, fontSize: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontFamily: F.bold, fontSize: 16 },

  breakdownCard: { marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 },
  breakdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownDot:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  breakdownNum:  { fontFamily: F.semiBold, fontSize: 13 },
  breakdownQ:    { fontFamily: F.regular, flex: 1, fontSize: 14, lineHeight: 20 },

  resultsActions: { gap: 10 },

  // ── Flashcard ──
  flashBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 60, justifyContent: 'flex-end' },
  flashBadgeText:    { fontFamily: F.semiBold, fontSize: 12 },
  flashProgress:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  flashProgressText: { fontFamily: F.semiBold, fontSize: 12, minWidth: 44, textAlign: 'right' },
  flashNav:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14 },
  flashNavBtn: { flex: 1 },

  twoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // ── Intro redesign — vivid gradient full-screen ──
  introHdr:           { paddingHorizontal: 12, paddingTop: 4 },
  introBackBtn:       { padding: 6 },
  introTopBrand:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 6 },
  introTopBrandText:  { fontFamily: F.bold, fontSize: 14, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 },
  introCenterBlock:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  introCourseCircle:  { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' },
  introCourseLabel:   { fontFamily: F.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  introCourseTitle:   { fontFamily: F.bold, fontSize: 26, color: '#fff', textAlign: 'center', lineHeight: 36, letterSpacing: -0.3 },
  introMetaChip:      { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.22)', marginTop: 2 },
  introMetaChipText:  { fontFamily: F.semiBold, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  introFooter:        { paddingHorizontal: 20, gap: 12 },
  introMainBtn:       { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: 'rgba(0,0,0,0.32)' },
  introMainBtnText:   { fontFamily: F.bold, fontSize: 17, color: '#fff', letterSpacing: 0.1 },
  introGhostBtn:      { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)' },
  introGhostBtnText:  { fontFamily: F.semiBold, fontSize: 16, color: 'rgba(255,255,255,0.88)' },

  // ── Quiz / Review header ──
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  quizHeaderBtn:      { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  quizHeaderProgress: { flex: 1 },

  // Quiz scroll — padding around QuestionView content
  quizScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // Quiz bottom bar
  quizBottom: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  twoButtonRow: { flexDirection: 'row', gap: 12 },

  // Report modal
  modalOverlay:       { flex: 1, justifyContent: 'flex-end' },
  reportSheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  reportHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportTitle:        { fontFamily: F.bold,    fontSize: 17 },
  reportSub:          { fontFamily: F.regular, fontSize: 13, marginBottom: 16 },
  reportOption:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  reportOptionText:   { fontFamily: F.medium, flex: 1, fontSize: 14 },
  reportThanks:       { alignItems: 'center', paddingVertical: 16, gap: 10 },
  reportThanksIcon:   { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  reportThanksTitle:  { fontFamily: F.bold,    fontSize: 20 },
  reportThanksSub:    { fontFamily: F.regular, fontSize: 14, textAlign: 'center' },
  reportCloseBtn:     { marginTop: 8, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  reportCloseBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 15 },
});
