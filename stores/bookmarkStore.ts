import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BookmarkStore {
  bookmarkedIds: string[];
  hydrated: boolean;
  setHydrated: () => void;
  toggle: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarkedIds: [],
      hydrated: false,

      setHydrated: () => set({ hydrated: true }),

      toggle: (id) =>
        set((s) => ({
          bookmarkedIds: s.bookmarkedIds.includes(id)
            ? s.bookmarkedIds.filter((x) => x !== id)
            : [...s.bookmarkedIds, id],
        })),

      isBookmarked: (id) => get().bookmarkedIds.includes(id),
    }),
    {
      name: 'bookmark-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ bookmarkedIds: state.bookmarkedIds }),
      onRehydrateStorage: () => (state) => { state?.setHydrated(); },
    },
  ),
);
