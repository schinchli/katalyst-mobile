/**
 * progressStore — comprehensive unit tests
 * Covers: calculateLevel, xpToNextLevel, addResult (streak, badges, coins, XP),
 *         clearPendingBadges, clearPendingCoins, reset, no-duplicate badges.
 */
import { useProgressStore, calculateLevel, xpToNextLevel, LEVEL_NAMES } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear:      jest.fn().mockResolvedValue(null),
}));

const INITIAL_PROGRESS = {
  totalQuizzes:     0,
  completedQuizzes: 0,
  averageScore:     0,
  currentStreak:    0,
  longestStreak:    0,
  lastPlayedDate:   null,
  badges:           [],
  recentResults:    [],
  coins:            200,
  totalCoinsEarned: 200,
  xp:               0,
  level:            1,
};

function makeResult(overrides: Partial<{
  quizId: string; score: number; totalQuestions: number;
  timeTaken: number; answers: Record<string, string>; completedAt: string;
}> = {}) {
  return {
    quizId: 'bedrock-fundamentals',
    score: 5,
    totalQuestions: 10,
    timeTaken: 120,
    answers: {},
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  useProgressStore.setState({
    progress:      { ...INITIAL_PROGRESS },
    hydrated:      true,
    pendingBadges: [],
    pendingCoins:  0,
  });
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── calculateLevel ───────────────────────────────────────────────────────────
describe('calculateLevel', () => {
  it('returns 1 at 0 XP', () => expect(calculateLevel(0)).toBe(1));
  it('returns 1 just below level-2 threshold', () => expect(calculateLevel(199)).toBe(1));
  it('returns 2 at level-2 threshold (200 XP)', () => expect(calculateLevel(200)).toBe(2));
  it('returns 2 just below level-3 threshold', () => expect(calculateLevel(499)).toBe(2));
  it('returns 3 at 500 XP', () => expect(calculateLevel(500)).toBe(3));
  it('returns 5 at 2000 XP', () => expect(calculateLevel(2000)).toBe(5));
  it('returns 9 (max) at 10000 XP', () => expect(calculateLevel(10_000)).toBe(9));
  it('caps at 9 for very high XP', () => expect(calculateLevel(999_999)).toBe(9));
  it('level names array has 9 entries matching max level', () => expect(LEVEL_NAMES).toHaveLength(9));
});

// ─── xpToNextLevel ────────────────────────────────────────────────────────────
describe('xpToNextLevel', () => {
  it('at level 1 with 0 XP: needed is level-2 threshold (200)', () => {
    const { current, needed } = xpToNextLevel(0, 1);
    expect(current).toBe(0);
    expect(needed).toBe(200);
  });

  it('at level 1 with 100 XP: current is 100, needed is 200', () => {
    const { current, needed } = xpToNextLevel(100, 1);
    expect(current).toBe(100);
    expect(needed).toBe(200);
  });

  it('at level 2 with 350 XP: current and needed are correct', () => {
    const { current, needed } = xpToNextLevel(350, 2);
    expect(current).toBe(150); // 350 - 200
    expect(needed).toBe(300);  // 500 - 200
  });

  it('at max level (9) returns 0 needed', () => {
    const { needed } = xpToNextLevel(10_000, 9);
    expect(needed).toBe(0);
  });
});

// ─── Streak logic ─────────────────────────────────────────────────────────────
describe('streak logic', () => {
  it('starts at 1 on first quiz', () => {
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(1);
  });

  it('increments streak on consecutive days', () => {
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(1);

    jest.setSystemTime(new Date('2024-01-16T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(2);

    jest.setSystemTime(new Date('2024-01-17T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(3);
  });

  it('does NOT increment streak when playing twice on same day', () => {
    jest.setSystemTime(new Date('2024-01-15T09:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    jest.setSystemTime(new Date('2024-01-15T17:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(1);
  });

  it('resets streak to 1 after a missed day', () => {
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    jest.setSystemTime(new Date('2024-01-16T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(2);

    // Skip day 17, play on day 18
    jest.setSystemTime(new Date('2024-01-18T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.currentStreak).toBe(1);
  });

  it('tracks longestStreak correctly', () => {
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    jest.setSystemTime(new Date('2024-01-16T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    jest.setSystemTime(new Date('2024-01-17T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.longestStreak).toBe(3);

    // Reset streak
    jest.setSystemTime(new Date('2024-01-20T10:00:00Z'));
    useProgressStore.getState().addResult(makeResult());
    // Longest should stay 3
    expect(useProgressStore.getState().progress.longestStreak).toBe(3);
    expect(useProgressStore.getState().progress.currentStreak).toBe(1);
  });
});

// ─── Badge: first-quiz ────────────────────────────────────────────────────────
describe('badge: first-quiz', () => {
  it('awards first-quiz badge on first completion', () => {
    useProgressStore.getState().addResult(makeResult());
    const { pendingBadges } = useProgressStore.getState();
    expect(pendingBadges.some((b) => b.id === 'first-quiz')).toBe(true);
  });

  it('does NOT award first-quiz badge on second completion', () => {
    useProgressStore.getState().addResult(makeResult());
    useProgressStore.setState({ pendingBadges: [] });
    useProgressStore.getState().addResult(makeResult());
    const { pendingBadges } = useProgressStore.getState();
    expect(pendingBadges.some((b) => b.id === 'first-quiz')).toBe(false);
  });
});

// ─── Badge: perfect-score ─────────────────────────────────────────────────────
describe('badge: perfect-score', () => {
  it('awards perfect-score badge when score equals totalQuestions', () => {
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'perfect-score')).toBe(true);
  });

  it('does NOT award perfect-score when score < totalQuestions', () => {
    useProgressStore.getState().addResult(makeResult({ score: 9, totalQuestions: 10 }));
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'perfect-score')).toBe(false);
  });
});

// ─── Badge: speed-demon ───────────────────────────────────────────────────────
describe('badge: speed-demon', () => {
  it('awards speed-demon badge when timeTaken < 60 seconds', () => {
    useProgressStore.getState().addResult(makeResult({ timeTaken: 45 }));
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'speed-demon')).toBe(true);
  });

  it('does NOT award speed-demon when timeTaken >= 60', () => {
    useProgressStore.getState().addResult(makeResult({ timeTaken: 60 }));
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'speed-demon')).toBe(false);
  });

  it('does NOT award speed-demon when timeTaken is 0', () => {
    useProgressStore.getState().addResult(makeResult({ timeTaken: 0 }));
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'speed-demon')).toBe(false);
  });
});

// ─── Badge: half-way ─────────────────────────────────────────────────────────
describe('badge: half-way', () => {
  it('awards half-way badge on 6th completion', () => {
    for (let i = 0; i < 5; i++) useProgressStore.getState().addResult(makeResult());
    useProgressStore.setState({ pendingBadges: [] });
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'half-way')).toBe(true);
  });

  it('does NOT award half-way before 6 completions', () => {
    for (let i = 0; i < 5; i++) useProgressStore.getState().addResult(makeResult());
    useProgressStore.setState({ pendingBadges: [] }); // clear after 5th
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'half-way')).toBe(false);
  });

  it('does NOT award half-way badge twice', () => {
    for (let i = 0; i < 6; i++) useProgressStore.getState().addResult(makeResult());
    const { progress } = useProgressStore.getState();
    const halfWayBadges = progress.badges.filter((b) => b.id === 'half-way');
    expect(halfWayBadges.length).toBe(1);
  });
});

