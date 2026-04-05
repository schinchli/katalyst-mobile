import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Progress, QuizResult, Badge, BadgeId } from '@/types';
import { quizzes } from '@/data/quizzes';
import { submitQuiz, type ProgressResponse } from '@/services/apiService';
import { saveQuizResult, getQuizResults } from '@/config/db';
import { supabase } from '@/config/supabase';
import { getResultPercent } from '@/utils/quizResults';

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGE_DEFS: Record<BadgeId, Omit<Badge, 'id' | 'earnedAt'>> = {
  'first-quiz':       { name: 'First Step',      description: 'Complete your first quiz',              icon: 'star' },
  'perfect-score':    { name: 'Perfect Score',   description: 'Score 100% on any quiz',                icon: 'award' },
  'seven-day-streak': { name: '7-Day Streak',    description: 'Practice 7 days in a row',              icon: 'zap' },
  'speed-demon':      { name: 'Speed Demon',     description: 'Finish a quiz in under 60 seconds',     icon: 'wind' },
  'category-master':  { name: 'Category Master', description: 'Complete all quizzes in a category',    icon: 'layers' },
  'half-way':         { name: 'Half Way There',  description: 'Complete 6 or more quizzes',            icon: 'trending-up' },
  'quiz-marathon':    { name: 'Quiz Marathon',   description: 'Complete all 12 quizzes',               icon: 'flag' },
};

function makeBadge(id: BadgeId): Badge {
  return { id, ...BADGE_DEFS[id], earnedAt: new Date().toISOString() };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function yesterday() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

// ─── Level thresholds (XP required to reach each level) ──────────────────────
const LEVEL_XP = [0, 200, 500, 1000, 2000, 3500, 5000, 7500, 10000];
export const LEVEL_NAMES = [
  'Novice', 'Learner', 'Practitioner', 'Associate',
  'Professional', 'Expert', 'Master', 'Champion', 'Legend',
];

export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
    else break;
  }
  return Math.min(level, LEVEL_XP.length);
}

export function xpToNextLevel(xp: number, level: number): { current: number; needed: number } {
  const maxLevel = LEVEL_XP.length;
  const safeLevel = Math.min(Math.max(level, 1), maxLevel);
  // At max level there is no next level — return 0 so UI hides the XP bar
  if (safeLevel >= maxLevel) return { current: 0, needed: 0 };
  const currentThreshold = LEVEL_XP[safeLevel - 1] ?? 0;
  const nextThreshold    = LEVEL_XP[safeLevel] ?? currentThreshold;
  const needed           = Math.max(0, nextThreshold - currentThreshold);
  return { current: Math.max(0, xp - currentThreshold), needed };
}

