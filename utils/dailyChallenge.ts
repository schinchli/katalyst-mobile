import type { Quiz } from '@/types';

/** Returns an index into quizList that rotates daily (day-of-year based). */
export function getDailyQuizIndex(quizList: Quiz[]): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const freeQuizzes = quizList.filter((q) => !q.isPremium);
  if (freeQuizzes.length === 0) return 0;
  return dayOfYear % freeQuizzes.length;
}

export function getDailyQuiz(quizList: Quiz[]): Quiz {
  const freeQuizzes = quizList.filter((q) => !q.isPremium);
  const idx = getDailyQuizIndex(quizList);
  return freeQuizzes[idx] ?? quizList[0];
}
