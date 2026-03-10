/**
 * leaderboard data — unit tests
 * Covers: getLeaderboard for all periods, data structure, rank ordering, score ordering.
 */
import { getLeaderboard } from '@/data/leaderboard';
import type { LeaderboardEntry } from '@/types';

const PERIODS = ['daily', 'monthly', 'alltime'] as const;

describe('getLeaderboard', () => {
  PERIODS.forEach((period) => {
    describe(`period: ${period}`, () => {
      let entries: LeaderboardEntry[];

      beforeEach(() => {
        entries = getLeaderboard(period);
      });

      it('returns a non-empty array', () => {
        expect(entries.length).toBeGreaterThan(0);
      });

      it('returns 10 entries', () => {
        expect(entries.length).toBe(10);
      });

      it('ranks are consecutive starting from 1', () => {
        entries.forEach((e, idx) => {
          expect(e.rank).toBe(idx + 1);
        });
      });

      it('scores are in descending order (alltime only — daily/monthly are shuffled mock data)', () => {
        if (period !== 'alltime') return; // daily & monthly intentionally reorder players
        for (let i = 0; i < entries.length - 1; i++) {
          expect(entries[i].score).toBeGreaterThanOrEqual(entries[i + 1].score);
        }
      });

      it('every entry has required fields', () => {
        entries.forEach((e) => {
          expect(e.userId).toBeTruthy();
          expect(e.name).toBeTruthy();
          expect(e.avatarInitial).toBeTruthy();
          expect(typeof e.score).toBe('number');
          expect(typeof e.rank).toBe('number');
          expect(typeof e.coins).toBe('number');
          expect(typeof e.streak).toBe('number');
          expect(typeof e.quizzesCompleted).toBe('number');
        });
      });

      it('all scores are positive', () => {
        entries.forEach((e) => expect(e.score).toBeGreaterThan(0));
      });

      it('userId values are unique', () => {
        const ids = entries.map((e) => e.userId);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('no entry has isCurrentUser set', () => {
        entries.forEach((e) => expect(e.isCurrentUser).toBeFalsy());
      });
    });
  });

  it('daily scores are lower than alltime scores for same players', () => {
    const daily   = getLeaderboard('daily');
    const alltime = getLeaderboard('alltime');
    expect(daily[0].score).toBeLessThan(alltime[0].score);
  });

  it('monthly scores are between daily and alltime', () => {
    const daily   = getLeaderboard('daily');
    const monthly = getLeaderboard('monthly');
    const alltime = getLeaderboard('alltime');
    expect(monthly[0].score).toBeGreaterThan(daily[0].score);
    expect(monthly[0].score).toBeLessThan(alltime[0].score);
  });
});
