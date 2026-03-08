/**
 * contests data — unit tests
 * Covers: getContests filtering, data structure integrity, time fields.
 */
import { getContests, contests } from '@/data/contests';
import type { ContestStatus } from '@/types';

const STATUSES: ContestStatus[] = ['live', 'upcoming', 'past'];

describe('contests array', () => {
  it('has at least one contest per status', () => {
    STATUSES.forEach((status) => {
      expect(contests.filter((c) => c.status === status).length).toBeGreaterThan(0);
    });
  });

  it('every contest has required fields', () => {
    contests.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.quizId).toBeTruthy();
      expect(c.icon).toBeTruthy();
      expect(typeof c.entryFee).toBe('number');
      expect(typeof c.prizeCoins).toBe('number');
      expect(typeof c.participants).toBe('number');
      expect(typeof c.maxParticipants).toBe('number');
      expect(STATUSES).toContain(c.status);
    });
  });

  it('contest IDs are unique', () => {
    const ids = contests.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entry fees are non-negative', () => {
    contests.forEach((c) => expect(c.entryFee).toBeGreaterThanOrEqual(0));
  });

  it('prize coins are positive', () => {
    contests.forEach((c) => expect(c.prizeCoins).toBeGreaterThan(0));
  });

  it('participants do not exceed maxParticipants', () => {
    contests.forEach((c) => {
      expect(c.participants).toBeLessThanOrEqual(c.maxParticipants);
    });
  });

  it('startTime is a valid ISO string', () => {
    contests.forEach((c) => {
      expect(() => new Date(c.startTime)).not.toThrow();
      expect(isNaN(new Date(c.startTime).getTime())).toBe(false);
    });
  });

  it('endTime is a valid ISO string', () => {
    contests.forEach((c) => {
      expect(() => new Date(c.endTime)).not.toThrow();
      expect(isNaN(new Date(c.endTime).getTime())).toBe(false);
    });
  });

  it('endTime is after startTime', () => {
    contests.forEach((c) => {
      expect(new Date(c.endTime).getTime()).toBeGreaterThan(new Date(c.startTime).getTime());
    });
  });

  it('past contests have a winner field', () => {
    contests.filter((c) => c.status === 'past').forEach((c) => {
      expect(c.winner).toBeTruthy();
    });
  });
});

describe('getContests', () => {
  STATUSES.forEach((status) => {
    it(`returns only "${status}" contests`, () => {
      const result = getContests(status);
      result.forEach((c) => expect(c.status).toBe(status));
    });
  });

  it('live contests have endTime in the future', () => {
    const now  = Date.now();
    const live = getContests('live');
    live.forEach((c) => {
      expect(new Date(c.endTime).getTime()).toBeGreaterThan(now);
    });
  });

  it('upcoming contests have startTime in the future', () => {
    const now      = Date.now();
    const upcoming = getContests('upcoming');
    upcoming.forEach((c) => {
      expect(new Date(c.startTime).getTime()).toBeGreaterThan(now);
    });
  });

  it('past contests have endTime in the past', () => {
    const now  = Date.now();
    const past = getContests('past');
    past.forEach((c) => {
      expect(new Date(c.endTime).getTime()).toBeLessThan(now);
    });
  });
});
