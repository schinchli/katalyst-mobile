/**
 * quizStore — unit tests
 * Covers: selectAnswer, nextQuestion, previousQuestion, goToQuestion, reset,
 *         setTimeRemaining, setSubmitting.
 */
import { useQuizStore } from '@/stores/quizStore';

beforeEach(() => {
  useQuizStore.getState().reset();
});

describe('initial state', () => {
  it('starts at question index 0', () => {
    expect(useQuizStore.getState().currentQuestionIndex).toBe(0);
  });

  it('starts with empty selectedAnswers', () => {
    expect(useQuizStore.getState().selectedAnswers).toEqual({});
  });

  it('starts with timeRemaining 0', () => {
    expect(useQuizStore.getState().timeRemaining).toBe(0);
  });

  it('starts with isSubmitting false', () => {
    expect(useQuizStore.getState().isSubmitting).toBe(false);
  });
});

describe('selectAnswer', () => {
  it('records the selected option for a question', () => {
    useQuizStore.getState().selectAnswer('q1', 'option-a');
    expect(useQuizStore.getState().selectedAnswers['q1']).toBe('option-a');
  });

  it('overwrites a previous answer for the same question', () => {
    useQuizStore.getState().selectAnswer('q1', 'option-a');
    useQuizStore.getState().selectAnswer('q1', 'option-b');
    expect(useQuizStore.getState().selectedAnswers['q1']).toBe('option-b');
  });

  it('records answers for multiple questions independently', () => {
    useQuizStore.getState().selectAnswer('q1', 'option-a');
    useQuizStore.getState().selectAnswer('q2', 'option-c');
    expect(useQuizStore.getState().selectedAnswers['q1']).toBe('option-a');
    expect(useQuizStore.getState().selectedAnswers['q2']).toBe('option-c');
  });
});

describe('nextQuestion', () => {
  it('increments currentQuestionIndex by 1', () => {
    useQuizStore.getState().nextQuestion();
    expect(useQuizStore.getState().currentQuestionIndex).toBe(1);
  });

  it('increments multiple times correctly', () => {
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().nextQuestion();
    expect(useQuizStore.getState().currentQuestionIndex).toBe(3);
  });
});

describe('previousQuestion', () => {
  it('decrements currentQuestionIndex by 1', () => {
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().previousQuestion();
    expect(useQuizStore.getState().currentQuestionIndex).toBe(1);
  });

  it('does not go below 0', () => {
    useQuizStore.getState().previousQuestion();
    expect(useQuizStore.getState().currentQuestionIndex).toBe(0);
  });

  it('clamps to 0 even when called multiple times at index 0', () => {
    useQuizStore.getState().previousQuestion();
    useQuizStore.getState().previousQuestion();
    useQuizStore.getState().previousQuestion();
    expect(useQuizStore.getState().currentQuestionIndex).toBe(0);
  });
});

describe('goToQuestion', () => {
  it('jumps directly to a specific index', () => {
    useQuizStore.getState().goToQuestion(7);
    expect(useQuizStore.getState().currentQuestionIndex).toBe(7);
  });

  it('can jump back to 0 from any index', () => {
    useQuizStore.getState().goToQuestion(5);
    useQuizStore.getState().goToQuestion(0);
    expect(useQuizStore.getState().currentQuestionIndex).toBe(0);
  });
});

describe('setTimeRemaining', () => {
  it('updates timeRemaining', () => {
    useQuizStore.getState().setTimeRemaining(25);
    expect(useQuizStore.getState().timeRemaining).toBe(25);
  });

  it('can be set to 0', () => {
    useQuizStore.getState().setTimeRemaining(30);
    useQuizStore.getState().setTimeRemaining(0);
    expect(useQuizStore.getState().timeRemaining).toBe(0);
  });
});

describe('setSubmitting', () => {
  it('sets isSubmitting to true', () => {
    useQuizStore.getState().setSubmitting(true);
    expect(useQuizStore.getState().isSubmitting).toBe(true);
  });

  it('sets isSubmitting to false', () => {
    useQuizStore.getState().setSubmitting(true);
    useQuizStore.getState().setSubmitting(false);
    expect(useQuizStore.getState().isSubmitting).toBe(false);
  });
});

describe('reset', () => {
  it('clears all state', () => {
    useQuizStore.getState().selectAnswer('q1', 'a');
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().nextQuestion();
    useQuizStore.getState().setTimeRemaining(15);
    useQuizStore.getState().setSubmitting(true);

    useQuizStore.getState().reset();

    const s = useQuizStore.getState();
    expect(s.currentQuestionIndex).toBe(0);
    expect(s.selectedAnswers).toEqual({});
    expect(s.timeRemaining).toBe(0);
    expect(s.isSubmitting).toBe(false);
  });
});
