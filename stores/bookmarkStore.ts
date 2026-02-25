import { create } from 'zustand';

interface BookmarkStore {
  bookmarkedIds: string[];
  toggle: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkStore>()((set, get) => ({
  bookmarkedIds: [],
  toggle: (id) =>
    set((s) => ({
      bookmarkedIds: s.bookmarkedIds.includes(id)
        ? s.bookmarkedIds.filter((x) => x !== id)
        : [...s.bookmarkedIds, id],
    })),
  isBookmarked: (id) => get().bookmarkedIds.includes(id),
}));
