/**
 * db.ts — Supabase CRUD helpers for mobile
 * Mirrors web/src/lib/db.ts — keeps both platforms in sync.
 */

import { supabase } from './supabase';
import type { QuizResult } from '@/types';

// ── Quiz Results ────────────────────────────────────────────────────────────

export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    quizId:         row.quiz_id as string,
    score:          row.score as number,
    totalQuestions: row.total_questions as number,
    timeTaken:      row.time_taken as number,
    answers:        (row.answers ?? {}) as Record<string, string>,
    completedAt:    row.completed_at as string,
  }));
}

export async function saveQuizResult(userId: string, result: QuizResult): Promise<void> {
  await supabase.from('quiz_results').upsert(
    {
      user_id:         userId,
      quiz_id:         result.quizId,
      score:           result.score,
      total_questions: result.totalQuestions,
      time_taken:      result.timeTaken,
      answers:         result.answers,
      completed_at:    result.completedAt,
    },
    { onConflict: 'user_id,quiz_id' },
  );
}

export async function deleteAllQuizResults(userId: string): Promise<void> {
  await supabase.from('quiz_results').delete().eq('user_id', userId);
}

// ── Subscription ────────────────────────────────────────────────────────────

export async function saveSubscription(userId: string, tier: 'free' | 'premium', plan?: string): Promise<void> {
  await supabase.from('subscriptions').upsert(
    {
      user_id:    userId,
      tier,
      plan:       plan ?? null,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

// ── Unlocked Courses ────────────────────────────────────────────────────────

export async function getUnlockedCourses(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('unlocked_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => row.course_id as string);
}

// ── Purchases ───────────────────────────────────────────────────────────────

export async function recordPurchase(
  userId: string,
  purchase: { purchaseType: 'subscription' | 'course'; courseId?: string; courseName?: string; plan?: string; amount: number; date: string },
): Promise<void> {
  await supabase.from('purchases').insert({
    user_id:       userId,
    purchase_type: purchase.purchaseType,
    course_id:     purchase.courseId ?? null,
    course_name:   purchase.courseName ?? null,
    plan:          purchase.plan ?? null,
    amount:        purchase.amount,
    purchased_at:  purchase.date,
  });
}