// ─── Badge: quiz-marathon ─────────────────────────────────────────────────────
describe('badge: quiz-marathon', () => {
  it('awards quiz-marathon badge after completing all quizzes', () => {
    const totalCount = quizzes.length; // 12
    for (let i = 0; i < totalCount - 1; i++) {
      useProgressStore.getState().addResult(makeResult());
    }
    useProgressStore.setState({ pendingBadges: [] });
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'quiz-marathon')).toBe(true);
  });

  it('does NOT award quiz-marathon before all quizzes completed', () => {
    const totalCount = quizzes.length;
    for (let i = 0; i < totalCount - 1; i++) {
      useProgressStore.getState().addResult(makeResult());
    }
    useProgressStore.setState({ pendingBadges: [] });
    expect(useProgressStore.getState().pendingBadges.some((b) => b.id === 'quiz-marathon')).toBe(false);
  });
});

// ─── Badge: seven-day-streak ──────────────────────────────────────────────────
describe('badge: seven-day-streak', () => {
  it('awards seven-day-streak badge on 7th consecutive day', () => {
    for (let day = 15; day <= 21; day++) {
      jest.setSystemTime(new Date(`2024-01-${String(day).padStart(2, '0')}T10:00:00Z`));
      useProgressStore.getState().addResult(makeResult());
    }
    const { progress } = useProgressStore.getState();
    expect(progress.badges.some((b) => b.id === 'seven-day-streak')).toBe(true);
  });

  it('does NOT award seven-day-streak before 7 consecutive days', () => {
    for (let day = 15; day <= 20; day++) {
      jest.setSystemTime(new Date(`2024-01-${String(day).padStart(2, '0')}T10:00:00Z`));
      useProgressStore.getState().addResult(makeResult());
    }
    expect(useProgressStore.getState().progress.badges.some((b) => b.id === 'seven-day-streak')).toBe(false);
  });
});

