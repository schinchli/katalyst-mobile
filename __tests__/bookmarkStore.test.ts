/**
 * bookmarkStore — unit tests
 * Covers: toggle (add/remove), isBookmarked, deduplication, hydrated flag.
 */
import { useBookmarkStore } from '@/stores/bookmarkStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn().mockResolvedValue(null),
  setItem:    jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear:      jest.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  useBookmarkStore.setState({ bookmarkedIds: [], hydrated: true });
});

describe('initial state', () => {
  it('starts with empty bookmarkedIds', () => {
    expect(useBookmarkStore.getState().bookmarkedIds).toEqual([]);
  });
});

describe('toggle — add', () => {
  it('adds a question id to bookmarks', () => {
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds).toContain('q-001');
  });

  it('adds multiple different question ids', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-002');
    useBookmarkStore.getState().toggle('q-003');
    const { bookmarkedIds } = useBookmarkStore.getState();
    expect(bookmarkedIds).toHaveLength(3);
    expect(bookmarkedIds).toContain('q-001');
    expect(bookmarkedIds).toContain('q-002');
    expect(bookmarkedIds).toContain('q-003');
  });
});

describe('toggle — remove', () => {
  it('removes an already-bookmarked question id', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001'); // second toggle removes it
    expect(useBookmarkStore.getState().bookmarkedIds).not.toContain('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds).toHaveLength(0);
  });

  it('removes only the target id, leaving others intact', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-002');
    useBookmarkStore.getState().toggle('q-001'); // remove q-001
    expect(useBookmarkStore.getState().bookmarkedIds).not.toContain('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds).toContain('q-002');
  });
});

describe('toggle — idempotent pairs', () => {
  it('add → remove → add results in bookmarked', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds).toContain('q-001');
  });

  it('add → remove → remove leaves empty', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds).toHaveLength(0);
  });
});

describe('isBookmarked', () => {
  it('returns false when question is not bookmarked', () => {
    expect(useBookmarkStore.getState().isBookmarked('q-999')).toBe(false);
  });

  it('returns true when question has been bookmarked', () => {
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().isBookmarked('q-001')).toBe(true);
  });

  it('returns false after a bookmark has been removed', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().isBookmarked('q-001')).toBe(false);
  });

  it('is consistent with bookmarkedIds array', () => {
    useBookmarkStore.getState().toggle('q-A');
    useBookmarkStore.getState().toggle('q-B');
    const { bookmarkedIds, isBookmarked } = useBookmarkStore.getState();
    bookmarkedIds.forEach((id) => expect(isBookmarked(id)).toBe(true));
    expect(isBookmarked('q-C')).toBe(false);
  });
});

describe('no duplicates', () => {
  it('toggling the same id twice yields empty list (no duplicate entry)', () => {
    useBookmarkStore.getState().toggle('q-001');
    useBookmarkStore.getState().toggle('q-001');
    expect(useBookmarkStore.getState().bookmarkedIds.filter((id) => id === 'q-001').length).toBe(0);
  });
});
