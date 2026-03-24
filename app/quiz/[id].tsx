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
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet, PanResponder, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
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
import { useDarkThemeColors } from '@/hooks/useThemeColor';
import { useFontScale } from '@/hooks/useFontScale';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useRateLimitStore } from '@/stores/rateLimitStore';
import { useAuthStore } from '@/stores/authStore';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { CHALLENGE_SCORES } from '@/data/challenges';
import { F } from '@/constants/Typography';
import { supabase } from '@/config/supabase';
import { resolveDailyQuiz } from '@/config/systemFeatures';

const QUESTION_TIME = 30;

type Phase = 'intro' | 'quiz' | 'review' | 'results' | 'flashcard';

export default function QuizScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const colors   = useDarkThemeColors();
  const insets   = useSafeAreaInsets();
  const fScale   = useFontScale();

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
  const [pointScore, setPointScore]           = useState(0);
  // Self Challenge: prior best score recorded before this attempt is saved
  const priorBestPctRef = useRef<number | null>(null);
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
  // Mode-specific states
  const [funLearnRevealed, setFunLearnRevealed] = useState(false);
  const [wordInputValue, setWordInputValue]     = useState('');
  const [wordFeedbackCorrect, setWordFeedbackCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint]                 = useState(false);
  const [numericInputValue, setNumericInputValue] = useState('');
  const [numericFeedbackCorrect, setNumericFeedbackCorrect] = useState<boolean | null>(null);
  const [matchSelectedLeft, setMatchSelectedLeft] = useState<string | null>(null);
  const [matchCorrect, setMatchCorrect]           = useState<Set<string>>(new Set());
  const [matchWrong, setMatchWrong]               = useState<string | null>(null);
  const introChrome = colors.text + 'E6';
  const introChromeMuted = colors.text + 'CC';
  const introSurfaceSoft = colors.surface + '2E';
  const introSurfaceGhost = colors.surface + '1F';
  const introSurfaceBorder = colors.surface + '47';
  const introContrast = colors.surface;
  const introWarningBg = colors.error + '24';
  const introWarningText = colors.text + 'D9';

  const quiz               = quizzes.find((q) => q.id === id);
  const rawQuestions       = quizQuestions[id ?? ''] ?? [];
  const fixedQuestionCount = Math.max(0, quiz?.fixedQuestionCount ?? 0);
  const questionPool       = useMemo(
    () => (fixedQuestionCount > 0 ? rawQuestions.slice(0, Math.min(fixedQuestionCount, rawQuestions.length)) : rawQuestions),
    [fixedQuestionCount, rawQuestions],
  );
  const questions          = useMemo(
    () => questionPool.map((q) => ({ ...q, options: [...q.options].sort(() => Math.random() - 0.5) })),
    [questionPool],
  );
  const correctPoints      = quiz?.correctScore ?? 1;
  const wrongPoints        = quiz?.wrongScore ?? 0;

  const currentQuestionIndex   = useQuizStore((s) => s.currentQuestionIndex);
  const selectedAnswers         = useQuizStore((s) => s.selectedAnswers);
  const selectAnswer            = useQuizStore((s) => s.selectAnswer);
  const nextQuestion            = useQuizStore((s) => s.nextQuestion);
  const previousQuestion        = useQuizStore((s) => s.previousQuestion);
  const goToQuestion            = useQuizStore((s) => s.goToQuestion);
  const reset                   = useQuizStore((s) => s.reset);
  const addResult               = useProgressStore((s) => s.addResult);
  const recentResults           = useProgressStore((s) => s.progress.recentResults);
  const pendingCoins            = useProgressStore((s) => s.pendingCoins);
  const clearPendingCoins       = useProgressStore((s) => s.clearPendingCoins);
  const clearPendingBadges      = useProgressStore((s) => s.clearPendingBadges);
  const { showAd }              = useInterstitialAd();
  const toggleBookmark          = useBookmarkStore((s) => s.toggle);
  const isBookmarked            = useBookmarkStore((s) => s.isBookmarked);
  const user                    = useAuthStore((s) => s.user);
  const systemFeatures          = useSystemFeatureStore((s) => s.config);
  const checkRateLimit          = useRateLimitStore((s) => s.checkAndConsume);

  const currentQuestion        = questions[currentQuestionIndex];
  const dailyQuiz              = resolveDailyQuiz(systemFeatures, quizzes.filter((item) => item.enabled !== false));
  const isDailyQuiz            = dailyQuiz?.id === quiz?.id;
  const isTrueFalseQuiz        = questionPool.length > 0 && questionPool.every((question) => question.options.length === 2);
  const quizMode               = quiz?.mode ?? (isTrueFalseQuiz ? 'true_false' : 'quiz_zone');
  const isExamMode             = quizMode === 'exam';
  const isFunAndLearnMode      = quizMode === 'fun_and_learn';
  const isGuessTheWordMode     = quizMode === 'guess_the_word';
  const isMathsQuizMode        = quizMode === 'maths_quiz';
  const isMultiMatchMode       = quizMode === 'multi_match';
  const isAudioMode            = quizMode === 'audio';
  const answeredCount          = Object.keys(selectedAnswers).length;
  const isLastQuestion         = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent     = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;
  const committedCurrentAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const selectedCurrentAnswer  = (phase === 'review' && pendingAnswerId !== undefined)
    ? pendingAnswerId
    : showFeedback
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
  const calculatePointScore = useCallback(() =>
    questions.reduce((sum, q) => {
      const answer = selectedAnswers[q.id];
      if (answer === undefined) return sum;
      return sum + (answer === q.correctOptionId ? correctPoints : wrongPoints);
    }, 0),
  [correctPoints, questions, selectedAnswers, wrongPoints]);

  const finishQuiz = useCallback(() => {
    stopTimer();
    const score     = calculateScore();
    const points    = calculatePointScore();
    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    setPointScore(points);
    addResult({ quizId: id ?? '', score, totalQuestions: questions.length, timeTaken, answers: selectedAnswers, completedAt: new Date().toISOString() });
    setPhase('results');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimer, calculateScore, calculatePointScore, addResult, id, questions.length, selectedAnswers]);

  useEffect(() => {
    // Exam mode: no per-question countdown — answers are submitted all at once
    if (isExamMode) { stopTimer(); return; }
    if (phase !== 'quiz' || showFeedback || !currentQuestion) { stopTimer(); return; }
    timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, currentQuestionIndex, isExamMode]);

  useEffect(() => {
    if (phase !== 'quiz' || showFeedback || timeLeft > 0) return;
    stopTimer(); setPendingAnswerId(undefined);
    if (isLastQuestion) { finishQuiz(); } else { nextQuestion(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, timeLeft, isLastQuestion]);

  useEffect(() => {
    resetTimer(); setHiddenOptions([]); setPendingAnswerId(undefined);
    setFunLearnRevealed(false);
    setWordInputValue(''); setWordFeedbackCorrect(null); setShowHint(false);
    setNumericInputValue(''); setNumericFeedbackCorrect(null);
    setMatchSelectedLeft(null); setMatchCorrect(new Set()); setMatchWrong(null);
  }, [currentQuestionIndex]); // eslint-disable-line

  useEffect(() => {
    if (phase !== 'results') { setBadgeReady(false); return; }
    const t = setTimeout(() => setBadgeReady(true), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectAnswer = (optionId: string) => { if (!showFeedback || phase === 'review') setPendingAnswerId(optionId); };
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
  // ── Mode-specific handlers ─────────────────────────────────────────────────
  const handleWordSubmit = () => {
    if (!currentQuestion || !wordInputValue.trim() || showFeedback) return;
    stopTimer();
    const correct = wordInputValue.trim().toLowerCase() === (currentQuestion.wordAnswer ?? '').toLowerCase();
    setWordFeedbackCorrect(correct);
    selectAnswer(currentQuestion.id, correct ? currentQuestion.correctOptionId : '__wrong__');
    setShowFeedback(true); setFeedbackDismissed(false);
  };

  const handleNumericSubmit = () => {
    if (!currentQuestion || numericInputValue.trim() === '' || showFeedback) return;
    stopTimer();
    const entered = parseFloat(numericInputValue);
    const target  = currentQuestion.numericAnswer ?? 0;
    const correct = Math.abs(entered - target) <= 0.01;
    setNumericFeedbackCorrect(correct);
    selectAnswer(currentQuestion.id, correct ? currentQuestion.correctOptionId : '__wrong__');
    setShowFeedback(true); setFeedbackDismissed(false);
  };

  const handleMatchLeft = (pairId: string) => {
    if (showFeedback) return;
    setMatchSelectedLeft(pairId);
  };

  const handleMatchRight = (pairId: string) => {
    if (!matchSelectedLeft || showFeedback) return;
    if (matchSelectedLeft === pairId) {
      const next = new Set(matchCorrect);
      next.add(pairId);
      setMatchCorrect(next);
      setMatchSelectedLeft(null);
      if (currentQuestion?.matchPairs && next.size === currentQuestion.matchPairs.length) {
        stopTimer();
        selectAnswer(currentQuestion.id, currentQuestion.correctOptionId);
        setShowFeedback(true); setFeedbackDismissed(false);
      }
    } else {
      setMatchWrong(pairId);
      setMatchSelectedLeft(null);
      setTimeout(() => setMatchWrong(null), 700);
    }
  };

  const exitAndReset = (goLeaderboard = false) => {
    stopTimer(); reset(); clearPendingCoins(); clearPendingBadges();
    setShowFeedback(false); setFeedbackDismissed(false); setPendingAnswerId(undefined);
    setFiftyFiftyUsed(false); setHiddenOptions([]); setSkipsLeft(3);
    setPointScore(0);
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
  if (!quiz || quiz.enabled === false || questions.length === 0) {
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
      // Capture prior best before this attempt is saved (for Self Challenge banner)
      if (id) {
        const prior = recentResults.find((r) => r.quizId === id);
        if (prior) {
          const maxPts = Math.max(1, prior.totalQuestions * Math.max(1, quiz.correctScore ?? 1));
          priorBestPctRef.current = Math.max(0, Math.round((prior.score / maxPts) * 100));
        } else {
          priorBestPctRef.current = null;
        }
      }
      reset(); setShowFeedback(false); setFeedbackDismissed(false); setPendingAnswerId(undefined);
      setFiftyFiftyUsed(false); setHiddenOptions([]); setSkipsLeft(3);
      setPointScore(0);
      resetTimer(); startedAt.current = Date.now(); setPhase('quiz');
    };

    return (
      <View style={s.flex}>
        <DailyLimitModal visible={showDailyLimit} onClose={() => setShowDailyLimit(false)}
          onUpgrade={() => { setShowDailyLimit(false); setShowPremiumGate(true); }} />
        <PremiumGateModal visible={showPremiumGate} quiz={quiz} onClose={() => setShowPremiumGate(false)} />

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
              <Feather name="arrow-left" size={24} color={introChrome} />
            </Pressable>
          </View>

          {/* Top branding label */}
          <View style={s.introTopBrand}>
            <Feather name="zap" size={24} color={introChromeMuted} />
            <Text style={[s.introTopBrandText, { color: introChromeMuted }]}>Practice Quiz</Text>
          </View>

          {/* ── Center block: icon + course info ── */}
          <View style={s.introCenterBlock}>
            <View style={[s.introCourseCircle, { backgroundColor: introSurfaceSoft }]}>
              <Feather name={(quiz.icon ?? 'cpu') as any} size={44} color={introContrast} />
            </View>
            {isDailyQuiz ? (
              <View style={[s.introDailyBadge, { backgroundColor: colors.primaryLight + 'CC' }]}>
                <Text style={[s.introDailyBadgeText, { color: colors.primaryText }]}>{systemFeatures.dailyQuizLabel}</Text>
              </View>
            ) : null}
            {isTrueFalseQuiz ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>True / False</Text>
              </View>
            ) : null}
            {isFunAndLearnMode ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>📖 Fun and Learn</Text>
              </View>
            ) : null}
            {isGuessTheWordMode ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>✏️ Guess the Word</Text>
              </View>
            ) : null}
            {isMathsQuizMode ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>🔢 Maths Quiz</Text>
              </View>
            ) : null}
            {isMultiMatchMode ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>🔗 Multi Match</Text>
              </View>
            ) : null}
            {isAudioMode ? (
              <View style={[s.introDailyBadge, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introDailyBadgeText, { color: introContrast }]}>🎧 Audio Quiz</Text>
              </View>
            ) : null}
            <Text style={[s.introCourseLabel, { color: introChromeMuted }]}>Course</Text>
            <Text style={[s.introCourseTitle, { color: introContrast }]} numberOfLines={3}>{quiz.title}</Text>
            <View style={[s.introMetaChip, { backgroundColor: introSurfaceSoft }]}>
              <Text style={[s.introMetaChipText, { color: introChrome }]}>
                {questions.length} Questions · {quiz.duration} min{isTrueFalseQuiz ? ' · 2-option mode' : ''}
              </Text>
            </View>
            {isDailyQuiz ? (
              <Text style={[s.introDailyHint, { color: introChrome }]}>Today&apos;s featured quiz. Complete it to update your daily progress across the app.</Text>
            ) : null}
            {quiz.mode === 'exam' && quiz.examReviewAllowed === false ? (
              <Text style={[s.introDailyHint, { backgroundColor: introWarningBg, color: introWarningText }]}>
                This is an exam — answers will not be shown after submission.
              </Text>
            ) : null}
          </View>

          {/* ── Bottom CTA buttons ── */}
          <View style={[s.introFooter, { paddingBottom: bottomSpacer + 8 }]}>
            {isPremiumLocked ? (
              <Pressable onPress={() => setShowPremiumGate(true)} style={[s.introMainBtn, { backgroundColor: introSurfaceSoft }]}>
                <Feather name="lock" size={16} color={introContrast} />
                <Text style={[s.introMainBtnText, { color: introContrast }]}>Unlock — Rs {quiz.price ?? 149}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleStart} style={[s.introMainBtn, { backgroundColor: introSurfaceSoft }]}>
                <Text style={[s.introMainBtnText, { color: introContrast }]}>Start Practice</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { setFlashIndex(0); setFlashFlipped(false); setPhase('flashcard'); }}
              style={[s.introGhostBtn, { backgroundColor: introSurfaceGhost, borderColor: introSurfaceBorder }]}
            >
              <Text style={[s.introGhostBtnText, { color: introChrome }]}>Review Flashcards</Text>
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
    const maxPoints  = Math.max(1, questions.length * Math.max(1, correctPoints));
    const pct        = Math.max(0, Math.round((pointScore / maxPoints) * 100));
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;
    const wrongCount = Math.max(0, answeredCount - score);
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
          {isDailyQuiz ? (
            <View style={[s.banner, { backgroundColor: (passed ? colors.success : colors.warning) + '18', borderColor: (passed ? colors.success : colors.warning) + '44' }]}>
              <View style={[s.bannerIcon, { backgroundColor: (passed ? colors.success : colors.warning) + '28' }]}>
                <Feather name={passed ? 'check-circle' : 'sun'} size={18} color={passed ? colors.success : colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bannerTitle, { color: passed ? colors.success : colors.warning }]}>{systemFeatures.dailyQuizLabel}</Text>
                <Text style={[s.bannerSub, { color: colors.textSecondary }]}>
                  {passed ? 'Daily quiz completed and reflected in your app summary.' : 'Daily quiz attempt saved. Retry anytime to improve today’s result.'}
                </Text>
              </View>
            </View>
          ) : null}

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

          {/* Self Challenge comparison */}
          {priorBestPctRef.current !== null && (() => {
            const prior    = priorBestPctRef.current as number;
            const improved = pct > prior;
            const tied     = pct === prior;
            const bannerColor = improved ? colors.success : tied ? colors.warning : colors.error;
            return (
              <View style={[s.banner, { backgroundColor: bannerColor + '18', borderColor: bannerColor + '44' }]}>
                <View style={[s.bannerIcon, { backgroundColor: bannerColor + '28' }]}>
                  <Feather name={improved ? 'trending-up' : tied ? 'minus' : 'trending-down'} size={18} color={bannerColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.bannerTitle, { color: bannerColor }]}>
                    {improved ? 'New Personal Best! 🏆' : tied ? 'Matched Your Best' : 'Self Challenge'}
                  </Text>
                  <Text style={[s.bannerSub, { color: colors.textSecondary }]}>
                    {`Your best: ${prior}%  →  This attempt: ${pct}%`}
                    {improved ? `  (+${pct - prior}%)` : tied ? '' : `  (${pct - prior}%)`}
                  </Text>
                </View>
              </View>
            );
          })()}

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
              { icon: 'zap',          val: pointScore,          label: 'Points',  color: resultColor },
              { icon: 'check-circle', val: score,               label: 'Correct', color: colors.success },
              { icon: 'x-circle',     val: wrongCount,          label: 'Wrong',   color: colors.error },
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
            <View style={s.resultTopRow}>
              <Button title="Review Answers" variant="outline" size="lg" style={s.resultActionBtn}
                onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }} />
              <Button title="Leaderboard" variant="secondary" size="lg" style={s.resultActionBtn}
                onPress={() => exitAndReset(true)} />
            </View>
            <Pressable
              onPress={() => exitAndReset()}
              hitSlop={8}
              style={[s.navBtn, { borderColor: colors.primary, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: 32 }]}
            >
              <Text style={[s.navBtnText, { color: colors.primary }]}>Done</Text>
              <Feather name="check" size={18} color={colors.primary} />
            </Pressable>
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

        {/* Navigation bar — Previous (left) | Next (right) */}
        <View style={[s.flashNav, {
          backgroundColor: colors.surface,
          borderTopColor:  colors.surfaceBorder,
          paddingBottom:   bottomSpacer,
        }]}>
          <Pressable
            onPress={() => { setFlashIndex((i) => i - 1); setFlashFlipped(false); }}
            disabled={flashIndex === 0}
            hitSlop={8}
            style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: flashIndex === 0 ? 0.3 : 1 }]}
          >
            <Feather name="chevrons-left" size={18} color={colors.text} />
            <Text style={[s.navBtnText, { color: colors.text }]}>Previous</Text>
          </Pressable>
          <Pressable
            onPress={() => flashIndex < questions.length - 1
              ? (setFlashIndex((i) => i + 1), setFlashFlipped(false))
              : exitAndReset()
            }
            hitSlop={8}
            style={[s.navBtn, { borderColor: colors.primary }]}
          >
            <Text style={[s.navBtnText, { color: colors.primary }]}>
              {flashIndex < questions.length - 1 ? 'Next' : 'Done'}
            </Text>
            <Feather
              name={flashIndex < questions.length - 1 ? 'chevrons-right' : 'check'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
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
        {isReview ? (
          <Pressable onPress={() => setPhase('results')} hitSlop={14} style={s.quizHeaderBtn}>
            <Feather name="arrow-left" size={22} color={colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={[s.quizHeaderBtn, s.quizHeaderScore]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[s.quizHeaderScoreText, { color: colors.primary }]}>{pointScore}</Text>
          </View>
        )}

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
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.quizScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentQuestion && (() => {
          const isInputMode = isGuessTheWordMode || isMathsQuizMode || isMultiMatchMode;
          const allMatchesDone = isMultiMatchMode && currentQuestion.matchPairs
            ? matchCorrect.size === currentQuestion.matchPairs.length
            : false;

          return (
            <>
              {/* Audio Quiz: show fallback note (expo-audio not installed) */}
              {isAudioMode && currentQuestion.audioUrl && (
                <View style={[modeStyles.audioNote, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '44' }]}>
                  <Feather name="headphones" size={16} color={colors.primary} />
                  <Text style={[modeStyles.audioNoteText, { color: colors.primary }]}>
                    Audio: {currentQuestion.audioFallbackText ?? currentQuestion.text}
                  </Text>
                </View>
              )}

              {/* Fun and Learn: learning card before options */}
              {isFunAndLearnMode && !funLearnRevealed && currentQuestion.explanation && (
                <View style={[modeStyles.learnCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '44' }]}>
                  <Text style={[modeStyles.learnLabel, { color: colors.primary }]}>📖 Learn first:</Text>
                  <Text style={[modeStyles.learnText, { color: colors.text }]}>{currentQuestion.explanation}</Text>
                  <Pressable
                    onPress={() => setFunLearnRevealed(true)}
                    style={({ pressed }) => [modeStyles.gotItBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
                  >
                    <Text style={[modeStyles.gotItBtnText, { color: colors.surface }]}>Got it →</Text>
                  </Pressable>
                </View>
              )}

              {/* Standard QuestionView for MCQ / true-false / fun_and_learn after reveal / audio / exam */}
              {!isInputMode && (!isFunAndLearnMode || funLearnRevealed) && (
                <QuestionView
                  question={currentQuestion}
                  selectedOptionId={selectedCurrentAnswer}
                  onSelectOption={handleSelectAnswer}
                  showResult={phase === 'review' ? (hasAnsweredCurrent || pendingAnswerId !== undefined) : (showFeedback && hasAnsweredCurrent)}
                  resultTone={isCurrentCorrect ? 'correct' : 'incorrect'}
                  hiddenOptionIds={hiddenOptions}
                  onReport={!isReview ? () => setShowReport(true) : undefined}
                />
              )}

              {/* Guess the Word */}
              {isGuessTheWordMode && (
                <View>
                  <Text style={[modeStyles.questionText, { color: colors.text }]}>{currentQuestion.text}</Text>
                  {currentQuestion.hint && (
                    showHint ? (
                      <View style={[modeStyles.hintBox, { backgroundColor: colors.warning + '14', borderColor: colors.warning + '44' }]}>
                        <Text style={[modeStyles.hintText, { color: colors.warning }]}>💡 {currentQuestion.hint}</Text>
                      </View>
                    ) : (
                      <Pressable onPress={() => setShowHint(true)} style={[modeStyles.hintBtn, { borderColor: colors.surfaceBorder }]}>
                        <Text style={[modeStyles.hintBtnText, { color: colors.textSecondary }]}>Show Hint 💡</Text>
                      </Pressable>
                    )
                  )}
                  {wordFeedbackCorrect === null ? (
                    <View style={modeStyles.inputRow}>
                      <TextInput
                        value={wordInputValue}
                        onChangeText={setWordInputValue}
                        onSubmitEditing={handleWordSubmit}
                        returnKeyType="done"
                        placeholder="Type your answer…"
                        placeholderTextColor={colors.textSecondary}
                        style={[modeStyles.textInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
                      />
                      <Pressable
                        onPress={handleWordSubmit}
                        disabled={!wordInputValue.trim()}
                        style={({ pressed }) => [modeStyles.submitBtn, { backgroundColor: wordInputValue.trim() ? colors.primary : colors.surfaceBorder, opacity: pressed ? 0.88 : 1 }]}
                      >
                        <Text style={[modeStyles.submitBtnText, { color: wordInputValue.trim() ? colors.surface : colors.textSecondary }]}>Submit</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={[modeStyles.feedbackBox, { backgroundColor: wordFeedbackCorrect ? colors.success + '18' : colors.error + '14', borderColor: wordFeedbackCorrect ? colors.success + '44' : colors.error + '44' }]}>
                      <Text style={[modeStyles.feedbackText, { color: wordFeedbackCorrect ? colors.success : colors.error }]}>
                        {wordFeedbackCorrect ? '✓ Correct!' : `✗ Incorrect. Answer: "${currentQuestion.wordAnswer}"`}
                      </Text>
                      {currentQuestion.explanation ? <Text style={[modeStyles.explanationText, { color: colors.textSecondary }]}>{currentQuestion.explanation}</Text> : null}
                    </View>
                  )}
                </View>
              )}

              {/* Maths Quiz */}
              {isMathsQuizMode && (
                <View>
                  <Text style={[modeStyles.mathQuestion, { color: colors.text }]}>{currentQuestion.text}</Text>
                  {numericFeedbackCorrect === null ? (
                    <View style={modeStyles.inputRow}>
                      <TextInput
                        value={numericInputValue}
                        onChangeText={setNumericInputValue}
                        onSubmitEditing={handleNumericSubmit}
                        returnKeyType="done"
                        keyboardType="numeric"
                        placeholder="Numeric answer…"
                        placeholderTextColor={colors.textSecondary}
                        style={[modeStyles.textInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text, fontSize: 18 }]}
                      />
                      <Pressable
                        onPress={handleNumericSubmit}
                        disabled={numericInputValue.trim() === ''}
                        style={({ pressed }) => [modeStyles.submitBtn, { backgroundColor: numericInputValue.trim() ? colors.primary : colors.surfaceBorder, opacity: pressed ? 0.88 : 1 }]}
                      >
                        <Text style={[modeStyles.submitBtnText, { color: numericInputValue.trim() ? colors.surface : colors.textSecondary }]}>Submit</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={[modeStyles.feedbackBox, { backgroundColor: numericFeedbackCorrect ? colors.success + '18' : colors.error + '14', borderColor: numericFeedbackCorrect ? colors.success + '44' : colors.error + '44' }]}>
                      <Text style={[modeStyles.feedbackText, { color: numericFeedbackCorrect ? colors.success : colors.error }]}>
                        {numericFeedbackCorrect ? '✓ Correct!' : `✗ Incorrect. Answer: ${currentQuestion.numericAnswer}`}
                      </Text>
                      {currentQuestion.explanation ? <Text style={[modeStyles.explanationText, { color: colors.textSecondary }]}>{currentQuestion.explanation}</Text> : null}
                    </View>
                  )}
                </View>
              )}

              {/* Multi Match */}
              {isMultiMatchMode && currentQuestion.matchPairs && currentQuestion.matchPairs.length > 0 && (
                <View>
                  <Text style={[modeStyles.questionText, { color: colors.text }]}>{currentQuestion.text}</Text>
                  <View style={modeStyles.matchGrid}>
                    <View style={modeStyles.matchCol}>
                      <Text style={[modeStyles.matchColLabel, { color: colors.textSecondary }]}>Match from</Text>
                      {currentQuestion.matchPairs.map((pair) => {
                        const isMatched   = matchCorrect.has(pair.id);
                        const isSelected  = matchSelectedLeft === pair.id;
                        return (
                          <Pressable
                            key={pair.id}
                            onPress={() => !isMatched && handleMatchLeft(pair.id)}
                            disabled={isMatched || allMatchesDone}
                            style={[modeStyles.matchBtn, {
                              backgroundColor: isMatched ? colors.success + '18' : isSelected ? colors.primaryLight : colors.surface,
                              borderColor: isMatched ? colors.success : isSelected ? colors.primary : colors.surfaceBorder,
                            }]}
                          >
                            <Text style={[modeStyles.matchBtnText, { color: isMatched ? colors.success : isSelected ? colors.primary : colors.text }]}>{pair.left}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={modeStyles.matchCol}>
                      <Text style={[modeStyles.matchColLabel, { color: colors.textSecondary }]}>Match to</Text>
                      {[...currentQuestion.matchPairs].sort(() => Math.random() - 0.5).map((pair) => {
                        const isMatched = matchCorrect.has(pair.id);
                        const isWrong   = matchWrong === pair.id;
                        return (
                          <Pressable
                            key={pair.id}
                            onPress={() => !isMatched && handleMatchRight(pair.id)}
                            disabled={isMatched || allMatchesDone || !matchSelectedLeft}
                            style={[modeStyles.matchBtn, {
                              backgroundColor: isMatched ? colors.success + '18' : isWrong ? colors.error + '14' : colors.surface,
                              borderColor: isMatched ? colors.success : isWrong ? colors.error : colors.surfaceBorder,
                              opacity: !matchSelectedLeft && !isMatched ? 0.6 : 1,
                            }]}
                          >
                            <Text style={[modeStyles.matchBtnText, { color: isMatched ? colors.success : isWrong ? colors.error : colors.text }]}>{pair.right}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                  {allMatchesDone && (
                    <View style={[modeStyles.feedbackBox, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
                      <Text style={[modeStyles.feedbackText, { color: colors.success }]}>✓ All pairs matched!</Text>
                      {currentQuestion.explanation ? <Text style={[modeStyles.explanationText, { color: colors.textSecondary }]}>{currentQuestion.explanation}</Text> : null}
                    </View>
                  )}
                </View>
              )}
            </>
          );
        })()}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom action bar — bordered nav buttons matching flashcard style ── */}
      <View style={[s.quizBottom, { paddingBottom: bottomSpacer }]}>
        <View style={s.navRow}>
          {/* Left — Previous */}
          <Pressable
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
            hitSlop={8}
            style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: currentQuestionIndex === 0 ? 0.3 : 1 }]}
          >
            <Feather name="chevrons-left" size={18} color={colors.text} />
            <Text style={[s.navBtnText, { color: colors.text }]}>Previous</Text>
          </Pressable>

          {/* Right — Check / Next / Done */}
          {isReview ? (
            <Pressable
              hitSlop={8}
              onPress={() => isLastQuestion ? exitAndReset() : (setShowFeedback(true), nextQuestion())}
              style={[s.navBtn, { borderColor: colors.primary }]}
            >
              <Text style={[s.navBtnText, { color: colors.primary }]}>
                {isLastQuestion ? 'Done' : 'Next'}
              </Text>
              <Feather name={isLastQuestion ? 'check' : 'chevrons-right'} size={18} color={colors.primary} />
            </Pressable>
          ) : (isGuessTheWordMode && wordFeedbackCorrect !== null) || (isMathsQuizMode && numericFeedbackCorrect !== null) || (isMultiMatchMode && currentQuestion && currentQuestion.matchPairs && matchCorrect.size === currentQuestion.matchPairs.length) ? (
            // Input mode submitted → show Next
            <Pressable
              onPress={handleNext}
              hitSlop={8}
              style={[s.navBtn, { borderColor: colors.primary }]}
            >
              <Text style={[s.navBtnText, { color: colors.primary }]}>
                {isLastQuestion ? 'Results' : 'Next'}
              </Text>
              <Feather name={isLastQuestion ? 'award' : 'chevrons-right'} size={18} color={colors.primary} />
            </Pressable>
          ) : showFeedback && hasAnsweredCurrent ? (
            <Pressable
              onPress={handleNext}
              hitSlop={8}
              style={[s.navBtn, { borderColor: colors.primary }]}
            >
              <Text style={[s.navBtnText, { color: colors.primary }]}>
                {isLastQuestion ? 'Results' : 'Next'}
              </Text>
              <Feather name={isLastQuestion ? 'award' : 'chevrons-right'} size={18} color={colors.primary} />
            </Pressable>
          ) : isFunAndLearnMode && !funLearnRevealed ? (
            <View style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: 0.4 }]}>
              <Text style={[s.navBtnText, { color: colors.textSecondary }]}>Read above</Text>
            </View>
          ) : (isGuessTheWordMode || isMathsQuizMode || isMultiMatchMode) ? (
            // Input modes: hide Check — they have inline submit
            <View style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: 0.4 }]}>
              <Text style={[s.navBtnText, { color: colors.textSecondary }]}>Answer above</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleCheckAnswer}
              disabled={!pendingAnswerId}
              hitSlop={8}
              style={[s.navBtn, { borderColor: pendingAnswerId ? colors.primary : colors.surfaceBorder, opacity: pendingAnswerId ? 1 : 0.45 }]}
            >
              <Text style={[s.navBtnText, { color: pendingAnswerId ? colors.primary : colors.textSecondary }]}>Check</Text>
              <Feather name="check" size={18} color={pendingAnswerId ? colors.primary : colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Report modal ── */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Pressable style={[s.modalOverlay, { backgroundColor: colors.background + '99' }]} onPress={() => setShowReport(false)}>
          {/* View (not Pressable) so nested Pressables get full layout width */}
          <View style={[s.reportSheet, { backgroundColor: colors.surface }]}>
            {reportSubmitted ? (
              <View style={s.reportThanks}>
                <View style={[s.reportThanksIcon, { backgroundColor: colors.success + '22' }]}>
                  <Feather name="check-circle" size={36} color={colors.success} />
                </View>
                <Text style={[s.reportThanksTitle, { color: colors.text }]}>Thank you!</Text>
                <Text style={[s.reportThanksSub, { color: colors.textSecondary }]}>Report submitted.</Text>
                <Pressable onPress={() => { setShowReport(false); setReportSubmitted(false); }}
                  style={[s.reportCloseBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[s.reportCloseBtnText, { color: colors.surface }]}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={s.reportHeader}>
                  <Text style={[s.reportTitle, { color: colors.text }]}>Report Question</Text>
                  <Pressable onPress={() => setShowReport(false)} hitSlop={8}>
                    <Feather name="x" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={[s.reportSub, { color: colors.textSecondary }]}>Select an issue to report.</Text>
                {['Incorrect answer', 'Unclear question', 'Outdated info', 'Other'].map((r) => (
                  <Pressable
                    key={r}
                    onPress={async () => {
                      setReportSubmitted(true);
                      try {
                        const newEntry = {
                          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          quizId: quiz?.id ?? id,
                          questionId: currentQuestion?.id ?? '',
                          questionText: (currentQuestion?.text ?? '').slice(0, 120),
                          reason: r,
                          reportedAt: new Date().toISOString(),
                        };
                        const { data: existing } = await supabase
                          .from('app_settings')
                          .select('value')
                          .eq('key', 'question_reports')
                          .single();
                        const prev: typeof newEntry[] = Array.isArray(existing?.value) ? existing.value : [];
                        await supabase
                          .from('app_settings')
                          .upsert({ key: 'question_reports', value: [...prev, newEntry] }, { onConflict: 'key' });
                      } catch {
                        // best-effort — don't block the thank-you screen
                      }
                    }}
                    style={[s.reportOption, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}
                  >
                    <Feather name="flag" size={14} color={colors.primary} />
                    <Text style={[s.reportOptionText, { color: colors.text }]}>{r}</Text>
                    <Feather name="chevron-right" size={14} color={colors.textSecondary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ── Mode-specific styles (colors injected inline at render time) ─────────────
const modeStyles = StyleSheet.create({
  audioNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16,
  },
  audioNoteText: { fontFamily: F.medium, fontSize: 13, flex: 1, lineHeight: 18 },

  learnCard: { padding: 16, borderRadius: 12, borderWidth: 1.5, marginBottom: 16, gap: 10 },
  learnLabel: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.5 },
  learnText: { fontFamily: F.regular, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  gotItBtn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8 },
  gotItBtnText: { fontFamily: F.bold, fontSize: 13 },

  questionText: { fontFamily: F.semiBold, fontSize: 16, lineHeight: 24, marginBottom: 16 },
  mathQuestion: { fontFamily: F.semiBold, fontSize: 22, lineHeight: 30, marginBottom: 16 },

  hintBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  hintText: { fontFamily: F.medium, fontSize: 13 },
  hintBtn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', marginBottom: 12 },
  hintBtnText: { fontFamily: F.medium, fontSize: 13 },

  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  textInput: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15, fontFamily: F.regular },
  submitBtn: { height: 48, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontFamily: F.bold, fontSize: 14 },

  feedbackBox: { padding: 14, borderRadius: 10, borderWidth: 1, gap: 6, marginTop: 8 },
  feedbackText: { fontFamily: F.semiBold, fontSize: 14 },
  explanationText: { fontFamily: F.regular, fontSize: 13, lineHeight: 19 },

  matchGrid: { flexDirection: 'row', gap: 10 },
  matchCol: { flex: 1, gap: 8 },
  matchColLabel: { fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  matchBtn: { borderWidth: 1.5, borderRadius: 10, padding: 12, minHeight: 44 },
  matchBtnText: { fontFamily: F.medium, fontSize: 13, lineHeight: 18 },
});

// ── Styles — zero hardcoded colors, all from colors.* at render time ────────
const s = StyleSheet.create({
  flex:         { flex: 1 },
  centeredFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontFamily: F.semiBold, fontSize: 18, marginTop: 16 },

  // ── Shared header (results / flashcard phases) ──
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

  resultsActions:   { gap: 10 },
  resultTopRow:     { flexDirection: 'row', gap: 10 },
  resultActionBtn:  { flex: 1 },

  // ── Flashcard ──
  flashBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, minWidth: 60, justifyContent: 'flex-end' },
  flashBadgeText:    { fontFamily: F.semiBold, fontSize: 12 },
  flashProgress:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  flashProgressText: { fontFamily: F.semiBold, fontSize: 12, minWidth: 44, textAlign: 'right' },
  flashNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14 },

  // ── Intro — vivid gradient full-screen ──
  introHdr:           { paddingHorizontal: 12, paddingTop: 4 },
  introBackBtn:       { padding: 6 },
  introTopBrand:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 6 },
  introTopBrandText:  { fontFamily: F.bold, fontSize: 14, letterSpacing: 0.5 },
  introCenterBlock:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  introCourseCircle:  { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  introDailyBadge:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  introDailyBadgeText:{ fontFamily: F.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  introCourseLabel:   { fontFamily: F.medium, fontSize: 14, marginTop: 4 },
  introCourseTitle:   { fontFamily: F.bold, fontSize: 26, textAlign: 'center', lineHeight: 36, letterSpacing: -0.3 },
  introMetaChip:      { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 24, marginTop: 2 },
  introMetaChipText:  { fontFamily: F.semiBold, fontSize: 14 },
  introDailyHint:     { fontFamily: F.medium, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  introFooter:        { paddingHorizontal: 20, gap: 12 },
  introMainBtn:       { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  introMainBtnText:   { fontFamily: F.bold, fontSize: 17, letterSpacing: 0.1 },
  introGhostBtn:      { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  introGhostBtnText:  { fontFamily: F.semiBold, fontSize: 16 },

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
  quizHeaderScore:    { flexDirection: 'row', gap: 4 },
  quizHeaderScoreText:{ fontFamily: F.bold, fontSize: 14 },

  // Quiz scroll — padding around QuestionView content
  quizScroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
  },

  // Quiz bottom bar — bordered nav buttons
  quizBottom: { paddingHorizontal: 16, paddingTop: 14 },
  navRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 },
  navBtnText: { fontFamily: F.bold, fontSize: 15 },

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
  reportCloseBtnText: { fontFamily: F.semiBold, fontSize: 15 },
});