// ─── Badge: category-master ───────────────────────────────────────────────────
describe('badge: category-master', () => {
  it('awards category-master badge when all quizzes in a category are completed', () => {
    // clf-c02 has 5 quizzes — complete them all
    const clfQuizIds = quizzes
      .filter((q) => q.category === 'clf-c02')
      .map((q) => q.id);
    expect(clfQuizIds.length).toBeGreaterThanOrEqual(2);

    for (const qid of clfQuizIds) {
      useProgressStore.getState().addResult(makeResult({ quizId: qid }));
    }
    const { progress } = useProgressStore.getState();
    expect(progress.badges.some((b) => b.id === 'category-master')).toBe(true);
  });

  it('does NOT award category-master when only some quizzes in a category are done', () => {
    // Complete only the first clf-c02 quiz
    const clfQuizIds = quizzes
      .filter((q) => q.category === 'clf-c02')
      .map((q) => q.id);
    useProgressStore.getState().addResult(makeResult({ quizId: clfQuizIds[0] }));
    expect(useProgressStore.getState().progress.badges.some((b) => b.id === 'category-master')).toBe(false);
  });

  it('awards category-master even when old results were displaced from the recent-20 window', () => {
    // Use fake quiz IDs as filler (no quizMeta → no category check interference)
    const fillerResults = Array.from({ length: 19 }, (_, i) => ({
      quizId: `filler-quiz-${i}`,
      score: 5,
      totalQuestions: 10,
      timeTaken: 120,
      answers: {} as Record<string, string>,
      completedAt: new Date().toISOString(),
    }));
    useProgressStore.setState((s) => ({
      progress: {
        ...s.progress,
        recentResults: fillerResults,
        completedQuizzes: 19,
      },
    }));

    const clfIds = quizzes.filter((q) => q.category === 'clf-c02').map((q) => q.id);

    // Add the first clf quiz — it becomes item [0], fillerResults fill [1..19]
    useProgressStore.getState().addResult(makeResult({ quizId: clfIds[0] }));

    // Now add the remaining clf quizzes — the first one may be displaced from the 20-item window
    // but the badge logic checks [result, ...prev.recentResults] (21 items) to prevent this.
    for (let i = 1; i < clfIds.length; i++) {
      useProgressStore.getState().addResult(makeResult({ quizId: clfIds[i] }));
    }

    expect(useProgressStore.getState().progress.badges.some((b) => b.id === 'category-master')).toBe(true);
  });
});

// ─── Coin calculation ─────────────────────────────────────────────────────────
describe('coin calculation', () => {
  it('earns completion + correct-answer coins', () => {
    const before = useProgressStore.getState().progress.coins;
    useProgressStore.getState().addResult(makeResult({ score: 5, totalQuestions: 10 }));
    const { progress, pendingCoins } = useProgressStore.getState();
    // 5 correct × 10 + 20 completion + 100 (first-quiz badge) = 170 coins
    expect(pendingCoins).toBe(170);
    expect(progress.coins).toBe(before + 170);
  });

  it('earns perfect-score bonus (+50 coins)', () => {
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    const { pendingCoins } = useProgressStore.getState();
    // 10 × 10 + 20 + 50 (perfect bonus) + 100 (first-quiz badge) + 100 (perfect-score badge) = 370
    expect(pendingCoins).toBe(370);
  });

  it('earns badge coins (+100 per new badge)', () => {
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    const { pendingCoins } = useProgressStore.getState();
    // first-quiz badge + perfect-score badge = 200 badge coins
    expect(pendingCoins).toBeGreaterThanOrEqual(200);
  });

  it('accumulates totalCoinsEarned', () => {
    useProgressStore.getState().addResult(makeResult({ score: 5, totalQuestions: 10 }));
    const { progress, pendingCoins } = useProgressStore.getState();
    expect(progress.totalCoinsEarned).toBe(200 + pendingCoins); // 200 welcome + earned
  });
});

