import { create } from 'zustand';
import type { Progress, QuizResult } from '@/types';

interface ProgressState {
  progress: Progress;
  addResult: (result: QuizResult) => void;
  reset: () => void;
}

const initialProgress: Progress = {
  totalQuizzes: 0,
  completedQuizzes: 0,
  averageScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  recentResults: [],
};

export const useProgressStore = create<ProgressState>((set) => ({
  progress: initialProgress,

  addResult: (result) =>
    set((state) => {
      const results = [result, ...state.progress.recentResults].slice(0, 20);
      const completed = state.progress.completedQuizzes + 1;
      const totalScore =
        state.progress.averageScore * state.progress.completedQuizzes +
        (result.score / result.totalQuestions) * 100;

      return {
        progress: {
          ...state.progress,
          completedQuizzes: completed,
          averageScore: Math.round(totalScore / completed),
          recentResults: results,
        },
      };
    }),

  reset: () => set({ progress: initialProgress }),
}));
