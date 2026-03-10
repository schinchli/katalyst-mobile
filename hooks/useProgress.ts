/**
 * useProgress — TanStack Query hook
 * ──────────────────────────────────
 * Fetches the authenticated user's progress from the backend API.
 * Falls back gracefully when the user is a guest or API is unavailable.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProgress, type ProgressResponse } from '@/services/apiService';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';

export const PROGRESS_QUERY_KEY = ['progress'] as const;

/** Fetch remote progress and sync into local Zustand store */
export function useProgress() {
  // Only fetch for real Cognito users — guests use local Zustand state only
  const isRealUser   = useAuthStore((s) => s.step === 'authenticated');
  const syncProgress = useProgressStore((s) => s.syncProgress);

  return useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn:  async (): Promise<ProgressResponse | null> => {
      const data = await fetchProgress();
      if (data) syncProgress(data);
      return data;
    },
    enabled:              isRealUser,
    staleTime:            5 * 60 * 1000,   // 5 min — stats only change after quiz submit
    gcTime:               30 * 60 * 1000,  // 30 min cache
    retry:                1,
    refetchOnWindowFocus: false,
    refetchOnMount:       false,           // don't re-fetch on every screen mount
  });
}

/** Manually invalidate + re-fetch progress (e.g. after quiz submission) */
export function useInvalidateProgress() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PROGRESS_QUERY_KEY });
}