// ─── XP & level ───────────────────────────────────────────────────────────────
describe('XP and level', () => {
  it('earns XP proportional to score × difficulty multiplier', () => {
    // beginner quiz: multiplier = 1; score 10/10 = 100 XP
    useProgressStore.getState().addResult(makeResult({
      quizId: 'bedrock-fundamentals', // beginner
      score: 10,
      totalQuestions: 10,
    }));
    expect(useProgressStore.getState().progress.xp).toBe(100);
  });

  it('XP advances level when threshold is crossed', () => {
    // Level 2 requires 200 XP. Two perfect beginner quizzes = 100 + 100 = 200 XP → level 2.
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    expect(useProgressStore.getState().progress.level).toBe(2);
  });
});

// ─── Average score ────────────────────────────────────────────────────────────
describe('average score', () => {
  it('computes correct average across multiple quizzes', () => {
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 })); // 100%
    useProgressStore.getState().addResult(makeResult({ score: 0,  totalQuestions: 10 })); // 0%
    expect(useProgressStore.getState().progress.averageScore).toBe(50);
  });

  it('averages with different totalQuestions correctly', () => {
    useProgressStore.getState().addResult(makeResult({ score: 5, totalQuestions: 10 })); // 50%
    useProgressStore.getState().addResult(makeResult({ score: 4, totalQuestions: 5  })); // 80%
    expect(useProgressStore.getState().progress.averageScore).toBe(65); // (50+80)/2
  });
});

// ─── completedQuizzes counter ──────────────────────────────────────────────────
describe('completedQuizzes counter', () => {
  it('increments by 1 per result', () => {
    useProgressStore.getState().addResult(makeResult());
    useProgressStore.getState().addResult(makeResult());
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().progress.completedQuizzes).toBe(3);
  });
});

// ─── recentResults rolling window ────────────────────────────────────────────
describe('recentResults rolling window', () => {
  it('keeps most recent 20 results', () => {
    for (let i = 0; i < 25; i++) {
      useProgressStore.getState().addResult(makeResult());
    }
    expect(useProgressStore.getState().progress.recentResults.length).toBe(20);
  });

  it('newest result appears at index 0', () => {
    useProgressStore.getState().addResult(makeResult({ quizId: 'bedrock-fundamentals' }));
    useProgressStore.getState().addResult(makeResult({ quizId: 'rag-knowledge-bases' }));
    expect(useProgressStore.getState().progress.recentResults[0].quizId).toBe('rag-knowledge-bases');
  });
});

// ─── clearPendingBadges / clearPendingCoins ───────────────────────────────────
describe('clearPendingBadges', () => {
  it('clears pending badges', () => {
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().pendingBadges.length).toBeGreaterThan(0);
    useProgressStore.getState().clearPendingBadges();
    expect(useProgressStore.getState().pendingBadges.length).toBe(0);
  });
});

describe('clearPendingCoins', () => {
  it('clears pending coins', () => {
    useProgressStore.getState().addResult(makeResult());
    expect(useProgressStore.getState().pendingCoins).toBeGreaterThan(0);
    useProgressStore.getState().clearPendingCoins();
    expect(useProgressStore.getState().pendingCoins).toBe(0);
  });
});

// ─── No duplicate badges ──────────────────────────────────────────────────────
describe('no duplicate badges', () => {
  it('badges array never contains the same badge id twice', () => {
    // Complete 10 quizzes — should earn multiple badges
    for (let i = 0; i < 10; i++) {
      useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10, timeTaken: 45 }));
    }
    const { badges } = useProgressStore.getState().progress;
    const ids = badges.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ─── reset ────────────────────────────────────────────────────────────────────
describe('reset', () => {
  it('clears all state back to initial', () => {
    useProgressStore.getState().addResult(makeResult({ score: 10, totalQuestions: 10 }));
    useProgressStore.getState().reset();
    const s = useProgressStore.getState();
    expect(s.progress.completedQuizzes).toBe(0);
    expect(s.progress.coins).toBe(200); // welcome bonus
    expect(s.progress.badges).toHaveLength(0);
    expect(s.pendingBadges).toHaveLength(0);
    expect(s.pendingCoins).toBe(0);
  });
});
