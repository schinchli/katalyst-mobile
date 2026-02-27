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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async (): Promise<LeaderboardResponse> => {
      if (!isAuthenticated) {
        // Guest mode: return mock data
        return { period, entries: getLeaderboard(period === 'alltime' ? 'alltime' : period), userRank: null };
      }
      const data = await fetchLeaderboard(period);
      if (!data) {
        // API unavailable — fallback to mock
        return { period, entries: getLeaderboard(period === 'alltime' ? 'alltime' : period), userRank: null };
      }
      return data;
    },
    staleTime:      60 * 1000,        // 1 min
    gcTime:         5 * 60 * 1000,    // 5 min
    retry:          1,
    refetchOnWindowFocus: false,
  });
}
