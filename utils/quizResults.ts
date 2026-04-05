import { quizQuestions, quizzes } from '@/data/quizzes';
import type { QuizResult } from '@/types';

function getManagedQuiz(quizId: string) {
  return quizzes.find((quiz) => quiz.id === quizId);
}

function getManagedQuestionSet(quizId: string) {
  const quiz = getManagedQuiz(quizId);
  const rawQuestions = quizQuestions[quizId] ?? [];
  const fixedQuestionCount = Math.max(0, quiz?.fixedQuestionCount ?? 0);
  return fixedQuestionCount > 0
    ? rawQuestions.slice(0, Math.min(fixedQuestionCount, rawQuestions.length))
    : rawQuestions;
}

export function getResultPercent(result: QuizResult) {
  const questions = getManagedQuestionSet(result.quizId);
  const quiz = getManagedQuiz(result.quizId);

  if (questions.length === 0 || !result.answers || Object.keys(result.answers).length === 0) {
    const safeTotal = Math.max(1, result.totalQuestions);
    return Math.max(0, Math.round((result.score / safeTotal) * 100));
  }

  const correctPoints = quiz?.correctScore ?? 1;
  const wrongPoints = quiz?.wrongScore ?? 0;
  const maxPoints = Math.max(1, questions.length * Math.max(1, correctPoints));
  const earnedPoints = questions.reduce((sum, question) => {
    const answer = result.answers[question.id];
    if (answer === undefined) return sum;
    return sum + (answer === question.correctOptionId ? correctPoints : wrongPoints);
  }, 0);

  return Math.max(0, Math.round((earnedPoints / maxPoints) * 100));
}
