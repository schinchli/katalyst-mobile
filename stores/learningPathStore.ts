/**
 * Learning Path Store — tracks which path the user is on and which
 * steps they've completed.
 *
 * Completion is inferred from progressStore quiz results + a local
 * per-step completed set so videos/flashcards can be marked done too.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORE_KEY = 'learning_path_state';

interface LearningPathState {
  /** Currently selected path id, or null if not chosen */
  activePathId: string | null;
  /** Steps the user has explicitly marked done (videos, flashcards) */
  completedStepIds: string[];
  /** Whether the selection modal is visible */
  showSelector: boolean;

  setActivePath: (id: string) => void;
  clearActivePath: () => void;
  markStepDone: (stepId: string) => void;
  setShowSelector: (v: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useLearningPathStore = create<LearningPathState>((set, get) => ({
  activePathId: null,
  completedStepIds: [],
  showSelector: false,

  setActivePath: (id) => {
    set({ activePathId: id, showSelector: false });
    void SecureStore.setItemAsync(STORE_KEY, JSON.stringify({ activePathId: id, completedStepIds: get().completedStepIds })).catch(() => {});
  },

  clearActivePath: () => {
    set({ activePathId: null, completedStepIds: [] });
    void SecureStore.deleteItemAsync(STORE_KEY).catch(() => {});
  },

  markStepDone: (stepId) => {
    const next = [...new Set([...get().completedStepIds, stepId])];
    set({ completedStepIds: next });
    void SecureStore.setItemAsync(STORE_KEY, JSON.stringify({ activePathId: get().activePathId, completedStepIds: next })).catch(() => {});
  },

  setShowSelector: (v) => set({ showSelector: v }),

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { activePathId: string | null; completedStepIds: string[] };
        set({ activePathId: parsed.activePathId ?? null, completedStepIds: parsed.completedStepIds ?? [] });
      }
    } catch {
      // ignore
    }
  },
}));
