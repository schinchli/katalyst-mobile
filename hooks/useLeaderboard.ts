/**
 * useLeaderboard — TanStack Query hook
 * ─────────────────────────────────────
 * Fetches leaderboard entries from the backend API.
 * Falls back to mock data when API is unavailable or user is a guest.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard, type LeaderboardResponse } from '@/services/apiService';
import { useAuthStore } from '@/stores/authStore';
import { getLeaderboard } from '@/data/leaderboard';

export type Period = 'daily' | 'monthly' | 'alltime';

export function useLeaderboard(period: Period) {
  const isRealUser = useAuthStore((s) => s.step === 'authenticated');

  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async (): Promise<LeaderboardResponse> => {
      if (isRealUser) {
        const data = await fetchLeaderboard(period);
        if (data) return data;
      }
      // Guest mode or API unavailable — return mock data (no AWS call)
      return { period, entries: getLeaderboard(period === 'alltime' ? 'alltime' : period), userRank: null };
    },
    staleTime:            10 * 60 * 1000,  // 10 min — leaderboard changes slowly
    gcTime:               30 * 60 * 1000,  // 30 min cache
    retry:                1,
    refetchOnWindowFocus: false,
    refetchOnMount:       false,
  });
}