function pctForResult(result: QuizResult): number {
  return getResultPercent(result);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function previousDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function summarizeResults(results: QuizResult[]) {
  const sorted = [...results].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const uniqueDays = Array.from(new Set(sorted.map((result) => dayKey(result.completedAt))));
  const latestDay = uniqueDays[0] ?? null;
  const todayStr = today();
  const yesterdayStr = yesterday();

  let currentStreak = 0;
  if (latestDay === todayStr || latestDay === yesterdayStr) {
    let expectedDay = latestDay;
    for (const entry of uniqueDays) {
      if (entry !== expectedDay) break;
      currentStreak += 1;
      expectedDay = previousDay(expectedDay);
    }
  }

  let longestStreak = 0;
  let activeRun = 0;
  let previous: string | null = null;
  for (const entry of uniqueDays) {
    if (!previous) {
      activeRun = 1;
    } else if (previousDay(previous) === entry) {
      activeRun += 1;
    } else {
      activeRun = 1;
    }
    longestStreak = Math.max(longestStreak, activeRun);
    previous = entry;
  }

  const completedQuizzes = sorted.length;
  const averageScore = completedQuizzes
    ? Math.round(sorted.reduce((sum, result) => sum + pctForResult(result), 0) / completedQuizzes)
    : 0;
  const computedXP = sorted.reduce((sum, result) => {
    const quizMeta = quizzes.find((quiz) => quiz.id === result.quizId);
    const passed = pctForResult(result) >= 70;
    if (!passed) return sum;
    const diffMult = quizMeta?.difficulty === 'advanced' ? 2 : quizMeta?.difficulty === 'intermediate' ? 1.5 : 1;
    return sum + Math.round(pctForResult(result) * diffMult);
  }, 0);

  return {
    completedQuizzes,
    averageScore,
    currentStreak,
    longestStreak,
    lastPlayedDate: latestDay,
    recentResults: sorted.slice(0, 20),
    xp: computedXP,
    level: calculateLevel(computedXP),
  };
}

// ─── State ────────────────────────────────────────────────────────────────────
interface ProgressState {
  progress: Progress;
  hydrated: boolean;
  pendingBadges: Badge[];
  pendingCoins: number;   // Coins just earned (shown in results, not persisted)
  setHydrated: () => void;
  addResult: (result: QuizResult) => void;
  syncProgress: (data: ProgressResponse) => void;
  clearPendingBadges: () => void;
  clearPendingCoins: () => void;
  reset: () => void;
  loadDemoData: () => void;
  initFromSupabase: (userId: string) => Promise<void>;
}

const initialProgress: Progress = {
  totalQuizzes: quizzes.length,
  completedQuizzes: 0,
  averageScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  badges: [],
  recentResults: [],
  coins: 200,           // Welcome bonus
  totalCoinsEarned: 200,
  xp: 0,
  level: 1,
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      hydrated: false,
      pendingBadges: [],
      pendingCoins: 0,

      setHydrated: () => set({ hydrated: true }),

      addResult: (result) => {
        // Look up quiz metadata for difficulty (needed for server-side reward calc)
        const quizMeta = quizzes.find((q) => q.id === result.quizId);

        // Fire-and-forget: sync result to Supabase Edge Function.
        // Silently swallowed when offline or in guest mode.
        submitQuiz({
          quizId:         result.quizId,
          answers:        result.answers,
          timeTaken:      result.timeTaken,
          score:          result.score,
          totalQuestions: result.totalQuestions,
          difficulty:     quizMeta?.difficulty,
        }).catch(() => { /* swallow — offline or guest mode */ });

        // Fire-and-forget: persist to Supabase quiz_results table.
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) saveQuizResult(user.id, result).catch(() => {});
        }).catch(() => {});

        set((state) => {
          const prev = state.progress;
          const todayStr = today();
          const yesterdayStr = yesterday();

          // ── Pass / fail ─────────────────────────────────────────────────────
          const pct    = pctForResult(result);
          const passed = pct >= 70;
          const perfectScore = pct === 100;

          // ── Streak ──────────────────────────────────────────────────────────
          let streak = prev.currentStreak;
          if (prev.lastPlayedDate === todayStr) {
            // already played today — streak unchanged
          } else if (prev.lastPlayedDate === yesterdayStr) {
            streak += 1;
          } else {
            streak = 1;
          }
          const longestStreak = Math.max(prev.longestStreak, streak);

          // ── Core stats ──────────────────────────────────────────────────────
          const results = [result, ...prev.recentResults].slice(0, 20);
          const completed = prev.completedQuizzes + 1;
          const totalScore =
            prev.averageScore * prev.completedQuizzes +
            pct;
          const avgScore = Math.round(totalScore / completed);

          const newProgress: Progress = {
            ...prev,
            completedQuizzes: completed,
            averageScore: avgScore,
            currentStreak: streak,
            longestStreak,
            lastPlayedDate: todayStr,
            recentResults: results,
          };

          // ── Badge evaluation ─────────────────────────────────────────────────
          const earned = new Set(prev.badges.map((b) => b.id));
          const newBadges: Badge[] = [];

          function award(id: BadgeId) {
            if (!earned.has(id)) { newBadges.push(makeBadge(id)); earned.add(id); }
          }

          // Badges only when quiz is passed (>= 70%)
          if (passed) {
            if (completed === 1)                                           award('first-quiz');
            if (perfectScore)                                              award('perfect-score');
            if (streak >= 7)                                               award('seven-day-streak');
            if (result.timeTaken > 0 && result.timeTaken < 60)             award('speed-demon');
            if (completed >= 6)                                            award('half-way');
            if (completed >= quizzes.length)                               award('quiz-marathon');

            // Category master: all quizzes in same category completed
            const completedIds = new Set([result, ...prev.recentResults].map((r) => r.quizId));
            if (quizMeta) {
              const catQuizIds = quizzes
                .filter((q) => q.category === quizMeta.category)
                .map((q) => q.id);
              if (catQuizIds.every((qid) => completedIds.has(qid))) {
                award('category-master');
              }
            }
          }

          // ── Coin & XP calculation ─────────────────────────────────────────
          // Coins awarded for every completion; XP only on pass (≥ 70%)
          // Coins only on pass to avoid rewarding failed attempts
          const totalNewCoins = passed
            ? result.score * 10                                           // 10 per correct answer
              + 20                                                        // completion bonus
              + (perfectScore ? 50 : 0)                                   // perfect score bonus
              + newBadges.length * 100                                    // badge rewards
            : 0;

          const diffMult = quizMeta?.difficulty === 'advanced' ? 2
            : quizMeta?.difficulty === 'intermediate' ? 1.5 : 1;
          const xpEarned = passed
            ? Math.round(pct * diffMult)
            : 0;

          const newXP    = prev.xp + xpEarned;
          const newLevel = calculateLevel(newXP);
          const newCoins = (prev.coins ?? 0) + totalNewCoins;

          return {
            progress: {
              ...newProgress,
              badges: [...prev.badges, ...newBadges],
              coins:           newCoins,
              totalCoinsEarned: (prev.totalCoinsEarned ?? 200) + totalNewCoins,
              xp:    newXP,
              level: newLevel,
            },
            pendingBadges: newBadges,
            pendingCoins:  totalNewCoins,
          };
        });
      },

      syncProgress: (data) =>
        set((state) => {
          const remote = data.statistics;
          const prev   = state.progress;
          const recentResults = data.recentAttempts.map((attempt) => ({
            quizId: attempt.quizId,
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            timeTaken: attempt.timeTaken,
            answers: attempt.answers,
            completedAt: attempt.completedAt,
          }));
          const summary = summarizeResults(recentResults);
          const mergedXP = Math.max(prev.xp ?? 0, summary.xp, remote.totalXP ?? 0);
          // Merge: take the higher value for numeric fields to avoid regressing
          return {
            progress: {
              ...prev,
              ...summary,
              totalQuizzes:     quizzes.length,
              completedQuizzes: Math.max(prev.completedQuizzes, summary.completedQuizzes, remote.totalQuizzes),
              coins:            Math.max(prev.coins ?? 0, remote.totalCoins ?? 0),
              totalCoinsEarned: Math.max(prev.totalCoinsEarned ?? 0, remote.totalCoins ?? 0),
              xp:               mergedXP,
              level:            calculateLevel(mergedXP),
            },
          };
        }),

      clearPendingBadges: () => set({ pendingBadges: [] }),
      clearPendingCoins:  () => set({ pendingCoins: 0 }),

      initFromSupabase: async (userId: string) => {
        const results = await getQuizResults(userId).catch(() => [] as QuizResult[]);
        if (results.length === 0) return;
        const summary = summarizeResults(results);
        set((state) => ({
          progress: {
            ...state.progress,
            ...summary,
            totalQuizzes: quizzes.length,
            xp: Math.max(state.progress.xp ?? 0, summary.xp),
            level: calculateLevel(Math.max(state.progress.xp ?? 0, summary.xp)),
          },
        }));
      },

      reset: () => set({ progress: initialProgress, pendingBadges: [], pendingCoins: 0 }),

      loadDemoData: () => set({
        progress: {
          totalQuizzes: 13,
          completedQuizzes: 6,
          averageScore: 78,
          currentStreak: 5,
          longestStreak: 7,
          lastPlayedDate: today(),
          badges: [
            { id: 'first-quiz',    ...BADGE_DEFS['first-quiz'],    earnedAt: new Date(Date.now() - 6 * 86400000).toISOString() },
            { id: 'half-way',      ...BADGE_DEFS['half-way'],      earnedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
            { id: 'speed-demon',   ...BADGE_DEFS['speed-demon'],   earnedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
          ],
          recentResults: [
            { quizId: 'bedrock-fundamentals',    score: 9,  totalQuestions: 10, timeTaken: 142, completedAt: new Date(Date.now() - 0 * 86400000).toISOString(), answers: {} },
            { quizId: 'rag-knowledge-bases',     score: 8,  totalQuestions: 10, timeTaken: 178, completedAt: new Date(Date.now() - 1 * 86400000).toISOString(), answers: {} },
            { quizId: 'ai-agents',               score: 7,  totalQuestions: 10, timeTaken: 210, completedAt: new Date(Date.now() - 2 * 86400000).toISOString(), answers: {} },
            { quizId: 'prompt-engineering',      score: 10, totalQuestions: 10, timeTaken: 95,  completedAt: new Date(Date.now() - 3 * 86400000).toISOString(), answers: {} },
            { quizId: 'security-compliance',     score: 6,  totalQuestions: 10, timeTaken: 195, completedAt: new Date(Date.now() - 4 * 86400000).toISOString(), answers: {} },
            { quizId: 'mlops-sagemaker',         score: 8,  totalQuestions: 10, timeTaken: 220, completedAt: new Date(Date.now() - 5 * 86400000).toISOString(), answers: {} },
          ],
          coins: 1240,
          totalCoinsEarned: 1440,
          xp: 720,
          level: 4,
        },
        pendingBadges: [],
        pendingCoins: 0,
      }),
    }),
    {
      name: 'progress-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Exclude transient fields from storage
      partialize: (state) => ({
        progress: state.progress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
