import { create } from 'zustand';

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string>;
  timeRemaining: number;
  isSubmitting: boolean;

  selectAnswer: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  setTimeRemaining: (time: number) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestionIndex: 0,
  selectedAnswers: {},
  timeRemaining: 0,
  isSubmitting: false,

  selectAnswer: (questionId, optionId) =>
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: optionId },
    })),

  nextQuestion: () =>
    setTimeout(
      () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
      0,
    ),

  previousQuestion: () =>
    setTimeout(
      () =>
        set((state) => ({
          currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1),
        })),
      0,
    ),

  goToQuestion: (index) =>
    setTimeout(() => set({ currentQuestionIndex: index }), 0),

  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  reset: () =>
    set({
      currentQuestionIndex: 0,
      selectedAnswers: {},
      timeRemaining: 0,
      isSubmitting: false,
    }),
}));
