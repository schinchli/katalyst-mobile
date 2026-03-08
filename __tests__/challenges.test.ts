/**
 * challenges data — unit tests
 * Covers: CHALLENGE_SCORES and CPU_NAMES integrity.
 */
import { CHALLENGE_SCORES, CPU_NAMES } from '@/data/challenges';
import { quizzes } from '@/data/quizzes';

describe('CHALLENGE_SCORES', () => {
  it('has an entry for every non-premium quiz', () => {
    const freeQuizIds = quizzes.filter((q) => !q.isPremium).map((q) => q.id);
    freeQuizIds.forEach((id) => {
      expect(CHALLENGE_SCORES[id]).toBeDefined();
    });
  });

  it('all scores are between 1 and 100', () => {
    Object.values(CHALLENGE_SCORES).forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('all scores are integers', () => {
    Object.values(CHALLENGE_SCORES).forEach((score) => {
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});

describe('CPU_NAMES', () => {
  it('has a CPU name for every quiz that has a challenge score', () => {
    Object.keys(CHALLENGE_SCORES).forEach((quizId) => {
      expect(CPU_NAMES[quizId]).toBeTruthy();
    });
  });

  it('all CPU names are non-empty strings', () => {
    Object.values(CPU_NAMES).forEach((name) => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });
  });

  it('has the same set of keys as CHALLENGE_SCORES', () => {
    const scoreKeys  = new Set(Object.keys(CHALLENGE_SCORES));
    const nameKeys   = new Set(Object.keys(CPU_NAMES));
    expect(scoreKeys.size).toBe(nameKeys.size);
    scoreKeys.forEach((k) => expect(nameKeys.has(k)).toBe(true));
  });
});
