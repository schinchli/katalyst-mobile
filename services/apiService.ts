/**
 * API Service
 * ───────────
 * Typed client for the LMS REST API (API Gateway + Lambda + DynamoDB).
 * Automatically attaches the Cognito ID token from the current session.
 *
 * All methods return null (instead of throwing) when the user is unauthenticated
 * or when the AWS backend is not yet configured — so callers can degrade gracefully.
 */

import { fetchAuthSession } from 'aws-amplify/auth';
import { AppConfig } from '@/config/appConfig';
import { isAmplifyReady } from '@/config/amplify';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubmitQuizPayload {
  quizId: string;
  answers: Record<string, string>;
  timeTaken: number;
  score: number;
  totalQuestions: number;
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

async function getIdToken(): Promise<string | null> {
  if (!isAmplifyReady()) return null;
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

function apiUrl(path: string): string {
  const base = AppConfig.aws.apiUrl.replace(/\/$/, '');
  return `${base}${path}`;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const token = await getIdToken();
  if (!token) return null;

  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization:  token,
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

/** POST /quiz/submit — returns null if not authenticated or API unavailable */
export async function submitQuiz(
  payload: SubmitQuizPayload,
): Promise<SubmitQuizResponse | null> {
  return apiFetch<SubmitQuizResponse>('/quiz/submit', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

/** GET /progress — returns null if not authenticated or API unavailable */
export async function fetchProgress(): Promise<ProgressResponse | null> {
  return apiFetch<ProgressResponse>('/progress');
}
