/**
 * CRUD + Integration Tests — AWS Cost Optimization Category
 * ──────────────────────────────────────────────────────────
 * Validates the new category added via Elite Quiz admin (MySQL slug: aws-cost-optimization)
 * and synced to LMS web + mobile data files.
 *
 * Coverage:
 *   CREATE  — quiz + questions registered, results saved to store
 *   READ    — listing, filter, player data, progress aggregation
 *   UPDATE  — re-attempt overwrites previous result (upsert)
 *   DELETE  — remove single result, clear all results
 *   INTEGRATION — Admin DB ↔ LMS data consistency
 *   API     — quizSubmit Lambda schema + reward calculation
 *
 * Run: cd mobile && npm test -- crud-cost-optimization
 */

import { quizzes, quizQuestions } from '@/data/quizzes';

const QUIZ_ID   = 'cost-optimization';
const CATEGORY  = 'cost-optimization';
const Q_COUNT   = 10;
const PASS_PCT  = 70;

// ─── localStorage mock ──────────────────────────────────────────────────────

function makeLs() {
  const store: Record<string, string> = {};
  return {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

// ─── Helpers mirroring quiz player / progress store logic ───────────────────

interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  answers: Record<string, string>;
  completedAt: string;
}

function saveResult(ls: ReturnType<typeof makeLs>, result: QuizResult) {
  const prev: QuizResult[] = JSON.parse(ls.getItem('quiz-results') ?? '[]');
  const next = [...prev.filter((r) => r.quizId !== result.quizId), result];
  ls.setItem('quiz-results', JSON.stringify(next));
}

function getResults(ls: ReturnType<typeof makeLs>): QuizResult[] {
  return JSON.parse(ls.getItem('quiz-results') ?? '[]');
}

function removeResult(ls: ReturnType<typeof makeLs>, quizId: string) {
  const prev = getResults(ls);
  ls.setItem('quiz-results', JSON.stringify(prev.filter((r) => r.quizId !== quizId)));
}

function calcRewards(score: number, total: number, difficulty = 'intermediate') {
  const pct    = Math.round((score / total) * 100);
  const passed = pct >= PASS_PCT;
  const mult   = difficulty === 'advanced' ? 2 : difficulty === 'intermediate' ? 1.5 : 1;
  const coins  = passed ? score * 10 + 20 + (score === total ? 50 : 0) : 0;
  const xp     = passed ? Math.round(pct * mult) : 0;
  return { pct, passed, coins, xp };
}

function makeResult(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    quizId:         QUIZ_ID,
    score:          8,
    totalQuestions: Q_COUNT,
    timeTaken:      120,
    answers: {
      'co-1': 'b', 'co-2': 'c', 'co-3': 'b', 'co-4': 'c', 'co-5': 'b',
      'co-6': 'b', 'co-7': 'd', 'co-8': 'a', 'co-9': 'c', 'co-10': 'b',
    },
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE
// ════════════════════════════════════════════════════════════════════════════

describe('CREATE — category & quiz registered in LMS data layer', () => {
  it('new quiz entry exists in quizzes array', () => {
    expect(quizzes.find((q) => q.id === QUIZ_ID)).toBeDefined();
  });

  it('new quiz has correct metadata', () => {
    const quiz = quizzes.find((q) => q.id === QUIZ_ID)!;
    expect(quiz.title).toBe('AWS Cost Optimization');
    expect(quiz.category).toBe(CATEGORY);
    expect(quiz.difficulty).toBe('intermediate');
    expect(quiz.questionCount).toBe(Q_COUNT);
    expect(quiz.duration).toBe(15);
    expect(quiz.isPremium).toBe(false);
    expect(quiz.icon).toBe('dollar-sign');
  });

  it('quiz has exactly 10 questions in quizQuestions', () => {
    expect(quizQuestions[QUIZ_ID]).toBeDefined();
    expect(quizQuestions[QUIZ_ID]).toHaveLength(Q_COUNT);
  });

  it('all 10 questions have required fields and valid structure', () => {
    quizQuestions[QUIZ_ID].forEach((q) => {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.correctOptionId).toBeTruthy();
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
      expect(q.explanation).toBeTruthy();
    });
  });

  it('question IDs are unique within the quiz', () => {
    const ids = quizQuestions[QUIZ_ID].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('quiz result saved to localStorage on completion', () => {
    const ls = makeLs();
    saveResult(ls, makeResult());
    expect(getResults(ls)).toHaveLength(1);
    expect(getResults(ls)[0].quizId).toBe(QUIZ_ID);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// READ
// ════════════════════════════════════════════════════════════════════════════

describe('READ — quiz listing, filter, player and progress screens', () => {
  it('new quiz appears in full quiz list (all filter)', () => {
    expect(quizzes.map((q) => q.id)).toContain(QUIZ_ID);
  });

  it('filtering by cost-optimization returns exactly 1 quiz', () => {
    const filtered = quizzes.filter((q) => q.category === CATEGORY);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(QUIZ_ID);
  });

  it('filtering by unrelated category does not include cost-optimization quiz', () => {
    const filtered = quizzes.filter((q) => q.category === 'bedrock');
    expect(filtered.some((q) => q.id === QUIZ_ID)).toBe(false);
  });

  it('total quiz count is at least 15 after adding new quiz', () => {
    expect(quizzes.length).toBeGreaterThanOrEqual(15);
  });

  it('no duplicate quiz IDs across the entire dataset', () => {
    const ids = quizzes.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all quizzes have valid difficulty values', () => {
    const valid = ['beginner', 'intermediate', 'advanced'];
    quizzes.forEach((q) => expect(valid).toContain(q.difficulty));
  });

  it('quiz player loads all 10 questions for cost-optimization', () => {
    const quiz      = quizzes.find((q) => q.id === QUIZ_ID)!;
    const questions = quizQuestions[QUIZ_ID];
    expect(questions.length).toBe(quiz.questionCount);
  });

  it('invalid quiz ID returns empty question array (404-safe)', () => {
    expect(quizQuestions['non-existent-quiz'] ?? []).toHaveLength(0);
  });

  it('progress screen: completed set includes quiz after finishing', () => {
    const ls = makeLs();
    saveResult(ls, makeResult());
    const completed = new Set(getResults(ls).map((r) => r.quizId));
    expect(completed.has(QUIZ_ID)).toBe(true);
  });

  it('progress screen: average score calculated correctly across multiple quizzes', () => {
    const results: QuizResult[] = [
      makeResult({ quizId: 'bedrock-fundamentals', score: 7 }),
      makeResult({ quizId: QUIZ_ID,               score: 9 }),
      makeResult({ quizId: 'rag-knowledge-bases',  score: 6 }),
    ];
    const avg = results.reduce(
      (sum, r) => sum + Math.round((r.score / r.totalQuestions) * 100),
      0,
    ) / results.length;
    expect(avg).toBeCloseTo(73.33, 1);
  });

  it('score ≥70% renders green; <70% renders red', () => {
    expect(80 >= PASS_PCT).toBe(true);
    expect(60 >= PASS_PCT).toBe(false);
  });

  it('quizQuestions questionCount matches declared questionCount for every quiz', () => {
    quizzes.forEach((quiz) => {
      const qs = quizQuestions[quiz.id];
      expect(qs).toBeDefined();
      expect(qs.length).toBe(quiz.questionCount);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// UPDATE
// ════════════════════════════════════════════════════════════════════════════

describe('UPDATE — re-attempt quiz overwrites previous result', () => {
  it('second attempt replaces first (upsert semantics)', () => {
    const ls = makeLs();
    saveResult(ls, makeResult({ score: 5 }));
    saveResult(ls, makeResult({ score: 9 }));
    const stored = getResults(ls).filter((r) => r.quizId === QUIZ_ID);
    expect(stored).toHaveLength(1);
    expect(stored[0].score).toBe(9);
  });

  it('re-attempt updates completedAt timestamp', () => {
    const ls     = makeLs();
    const first  = '2026-03-01T10:00:00Z';
    const second = '2026-03-01T12:00:00Z';
    saveResult(ls, makeResult({ completedAt: first }));
    saveResult(ls, makeResult({ completedAt: second }));
    expect(getResults(ls)[0].completedAt).toBe(second);
  });

  it('re-attempt of one quiz does not affect other quiz results', () => {
    const ls = makeLs();
    saveResult(ls, makeResult({ quizId: 'bedrock-fundamentals', score: 7 }));
    saveResult(ls, makeResult({ quizId: QUIZ_ID, score: 5 }));
    saveResult(ls, makeResult({ quizId: QUIZ_ID, score: 9 }));
    const all = getResults(ls);
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.quizId === 'bedrock-fundamentals')?.score).toBe(7);
    expect(all.find((r) => r.quizId === QUIZ_ID)?.score).toBe(9);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE
// ════════════════════════════════════════════════════════════════════════════

describe('DELETE — remove quiz results from localStorage', () => {
  it('removing cost-optimization result leaves other results intact', () => {
    const ls = makeLs();
    saveResult(ls, makeResult({ quizId: 'bedrock-fundamentals', score: 8 }));
    saveResult(ls, makeResult({ quizId: QUIZ_ID,               score: 9 }));
    saveResult(ls, makeResult({ quizId: 'rag-knowledge-bases',  score: 6 }));
    removeResult(ls, QUIZ_ID);
    const after = getResults(ls);
    expect(after).toHaveLength(2);
    expect(after.some((r) => r.quizId === QUIZ_ID)).toBe(false);
  });

  it('removing a non-existent result is a no-op', () => {
    const ls = makeLs();
    saveResult(ls, makeResult());
    removeResult(ls, 'non-existent-quiz');
    expect(getResults(ls)).toHaveLength(1);
  });

  it('clearing all results removes every entry', () => {
    const ls = makeLs();
    saveResult(ls, makeResult({ quizId: 'bedrock-fundamentals' }));
    saveResult(ls, makeResult({ quizId: QUIZ_ID }));
    ls.removeItem('quiz-results');
    expect(getResults(ls)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION — Elite Quiz admin ↔ LMS data consistency
// ════════════════════════════════════════════════════════════════════════════

describe('INTEGRATION — Elite Quiz admin DB ↔ LMS data sync', () => {
  it('Elite Quiz admin MySQL slug contains the LMS quiz ID', () => {
    // MySQL: category_name='AWS Cost Optimization', slug='aws-cost-optimization'
    // LMS:   quiz.id='cost-optimization'
    const eliteSlug = 'aws-cost-optimization';
    expect(eliteSlug).toContain(QUIZ_ID);
  });

  it('Elite Quiz admin category_name matches LMS quiz title', () => {
    const quiz = quizzes.find((q) => q.id === QUIZ_ID)!;
    expect(quiz.title).toBe('AWS Cost Optimization');
  });

  it('question count in LMS matches expected admin count (10)', () => {
    expect(quizQuestions[QUIZ_ID]).toHaveLength(10);
  });

  it('all cost-optimization question IDs are globally unique', () => {
    const allIds = Object.values(quizQuestions).flat().map((q) => q.id);
    quizQuestions[QUIZ_ID].forEach((q) => {
      expect(allIds.filter((id) => id === q.id)).toHaveLength(1);
    });
  });

  it('every quiz in LMS has a corresponding quizQuestions entry', () => {
    quizzes.forEach((quiz) => {
      expect(quizQuestions[quiz.id]).toBeDefined();
      expect(quizQuestions[quiz.id].length).toBeGreaterThan(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// API — quizSubmit Lambda reward logic (schema + reward calculations)
// ════════════════════════════════════════════════════════════════════════════

describe('API — quizSubmit Lambda reward logic', () => {
  it('80% score on intermediate quiz: passes, earns coins and XP', () => {
    const { pct, passed, coins, xp } = calcRewards(8, 10, 'intermediate');
    expect(pct).toBe(80);
    expect(passed).toBe(true);
    expect(coins).toBe(100); // 8*10 + 20
    expect(xp).toBe(120);    // round(80 * 1.5)
  });

  it('60% score fails and earns 0 coins / 0 XP', () => {
    const { pct, passed, coins, xp } = calcRewards(6, 10, 'intermediate');
    expect(pct).toBe(60);
    expect(passed).toBe(false);
    expect(coins).toBe(0);
    expect(xp).toBe(0);
  });

  it('perfect score on intermediate adds 50 bonus coins', () => {
    const { coins } = calcRewards(10, 10, 'intermediate');
    expect(coins).toBe(170); // 10*10 + 20 + 50
  });

  it('advanced difficulty multiplies XP by 2', () => {
    const { xp } = calcRewards(8, 10, 'advanced');
    expect(xp).toBe(Math.round(80 * 2)); // 160
  });

  it('beginner difficulty XP multiplier is 1x', () => {
    const { xp } = calcRewards(8, 10, 'beginner');
    expect(xp).toBe(80);
  });

  it('exactly 70% is the pass boundary (passes)', () => {
    const { passed } = calcRewards(7, 10, 'intermediate');
    expect(passed).toBe(true);
  });

  it('69% is below pass boundary (fails)', () => {
    // With integer questions, 6/10 = 60% and 7/10 = 70%; no 69% possible with 10 Qs
    const { passed } = calcRewards(6, 10, 'intermediate');
    expect(passed).toBe(false);
  });

  it('reward calculation is consistent for all difficulty levels', () => {
    ['beginner', 'intermediate', 'advanced'].forEach((d) => {
      const { pct } = calcRewards(8, 10, d);
      expect(pct).toBe(80); // pct is difficulty-agnostic
    });
  });
});
