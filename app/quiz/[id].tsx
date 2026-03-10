import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestionView } from '@/components/quiz/QuestionView';
import { FlashCard } from '@/components/quiz/FlashCard';
import { AdBanner } from '@/components/ads/AdBanner';
import { BadgeCelebrationModal } from '@/components/ui/BadgeCelebrationModal';
import { PremiumGateModal } from '@/components/ui/PremiumGateModal';
import { useInterstitialAd, INTERSTITIAL_AD_INTERVAL } from '@/hooks/useInterstitialAd';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useQuizStore } from '@/stores/quizStore';
import { useProgressStore } from '@/stores/progressStore';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { useAuthStore } from '@/stores/authStore';
import { openCheckout, openCourseUnlock } from '@/services/razorpayService';
import { quizzes, quizQuestions } from '@/data/quizzes';
import { CHALLENGE_SCORES } from '@/data/challenges';
import { F } from '@/constants/Typography';

const QUESTION_TIME = 30;

// Tint backgrounds (10% opacity approximation)
const SUCCESS_TINT = '#D1F7E2';
const ERROR_TINT   = '#FFE5E6';

type Phase = 'intro' | 'quiz' | 'review' | 'results' | 'flashcard';

export default function QuizScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const colors   = useThemeColors();
  const [phase, setPhase]               = useState<Phase>('intro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [runningScore, setRunningScore] = useState(0);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [badgeReady, setBadgeReady]           = useState(false);

  // Flashcard state
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  // Report question
  const [showReport, setShowReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt  = useRef<number>(Date.now());

  // Lifelines
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions]   = useState<string[]>([]);
  const [skipsLeft, setSkipsLeft]           = useState(3);

  const quiz      = quizzes.find((q) => q.id === id);
  const rawQuestions = quizQuestions[id ?? ''] ?? [];

  // Shuffle options once per quiz load so the correct answer isn't always "B."
  // correctOptionId is preserved (it's the option's id, not its position).
  const questions = useMemo(
    () => rawQuestions.map((q) => ({ ...q, options: [...q.options].sort(() => Math.random() - 0.5) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],  // re-shuffle only when the quiz changes
  );

  const {
    currentQuestionIndex, selectedAnswers,
    selectAnswer, nextQuestion, previousQuestion, goToQuestion, reset,
  } = useQuizStore();

  const addResult           = useProgressStore((s) => s.addResult);
  const pendingCoins        = useProgressStore((s) => s.pendingCoins);
  const clearPendingCoins   = useProgressStore((s) => s.clearPendingCoins);
  const clearPendingBadges  = useProgressStore((s) => s.clearPendingBadges);
  const { showAd }     = useInterstitialAd();
  const toggleBookmark = useBookmarkStore((s) => s.toggle);
  const isBookmarked   = useBookmarkStore((s) => s.isBookmarked);
  const user              = useAuthStore((s) => s.user);
  const upgradeToPremium  = useAuthStore((s) => s.upgradeToPremium);
  const unlockCourse      = useAuthStore((s) => s.unlockCourse);

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

  // Delay badge modal until scoreboard has been visible for ~1.4s
  useEffect(() => {
    if (phase !== 'results') { setBadgeReady(false); return; }
    const t = setTimeout(() => setBadgeReady(true), 1400);
    return () => clearTimeout(t);
  }, [phase]);

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
    const timeTaken = Math.round((Date.now() - startedAt.current) / 1000);
    addResult({
      quizId: id ?? '', score,
      totalQuestions: questions.length,
      timeTaken,
      answers: selectedAnswers,
      completedAt: new Date().toISOString(),
    });
    setPhase('results');
  };

  const exitAndReset = () => {
    stopTimer();
    reset();
    clearPendingCoins();
    clearPendingBadges();
    setShowFeedback(false);
    setRunningScore(0);
    setFiftyFiftyUsed(false);
    setHiddenOptions([]);
    setSkipsLeft(3);
    setFlashIndex(0);
    setFlashFlipped(false);
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
  const timerColor    = timeLeft <= 10 ? colors.error : colors.primary;
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
    const canAccess = user?.subscription === 'premium' || (user?.unlockedCourses ?? []).includes(quiz.id);
    const isPremiumLocked = quiz.isPremium && !canAccess;

    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Premium gate modal */}
        <PremiumGateModal
          visible={showPremiumGate}
          quiz={quiz}
          onClose={() => setShowPremiumGate(false)}
          onUpgrade={async (type: 'subscription' | 'course') => {
            const startQuiz = () => {
              setShowPremiumGate(false);
              reset();
              setShowFeedback(false);
              setRunningScore(0);
              setFiftyFiftyUsed(false);
              setHiddenOptions([]);
              setSkipsLeft(3);
              resetTimer();
              startedAt.current = Date.now();
              setPhase('quiz');
            };

            if (type === 'course') {
              const result = await openCourseUnlock(quiz.id, quiz.price ?? 149);
              if (result.success) {
                await unlockCourse(quiz.id);
                startQuiz();
              } else {
                Alert.alert('Payment Failed', result.error ?? 'Please try again.', [{ text: 'OK' }]);
              }
            } else {
              const result = await openCheckout('annual');
              if (result.success) {
                await upgradeToPremium();
                startQuiz();
              } else {
                Alert.alert('Payment Failed', result.error ?? 'Please try again.', [{ text: 'OK' }]);
              }
            }
          }}
        />

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
                <Text style={[s.courseDesc, { color: colors.textSecondary }]}>{quiz.description}</Text>
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

          {/* ── Action buttons row ── */}
          <View style={s.actionRow}>
            {isPremiumLocked ? (
              <Pressable
                onPress={() => setShowPremiumGate(true)}
                style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.warning, opacity: pressed ? 0.88 : 1 }]}
              >
                <Feather name="lock" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Unlock — ₹{quiz.price ?? 149}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  reset();
                  setShowFeedback(false);
                  setRunningScore(0);
                  setFiftyFiftyUsed(false);
                  setHiddenOptions([]);
                  setSkipsLeft(3);
                  resetTimer();
                  startedAt.current = Date.now();
                  setPhase('quiz');
                }}
                style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
              >
                <Feather name="play-circle" size={18} color="#fff" />
                <Text style={s.actionBtnText}>Start Practice</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setFlashIndex(0);
                setFlashFlipped(false);
                setPhase('flashcard');
              }}
              style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <Feather name="layers" size={18} color="#fff" />
              <Text style={s.actionBtnText}>Study with Flashcards</Text>
            </Pressable>
          </View>

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
        <BadgeCelebrationModal enabled={badgeReady} />
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
              s.scoreCircleOuter,
              { backgroundColor: (passed ? colors.success : colors.error) + '15' },
            ]}>
              <View style={[
                s.scoreCircle,
                {
                  backgroundColor: passed ? SUCCESS_TINT : ERROR_TINT,
                  borderColor: passed ? colors.success : colors.error,
                  shadowColor: passed ? colors.success : colors.error,
                },
              ]}>
                <Text style={[s.scorePct, { color: passed ? colors.success : colors.error }]}>{pct}%</Text>
                <Text style={[s.scoreLabel, { color: passed ? colors.success : colors.error }]}>
                  {passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
            <Text style={[s.scoreHeading, { color: colors.text }]}>
              {passed ? 'Great job!' : 'Keep Practicing'}
            </Text>
            <Text style={[s.scoreSubtitle, { color: colors.textSecondary }]}>
              {quiz.title} · {passed ? 'You passed!' : '70% needed to pass'}
            </Text>
          </View>

          <AdBanner style={{ marginBottom: 8 }} />

          {/* Coins earned */}
          {pendingCoins > 0 && (
            <View style={[s.rewardBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <View style={[s.rewardIconWrap, { backgroundColor: colors.warning + '28' }]}>
                <Feather name="zap" size={20} color={colors.warning} />
              </View>
              <View style={s.rewardTextBlock}>
                <Text style={[s.rewardTitle, { color: colors.warning }]}>+{pendingCoins} Coins Earned!</Text>
                <Text style={[s.rewardSub, { color: colors.textSecondary }]}>Added to your wallet</Text>
              </View>
            </View>
          )}

          {/* Challenge beaten */}
          {pct >= (CHALLENGE_SCORES[quiz.id] ?? 70) && (
            <View style={[s.rewardBanner, { backgroundColor: '#28C76F18', borderColor: '#28C76F44' }]}>
              <View style={[s.rewardIconWrap, { backgroundColor: '#28C76F28' }]}>
                <Feather name="award" size={20} color="#28C76F" />
              </View>
              <View style={s.rewardTextBlock}>
                <Text style={[s.rewardTitle, { color: '#28C76F' }]}>Challenge Beaten! 🏆</Text>
                <Text style={[s.rewardSub, { color: colors.textSecondary }]}>You beat the CPU target score</Text>
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

  // ── FLASHCARD ─────────────────────────────────────────────────────────────
  if (phase === 'flashcard') {
    const flashQuestion = questions[flashIndex];
    return (
      <SafeAreaView style={[s.flex, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.quizHeader, { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={exitAndReset} style={s.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={[s.backLabel, { color: colors.textSecondary }]}>Exit</Text>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.resultsTitle, { color: colors.text }]}>Flashcards</Text>
          </View>
          <View style={[s.flashModeBadge, { backgroundColor: colors.primaryLight }]}>
            <Feather name="layers" size={13} color={colors.primary} />
            <Text style={[s.flashModeBadgeText, { color: colors.primary }]}>Study</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={s.flashProgressRow}>
          <ProgressBar progress={(flashIndex + 1) / questions.length} height={5} />
          <Text style={[s.flashProgressText, { color: colors.textSecondary }]}>
            {flashIndex + 1} / {questions.length}
          </Text>
        </View>

        {/* Card */}
        <FlashCard
          question={flashQuestion}
          isFlipped={flashFlipped}
          onFlip={() => setFlashFlipped((f) => !f)}
          cardIndex={flashIndex}
          total={questions.length}
        />

        {/* Navigation */}
        <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
          <Button
            title="Previous"
            variant="outline"
            disabled={flashIndex === 0}
            onPress={() => { setFlashIndex((i) => i - 1); setFlashFlipped(false); }}
            style={{ flex: 1 }}
          />
          {flashIndex < questions.length - 1 ? (
            <Button
              title="Next"
              onPress={() => { setFlashIndex((i) => i + 1); setFlashFlipped(false); }}
              style={{ flex: 1 }}
            />
          ) : (
            <Button title="Done" onPress={exitAndReset} style={{ flex: 1 }} />
          )}
        </View>
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
            <Feather name="check-circle" size={13} color={colors.primary} />
            <Text style={[s.runningScoreText, { color: colors.primary }]}>{runningScore}</Text>
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
            onReport={!isReview ? () => setShowReport(true) : undefined}
          />
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
        {/* Left — Previous */}
        {currentQuestionIndex > 0 ? (
          <Pressable
            onPress={handlePrevious}
            style={({ pressed }) => [s.navBtn, s.navBtnOutline, { borderColor: colors.surfaceBorder, backgroundColor: pressed ? colors.primaryLight : colors.surface }]}
          >
            <Text style={[s.navBtnText, { color: colors.text }]}>{'<< '}Previous</Text>
          </Pressable>
        ) : (
          <View style={s.navBtnPlaceholder} />
        )}

        {/* Right — Next / Prompt */}
        {isReview ? (
          isLastQuestion ? (
            <Pressable
              onPress={exitAndReset}
              style={({ pressed }) => [s.navBtn, { backgroundColor: pressed ? colors.primary + 'CC' : colors.primary }]}
            >
              <Text style={[s.navBtnText, { color: '#fff' }]}>Done{' >>'}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => { setShowFeedback(true); nextQuestion(); }}
              style={({ pressed }) => [s.navBtn, { backgroundColor: pressed ? colors.primary + 'CC' : colors.primary }]}
            >
              <Text style={[s.navBtnText, { color: '#fff' }]}>Next{' >>'}</Text>
            </Pressable>
          )
        ) : showFeedback && hasAnsweredCurrent ? (
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [s.navBtn, { backgroundColor: pressed ? colors.primary + 'CC' : colors.primary }]}
          >
            <Text style={[s.navBtnText, { color: '#fff' }]}>
              {isLastQuestion ? 'See Results >>' : 'Next >>'}
            </Text>
          </Pressable>
        ) : (
          <View style={s.promptWrap}>
            <Text style={[s.promptText, { color: colors.textSecondary }]}>Select an answer above</Text>
          </View>
        )}
      </View>

      {/* Report question modal */}
      <Modal
        visible={showReport}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReport(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowReport(false)}>
          <Pressable style={[s.reportModal, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {reportSubmitted ? (
              <View style={s.reportThanks}>
                <View style={[s.reportThanksIcon, { backgroundColor: colors.success + '22' }]}>
                  <Feather name="check-circle" size={36} color={colors.success} />
                </View>
                <Text style={[s.reportThanksTitle, { color: colors.text }]}>Thank you!</Text>
                <Text style={[s.reportThanksSub, { color: colors.textSecondary }]}>
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
    borderRadius: 16, borderWidth: 1, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  courseStrip: { height: 5 },
  courseCardBody: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16, padding: 18,
  },
  courseIconWrap: {
    width: 68, height: 68, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  courseTextBlock: { flex: 1 },
  courseTitle: { fontFamily: F.bold, fontSize: 18, lineHeight: 26, marginBottom: 5 },
  courseDesc:  { fontFamily: F.regular, fontSize: 13, lineHeight: 19 },
  diffChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 8,
  },
  diffChipDot: { width: 6, height: 6, borderRadius: 3 },
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

  // Action buttons row (Start Practice + Study with Flashcards side by side)
  actionRow: {
    flexDirection: 'row', gap: 10,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, height: 48, borderRadius: 10,
    shadowColor: '#5E50EE', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  actionBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 13 },

  // Flashcard mode header badge
  flashModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 16,
  },
  flashModeBadgeText: { fontFamily: F.semiBold, fontSize: 12 },

  // Flashcard progress
  flashProgressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  flashProgressText: { fontFamily: F.semiBold, fontSize: 12, minWidth: 44, textAlign: 'right' },

  // ── Results ──
  resultsHeader: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, paddingRight: 16,
  },
  resultsTitle: { flex: 1, textAlign: 'center', fontFamily: F.semiBold, fontSize: 17 },
  resultsPad:   { padding: 20, paddingTop: 16 },

  scoreCenter: { alignItems: 'center', marginBottom: 24 },
  scoreCircleOuter: {
    width: 148, height: 148, borderRadius: 74,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 118, height: 118, borderRadius: 59,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4,
    shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  scorePct:      { fontFamily: F.bold, fontSize: 36 },
  scoreLabel:    { fontFamily: F.semiBold, fontSize: 11, letterSpacing: 1, marginTop: -2 },
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

  // Reward banners (coins earned / challenge beaten)
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rewardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rewardTextBlock: { flex: 1 },
  rewardTitle:     { fontFamily: F.bold,    fontSize: 14, marginBottom: 2 },
  rewardSub:       { fontFamily: F.regular, fontSize: 12 },

  // Report modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  reportModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 0,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportTitle: { fontFamily: F.bold, fontSize: 17 },
  reportSub:   { fontFamily: F.regular, fontSize: 13, marginBottom: 16 },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportOptionText: { fontFamily: F.medium, flex: 1, fontSize: 14 },
  reportThanks: { alignItems: 'center', paddingVertical: 16, gap: 10 },
  reportThanksIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportThanksTitle: { fontFamily: F.bold,    fontSize: 20 },
  reportThanksSub:   { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reportCloseBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reportCloseBtnText: { fontFamily: F.semiBold, color: '#fff', fontSize: 15 },

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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, gap: 12, borderTopWidth: 1, paddingBottom: 32,
  },
  navBtn: {
    height: 46, paddingHorizontal: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 140,
  },
  navBtnOutline: { borderWidth: 1 },
  navBtnPlaceholder: { minWidth: 140 },
  navBtnText: { fontFamily: F.semiBold, fontSize: 14 },
  promptWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  promptText: { fontFamily: F.medium, fontSize: 14 },
});
