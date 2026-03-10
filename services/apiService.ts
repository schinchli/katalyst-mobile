/**
 * API Service
 * ───────────
 * Typed client for the LMS REST API (Supabase Edge Functions).
 * Automatically attaches the Supabase access token from the current session.
 *
 * All methods return null (instead of throwing) when the user is unauthenticated
 * or when the backend is not yet configured — so callers can degrade gracefully.
 */

import { supabase } from '@/config/supabase';
import { AppConfig } from '@/config/appConfig';
import type { LeaderboardEntry } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubmitQuizPayload {
  quizId: string;
  answers: Record<string, string>;
  timeTaken: number;
  score: number;
  totalQuestions: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubmitQuizResponse {
  attemptId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  pct: number;
  passed: boolean;
  coinsEarned: number;
  xpEarned: number;
  completedAt: string;
}

export interface UserStatistics {
  userId: string;
  totalQuizzes: number;
  totalCoins: number;
  totalXP: number;
  totalCorrect: number;
  totalAnswered: number;
  lastActiveAt: string | null;
}

export interface RecentAttempt {
  userId: string;
  attemptId: string;
  quizId: string;
  answers: Record<string, string>;
  timeTaken: number;
  score: number;
  totalQuestions: number;
  pct: number;
  passed: boolean;
  completedAt: string;
}

export interface ProgressResponse {
  statistics: UserStatistics;
  recentAttempts: RecentAttempt[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function apiUrl(path: string): string {
  const base = AppConfig.supabase.functionsUrl.replace(/\/$/, '');
  return `${base}${path}`;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.warn(`[apiService] ${options.method ?? 'GET'} ${path} → ${res.status}`, body);
    return null;
  }

  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** POST /quiz-submit — returns null if not authenticated or API unavailable */
export async function submitQuiz(
  payload: SubmitQuizPayload,
): Promise<SubmitQuizResponse | null> {
  return apiFetch<SubmitQuizResponse>('/quiz-submit', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

/** GET /progress-fetch — returns null if not authenticated or API unavailable */
export async function fetchProgress(): Promise<ProgressResponse | null> {
  return apiFetch<ProgressResponse>('/progress-fetch');
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export type { LeaderboardEntry };

export interface LeaderboardResponse {
  period: 'daily' | 'monthly' | 'alltime';
  entries: LeaderboardEntry[];
  userRank: number | null;
}

/** GET /leaderboard-fetch — returns null if not authenticated or API unavailable */
export async function fetchLeaderboard(
  _period: 'daily' | 'monthly' | 'alltime' = 'alltime',
): Promise<LeaderboardResponse | null> {
  return apiFetch<LeaderboardResponse>('/leaderboard-fetch');
}
