import { quizzes, quizQuestions } from '@/data/quizzes';

describe('Quiz data integrity', () => {
  it('has at least 1 quiz', () => {
    expect(quizzes.length).toBeGreaterThan(0);
  });

  it('every quiz has required fields', () => {
    quizzes.forEach((quiz) => {
      expect(quiz.id).toBeTruthy();
      expect(quiz.title).toBeTruthy();
      expect(quiz.description).toBeTruthy();
      expect(quiz.category).toBeTruthy();
      expect(['beginner', 'intermediate', 'advanced']).toContain(quiz.difficulty);
      expect(quiz.questionCount).toBeGreaterThan(0);
      expect(quiz.duration).toBeGreaterThan(0);
      expect(typeof quiz.isPremium).toBe('boolean');
    });
  });

  it('quiz IDs are unique', () => {
    const ids = quizzes.map((q) => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('quizQuestions exist for each quiz', () => {
    quizzes.forEach((quiz) => {
      const questions = quizQuestions[quiz.id];
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });
  });

  it('every question has the required fields', () => {
    quizzes.forEach((quiz) => {
      const questions = quizQuestions[quiz.id] ?? [];
      questions.forEach((q) => {
        expect(q.id).toBeTruthy();
        expect(q.text).toBeTruthy();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctOptionId).toBeTruthy();
        const correctOption = q.options.find((o) => o.id === q.correctOptionId);
        expect(correctOption).toBeDefined();
      });
    });
  });

  it('question option IDs are unique within a question', () => {
    quizzes.forEach((quiz) => {
      const questions = quizQuestions[quiz.id] ?? [];
      questions.forEach((q) => {
        const optionIds = q.options.map((o) => o.id);
        const unique = new Set(optionIds);
        expect(unique.size).toBe(optionIds.length);
      });
    });
  });

  it('questionCount field matches actual questions array length', () => {
    quizzes.forEach((quiz) => {
      const questions = quizQuestions[quiz.id] ?? [];
      expect(questions.length).toBe(quiz.questionCount);
    });
  });
});
