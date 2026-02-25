import { useState, useCallback } from 'react';
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
import { quizzes, quizQuestions } from '@/data/quizzes';

type Phase = 'intro' | 'quiz' | 'review' | 'results';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors  = useThemeColors();
  const [phase, setPhase]             = useState<Phase>('intro');
  const [showFeedback, setShowFeedback] = useState(false);
  const [runningScore, setRunningScore] = useState(0);

  const quiz      = quizzes.find((q) => q.id === id);
  const questions = quizQuestions[id ?? ''] ?? [];

  const { currentQuestionIndex, selectedAnswers, selectAnswer, nextQuestion, previousQuestion, goToQuestion, reset } = useQuizStore();
  const addResult  = useProgressStore((s) => s.addResult);
  const { showAd } = useInterstitialAd();

  const currentQuestion   = questions[currentQuestionIndex];
  const answeredCount     = Object.keys(selectedAnswers).length;
  const isLastQuestion    = currentQuestionIndex === questions.length - 1;
  const hasAnsweredCurrent = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;

  const calculateScore = useCallback(() => {
    return questions.reduce((s, q) => (selectedAnswers[q.id] === q.correctOptionId ? s + 1 : s), 0);
  }, [questions, selectedAnswers]);

  const handleSelectAnswer = (optionId: string) => {
    if (showFeedback) return;
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
    const score = calculateScore();
    addResult({ quizId: id ?? '', score, totalQuestions: questions.length, timeTaken: 0, answers: selectedAnswers, completedAt: new Date().toISOString() });
    setPhase('results');
  };

  const exitAndReset = () => { reset(); setShowFeedback(false); setRunningScore(0); router.back(); };

  const handleExit = () => {
    if (answeredCount === 0) { exitAndReset(); return; }
    Alert.alert('End Practice?', `You've answered ${answeredCount}/${questions.length} questions.`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'See Scoreboard', onPress: () => finishQuiz() },
      { text: 'Exit', style: 'destructive', onPress: exitAndReset },
    ]);
  };

  if (!quiz || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark justify-center items-center">
        <Feather name="alert-circle" size={48} color={colors.textSecondary} />
        <Text className="text-lg text-app-text dark:text-app-text-dark mt-4">Quiz not found</Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-1">Questions coming soon</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" style={{ marginTop: 24, paddingHorizontal: 32 }} />
      </SafeAreaView>
    );
  }

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
        <View className="flex-1 p-6 justify-center">
          <Pressable onPress={() => router.back()} className="absolute top-4 left-5">
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>

          <View className="items-center">
            <View className="w-20 h-20 rounded-3xl bg-app-primary-faint dark:bg-app-primary-faint-dark items-center justify-center mb-5">
              <Feather name={quiz.icon as any} size={36} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-app-text dark:text-app-text-dark text-center">
              {quiz.title}
            </Text>
            <Text className="text-[15px] text-app-muted dark:text-app-muted-dark text-center mt-2 leading-[22px] px-5">
              {quiz.description}
            </Text>
          </View>

          {/* Quiz stats */}
          <View className="flex-row justify-center gap-6 mt-8">
            {[
              { icon: 'help-circle', val: questions.length,  label: 'Questions' },
              { icon: 'clock',       val: `${quiz.duration} min`, label: 'Duration' },
              { icon: 'bar-chart',   val: quiz.difficulty,   label: 'Level' },
            ].map((s) => (
              <View key={s.label} className="items-center">
                <Feather name={s.icon as any} size={22} color={colors.primary} />
                <Text className="text-[15px] font-semibold text-app-text dark:text-app-text-dark mt-1.5">{s.val}</Text>
                <Text className="text-xs text-app-muted dark:text-app-muted-dark">{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Practice mode notice */}
          <View className="flex-row items-center justify-center gap-2 mt-6 bg-app-primary-faint dark:bg-app-primary-faint-dark p-3 rounded-xl">
            <Feather name="eye" size={16} color={colors.primary} />
            <Text className="text-[13px] text-app-primary font-semibold">
              Practice Mode — answers & explanations shown instantly
            </Text>
          </View>

          <Button
            title="Start Practice"
            onPress={() => { reset(); setShowFeedback(false); setRunningScore(0); setPhase('quiz'); }}
            size="lg"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const score    = calculateScore();
    const pct      = Math.round((score / questions.length) * 100);
    const passed   = pct >= 70;
    const unanswered = questions.length - answeredCount;
    const circleClass = passed
      ? 'bg-app-success-tint'
      : 'bg-app-error-tint';
    const pctClass = passed ? 'text-app-success' : 'text-app-error';

    return (
      <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
        <View className="flex-row items-center p-4">
          <Pressable onPress={exitAndReset}>
            <Feather name="x" size={24} color={colors.text} />
          </Pressable>
          <Text className="flex-1 text-center text-[17px] font-semibold text-app-text dark:text-app-text-dark">
            Scoreboard
          </Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
          {/* Score circle */}
          <View className="items-center mb-6">
            <View className={`w-[100px] h-[100px] rounded-full ${circleClass} items-center justify-center mb-4`}>
              <Text className={`text-4xl font-extrabold ${pctClass}`}>{pct}%</Text>
            </View>
            <Text className="text-[22px] font-bold text-app-text dark:text-app-text-dark">
              {passed ? 'Passed!' : 'Keep Practicing'}
            </Text>
            <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
              {quiz.title} — {passed ? 'Great work!' : 'You need 70% to pass'}
            </Text>
          </View>

          {/* Ad Banner — displayed after quiz completion */}
          <AdBanner style={{ marginBottom: 8 }} />

          {/* Stats row */}
          <View className="flex-row gap-2.5 mb-6">
            {[
              { icon: 'check-circle', val: score,                    label: 'Correct', cls: 'text-app-success', iconColor: colors.success },
              { icon: 'x-circle',     val: answeredCount - score,    label: 'Wrong',   cls: 'text-app-error',   iconColor: colors.error },
              { icon: 'minus-circle', val: unanswered,               label: 'Skipped', cls: 'text-app-muted dark:text-app-muted-dark', iconColor: colors.textSecondary },
            ].map((s) => (
              <Card key={s.label} className="flex-1 items-center" style={{ paddingVertical: 14 }}>
                <Feather name={s.icon as any} size={20} color={s.iconColor} />
                <Text className={`text-[22px] font-bold mt-1 ${s.cls}`}>{s.val}</Text>
                <Text className="text-[11px] text-app-muted dark:text-app-muted-dark">{s.label}</Text>
              </Card>
            ))}
          </View>

          {/* Question breakdown */}
          <Text className="text-base font-bold text-app-text dark:text-app-text-dark mb-3">
            Question Breakdown
          </Text>
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[q.id];
            const isCorrect  = userAnswer === q.correctOptionId;
            const skipped    = userAnswer === undefined;
            const circleStyle = skipped
              ? 'bg-app-border dark:bg-app-border-dark'
              : isCorrect
                ? 'bg-app-success-tint'
                : 'bg-app-error-tint';

            return (
              <Pressable
                key={q.id}
                onPress={() => { goToQuestion(idx); setShowFeedback(true); setPhase('review'); }}
              >
                <Card style={{ marginBottom: 8, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-full ${circleStyle} items-center justify-center`}>
                      {skipped
                        ? <Text className="text-[13px] font-semibold text-app-muted dark:text-app-muted-dark">{idx + 1}</Text>
                        : <Feather name={isCorrect ? 'check' : 'x'} size={16} color={isCorrect ? colors.success : colors.error} />
                      }
                    </View>
                    <Text className="flex-1 text-sm text-app-text dark:text-app-text-dark leading-5" numberOfLines={2}>
                      {q.text}
                    </Text>
                    <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {/* Action buttons */}
          <View className="mt-4 gap-3">
            <Button title="Review All Answers" variant="secondary" onPress={() => { goToQuestion(0); setShowFeedback(true); setPhase('review'); }} size="lg" />
            <Button title="Done" onPress={exitAndReset} size="lg" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── QUIZ / REVIEW ────────────────────────────────────────────────────────────
  const isReview = phase === 'review';

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      {/* Header */}
      <View className="flex-row items-center p-4 gap-3">
        <Pressable onPress={isReview ? exitAndReset : handleExit}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <ProgressBar progress={(currentQuestionIndex + 1) / questions.length} height={6} />
        </View>
        <Text className="text-sm font-semibold text-app-muted dark:text-app-muted-dark">
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Running score badge (quiz phase only) */}
      {!isReview && (
        <View className="flex-row justify-center gap-4 px-5 pb-1">
          <View className="flex-row items-center gap-1.5">
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text className="text-[13px] font-semibold text-app-success">{runningScore} correct</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Feather name="x-circle" size={14} color={colors.error} />
            <Text className="text-[13px] font-semibold text-app-error">{answeredCount - runningScore} wrong</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Feather name="minus-circle" size={14} color={colors.textSecondary} />
            <Text className="text-[13px] font-semibold text-app-muted dark:text-app-muted-dark">{questions.length - answeredCount} left</Text>
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
