import type { Quiz } from '@/types';

export function getPlayableQuestionCount(quiz: Quiz) {
  const fixedCount = typeof quiz.fixedQuestionCount === 'number' ? Math.max(0, Math.round(quiz.fixedQuestionCount)) : 0;
  if (fixedCount > 0) return fixedCount;
  return Math.max(0, Math.round(quiz.questionCount));
}
