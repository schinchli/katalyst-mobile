/**
 * dailyChallenge utils — unit tests
 * Covers: getDailyQuizIndex, getDailyQuiz — determinism, boundary cases, free-only filtering.
 */
import { getDailyQuizIndex, getDailyQuiz } from '@/utils/dailyChallenge';
import type { Quiz } from '@/types';

function makeQuiz(id: string, isPremium = false): Quiz {
  return {
    id,
    title:         id,
    description:   '',
    category:      'bedrock',
    difficulty:    'beginner',
    questionCount: 10,
    duration:      15,
    isPremium,
    icon:          'cloud',
  };
}

const FREE_QUIZ_1  = makeQuiz('free-1');
const FREE_QUIZ_2  = makeQuiz('free-2');
const FREE_QUIZ_3  = makeQuiz('free-3');
const PREMIUM_QUIZ = makeQuiz('premium-1', true);

const MIXED_QUIZZES = [FREE_QUIZ_1, PREMIUM_QUIZ, FREE_QUIZ_2, FREE_QUIZ_3];
const ALL_FREE      = [FREE_QUIZ_1, FREE_QUIZ_2, FREE_QUIZ_3];
const ALL_PREMIUM   = [PREMIUM_QUIZ];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getDailyQuizIndex', () => {
  it('returns a valid index within bounds of free quizzes', () => {
    jest.setSystemTime(new Date('2024-06-15'));
    const idx = getDailyQuizIndex(MIXED_QUIZZES);
    const freeCount = MIXED_QUIZZES.filter((q) => !q.isPremium).length; // 3
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(freeCount);
  });

  it('returns 0 when there are no free quizzes', () => {
    jest.setSystemTime(new Date('2024-06-15'));
    const idx = getDailyQuizIndex(ALL_PREMIUM);
    expect(idx).toBe(0);
  });

  it('returns a deterministic index for the same date', () => {
    jest.setSystemTime(new Date('2024-03-21'));
    const idx1 = getDailyQuizIndex(ALL_FREE);
    const idx2 = getDailyQuizIndex(ALL_FREE);
    expect(idx1).toBe(idx2);
  });

  it('returns different indices on different dates', () => {
    jest.setSystemTime(new Date('2024-01-01'));
    const idx1 = getDailyQuizIndex(ALL_FREE);
    jest.setSystemTime(new Date('2024-01-02'));
    const idx2 = getDailyQuizIndex(ALL_FREE);
    // With 3 free quizzes, consecutive days differ (mod 3 of consecutive day-of-year)
    expect(idx1).not.toBe(idx2);
  });

  it('cycles through all free quizzes within N days (N = free quiz count)', () => {
    const freeCount = ALL_FREE.length; // 3
    const seen = new Set<number>();
    for (let d = 0; d < freeCount; d++) {
      jest.setSystemTime(new Date(2024, 0, 1 + d)); // Jan 1, 2, 3
      seen.add(getDailyQuizIndex(ALL_FREE));
    }
    expect(seen.size).toBe(freeCount);
  });
});

describe('getDailyQuiz', () => {
  it('returns a free quiz', () => {
    jest.setSystemTime(new Date('2024-06-15'));
    const quiz = getDailyQuiz(MIXED_QUIZZES);
    expect(quiz.isPremium).toBe(false);
  });

  it('never returns a premium quiz', () => {
    // Test across 30 different days
    for (let d = 0; d < 30; d++) {
      jest.setSystemTime(new Date(2024, 0, 1 + d));
      const quiz = getDailyQuiz(MIXED_QUIZZES);
      expect(quiz.isPremium).toBe(false);
    }
  });

  it('returns first quiz from full list when all quizzes are premium (fallback)', () => {
    jest.setSystemTime(new Date('2024-06-15'));
    const quiz = getDailyQuiz(ALL_PREMIUM);
    // freeQuizzes is empty → idx = 0, freeQuizzes[0] = undefined → fallback to quizList[0]
    expect(quiz).toEqual(PREMIUM_QUIZ);
  });

  it('returns deterministic result for same date', () => {
    jest.setSystemTime(new Date('2024-08-20'));
    const q1 = getDailyQuiz(MIXED_QUIZZES);
    const q2 = getDailyQuiz(MIXED_QUIZZES);
    expect(q1.id).toBe(q2.id);
  });

  it('returns a quiz object with all required fields', () => {
    jest.setSystemTime(new Date('2024-04-01'));
    const quiz = getDailyQuiz(MIXED_QUIZZES);
    expect(quiz.id).toBeTruthy();
    expect(quiz.title).toBeTruthy();
    expect(typeof quiz.isPremium).toBe('boolean');
    expect(typeof quiz.questionCount).toBe('number');
  });
});
