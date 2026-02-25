import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
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

const QUESTION_TIME = 30; // seconds per question

type Phase = 'intro' | 'quiz' | 'review' | 'results';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors  = useThemeColors();
  const [phase, setPhase]               = useState<Phase>('intro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [runningScore, setRunningScore] = useState(0);

  // Timer state
  const [timeLeft, setTimeLeft]         = useState(QUESTION_TIME);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lifelines
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptions, setHiddenOptions]   = useState<string[]>([]);
  const [skipsLeft, setSkipsLeft]           = useState(3);

  const quiz      = quizzes.find((q) => q.id === id);
  const questions = quizQuestions[id ?? ''] ?? [];

  const { currentQuestionIndex, selectedAnswers, selectAnswer, nextQuestion, previousQuestion, goToQuestion, reset } = useQuizStore();
  const addResult      = useProgressStore((s) => s.addResult);
  const { showAd }     = useInterstitialAd();
  const toggleBookmark = useBookmarkStore((s) => s.toggle);
  const isBookmarked   = useBookmarkStore((s) => s.isBookmarked);

  const currentQuestion    = questions[currentQuestionIndex];
  const answeredCount      = Object.keys(selectedAnswers).length;
  const isLastQuestion     = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;

  // ── Timer ──────────────────────────────────────────────────────────────────
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
          // Time's up — auto-advance without marking an answer
          setShowFeedback(false);
          if (isLastQuestion) {
            finishQuiz();
          } else {
            nextQuestion();
          }
          return QUESTION_TIME;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, showFeedback, currentQuestionIndex]);

  // Reset timer + hidden options on question change
  useEffect(() => {
    resetTimer();
    setHiddenOptions([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex]);

  // ── Score ──────────────────────────────────────────────────────────────────
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
    addResult({ quizId: id ?? '', score, totalQuestions: questions.length, timeTaken: 0, answers: selectedAnswers, completedAt: new Date().toISOString() });
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

  // ── Lifelines ──────────────────────────────────────────────────────────────
  const handleFiftyFifty = () => {
    if (fiftyFiftyUsed || showFeedback || !currentQuestion) return;
    const wrongOptions = currentQuestion.options
      .filter((o) => o.id !== currentQuestion.correctOptionId)
      .map((o) => o.id);
    // Remove 2 random wrong options
    const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
    setFiftyFiftyUsed(true);
  };

  const handleSkip = () => {
    if (skipsLeft <= 0 || showFeedback) return;
    setSkipsLeft((s) => s - 1);
    setShowFeedback(false);
    if (isLastQuestion) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  };

  // ── Timer color ────────────────────────────────────────────────────────────
  const timerColor = timeLeft <= 10 ? '#FF4C51' : timeLeft <= 20 ? '#FF9F43' : '#28C76F';
  const timerProgress = timeLeft / QUESTION_TIME;

  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-app-bg justify-center items-center">
        <Feather name="alert-circle" size={48} color={colors.textSecondary} />
        <Text className="text-lg text-app-text mt-4">Quiz not found</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24, paddingHorizontal: 32 }} />
      </SafeAreaView>
    );
  }

  // ── INTRO ────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView className="flex-1 bg-app-bg">
        {/* Back header */}
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>Back</Text>
        </Pressable>
        <View className="flex-1 px-6 pb-6 justify-center">

          <View className="items-center">
            <View className="w-20 h-20 rounded-3xl bg-app-primary-faint dark:bg-app-primary-faint-dark items-center justify-center mb-5">
              <Feather name={quiz.icon as any} size={36} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-app-text dark:text-app-text-dark text-center">{quiz.title}</Text>
            <Text className="text-[15px] text-app-muted dark:text-app-muted-dark text-center mt-2 leading-[22px] px-5">
              {quiz.description}
            </Text>
          </View>

          <View className="flex-row justify-center gap-6 mt-8">
            {[
              { icon: 'help-circle', val: questions.length, label: 'Questions' },
              { icon: 'clock',       val: `${quiz.duration} min`, label: 'Duration' },
              { icon: 'bar-chart',   val: quiz.difficulty, label: 'Level' },
            ].map((s) => (
              <View key={s.label} className="items-center">
                <Feather name={s.icon as any} size={22} color={colors.primary} />
                <Text className="text-[15px] font-semibold text-app-text dark:text-app-text-dark mt-1.5">{s.val}</Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Lifelines info */}
          <View className="mt-6 gap-2">
            <View className="flex-row items-center justify-center gap-6 bg-app-surface dark:bg-app-surface-dark p-3 rounded-xl border border-app-border dark:border-app-border-dark">
              <View className="flex-row items-center gap-1.5">
                <Text style={{ fontSize: 14, fontWeight: '700' }}>½</Text>
                <Text className="text-[12px] text-app-muted dark:text-app-muted-dark">50/50 × 1</Text>
              </View>
              <View className="w-px h-4 bg-app-border dark:bg-app-border-dark" />
              <View className="flex-row items-center gap-1.5">
                <Feather name="skip-forward" size={14} color={colors.textSecondary} />
                <Text className="text-[12px] text-app-muted dark:text-app-muted-dark">Skip × 3</Text>
              </View>
              <View className="w-px h-4 bg-app-border dark:bg-app-border-dark" />
              <View className="flex-row items-center gap-1.5">
                <Feather name="clock" size={14} color={colors.textSecondary} />
                <Text className="text-[12px] text-app-muted dark:text-app-muted-dark">30s / Q</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-2 mt-4 bg-app-primary-faint dark:bg-app-primary-faint-dark p-3 rounded-xl">
            <Feather name="eye" size={16} color={colors.primary} />
            <Text className="text-[13px] text-app-primary font-semibold">
              Practice Mode — answers & explanations shown instantly
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
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score      = calculateScore();
    const pct        = Math.round((score / questions.length) * 100);
    const passed     = pct >= 70;
    const unanswered = questions.length - answeredCount;

    return (
      <SafeAreaView className="flex-1 bg-app-bg">
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={exitAndReset}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
            <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>Back</Text>
          </Pressable>
          <Text className="flex-1 text-center text-[17px] font-semibold text-app-text">Scoreboard</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
          {/* Score circle */}
          <View className="items-center mb-6">
            <View
              className={`w-[110px] h-[110px] rounded-full ${passed ? 'bg-app-success-tint' : 'bg-app-error-tint'} items-center justify-center mb-4`}
              style={{ borderWidth: 3, borderColor: passed ? '#28C76F' : '#FF4C51' }}
            >
              <Text className={`text-4xl font-extrabold ${passed ? 'text-app-success' : 'text-app-error'}`}>{pct}%</Text>
            </View>
            <Text className="text-[22px] font-bold text-app-text dark:text-app-text-dark">
              {passed ? '🎉 Passed!' : 'Keep Practicing'}
            </Text>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
              {quiz.title} · {passed ? 'Great work!' : '70% needed to pass'}
            </Text>
          </View>

          <AdBanner style={{ marginBottom: 8 }} />

          <View className="flex-row gap-2.5 mb-6">
            {[
              { icon: 'check-circle', val: score,               label: 'Correct', iconColor: colors.success,       textClass: 'text-app-success' },
              { icon: 'x-circle',     val: answeredCount-score, label: 'Wrong',   iconColor: colors.error,         textClass: 'text-app-error' },
              { icon: 'minus-circle', val: unanswered,          label: 'Skipped', iconColor: colors.textSecondary, textClass: 'text-app-muted dark:text-app-muted-dark' },
            ].map((s) => (
              <Card key={s.label} className="flex-1 items-center" style={{ paddingVertical: 14 }}>
                <Feather name={s.icon as any} size={20} color={s.iconColor} />
                <Text className={`text-[22px] font-bold mt-1 ${s.textClass}`}>{s.val}</Text>
                <Text className="text-[11px] text-app-muted dark:text-app-muted-dark">{s.label}</Text>
              </Card>
            ))}
          </View>

          <Text className="text-base font-bold text-app-text dark:text-app-text-dark mb-3">Question Breakdown</Text>
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect  = userAnswer === q.correctOptionId;
            const skipped    = userAnswer === undefined;
            return (
              <Pressable key={q.id} onPress={() => { goToQuestion(idx); setShowFeedback(true); setPhase('review'); }}>
                <Card style={{ marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full ${skipped ? 'bg-app-border dark:bg-app-border-dark' : isCorrect ? 'bg-app-success-tint' : 'bg-app-error-tint'} items-center justify-center`}>
                      {skipped
                        ? <Text className="text-[13px] font-semibold text-app-muted dark:text-app-muted-dark">{idx + 1}</Text>
                        : <Feather name={isCorrect ? 'check' : 'x'} size={16} color={isCorrect ? colors.success : colors.error} />
                      }
                    </View>
                    <Text className="flex-1 text-sm text-app-text dark:text-app-text-dark leading-5" numberOfLines={2}>{q.text}</Text>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          <View className="mt-4 gap-3">
            <Button title="Review All Answers" variant="secondary" onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }} size="lg" />
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
    <SafeAreaView className="flex-1 bg-app-bg">
      {/* Header row */}
      <View className="flex-row items-center px-4 pt-2 pb-1 gap-3">
        <Pressable
          onPress={isReview ? () => setPhase('results') : handleExit}
          hitSlop={8}
          style={isReview ? { flexDirection: 'row', alignItems: 'center', gap: 4 } : {}}
        >
          <Feather name={isReview ? 'arrow-left' : 'x'} size={isReview ? 22 : 24} color={colors.text} />
          {isReview && (
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>Results</Text>
          )}
        </Pressable>
        <View className="flex-1">
          <ProgressBar progress={(currentQuestionIndex + 1) / questions.length} height={6} />
        </View>
        <Text className="text-sm font-semibold text-app-muted dark:text-app-muted-dark min-w-[36px] text-right">
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
        {/* Bookmark button */}
        {currentQuestion && (
          <Pressable onPress={() => toggleBookmark(currentQuestion.id)} hitSlop={8}>
            <Feather name="bookmark" size={20} color={bookmarked ? '#7367F0' : colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Timer bar (quiz phase only) */}
      {!isReview && (
        <View className="px-4 pb-1">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, height: 4, backgroundColor: '#DBDADE', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ width: `${timerProgress * 100}%`, height: '100%', backgroundColor: timerColor, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: timerColor, minWidth: 28, textAlign: 'right' }}>
              {timeLeft}s
            </Text>
          </View>
        </View>
      )}

      {/* Lifelines row (quiz phase only, before answer) */}
      {!isReview && !showFeedback && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
          {/* 50/50 */}
          <Pressable
            onPress={handleFiftyFifty}
            disabled={fiftyFiftyUsed}
            style={{
              opacity: fiftyFiftyUsed ? 0.35 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.surfaceBorder,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: fiftyFiftyUsed ? '#A5A3AE' : '#FF9F43' }}>½</Text>
            <Text style={{ fontSize: 12, color: fiftyFiftyUsed ? '#A5A3AE' : colors.text }}>50/50</Text>
          </Pressable>

          {/* Skip */}
          <Pressable
            onPress={handleSkip}
            disabled={skipsLeft <= 0}
            style={{
              opacity: skipsLeft <= 0 ? 0.35 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.surfaceBorder,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Feather name="skip-forward" size={14} color={skipsLeft > 0 ? '#7367F0' : '#A5A3AE'} />
            <Text style={{ fontSize: 12, color: skipsLeft > 0 ? colors.text : '#A5A3AE' }}>Skip ({skipsLeft})</Text>
          </Pressable>

          {/* Running score */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <Feather name="check-circle" size={13} color={colors.success} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#28C76F' }}>{runningScore}</Text>
          </View>
        </View>
      )}

      {/* Question */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
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
      <View
        className="flex-row p-4 gap-3 bg-app-bg dark:bg-app-bg-dark border-t border-app-border dark:border-app-border-dark"
        style={{ paddingBottom: 32 }}
      >
        {currentQuestionIndex > 0 && (
          <Button title="Previous" variant="outline" onPress={handlePrevious} style={{ flex: 1 }} />
        )}
        {isReview ? (
          isLastQuestion
            ? <Button title="Done" onPress={exitAndReset} style={{ flex: 1 }} />
            : <Button title="Next" onPress={() => { setShowFeedback(true); nextQuestion(); }} style={{ flex: 1 }} />
        ) : showFeedback && hasAnsweredCurrent ? (
          <Button title={isLastQuestion ? 'See Results' : 'Next Question'} onPress={handleNext} style={{ flex: 1 }} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-app-muted dark:text-app-muted-dark">Select an answer above</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
