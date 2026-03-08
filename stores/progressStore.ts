import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Progress, QuizResult, Badge, BadgeId } from '@/types';
import { quizzes } from '@/data/quizzes';
import { submitQuiz, type ProgressResponse } from '@/services/apiService';
import { saveQuizResult, getQuizResults } from '@/config/db';
import { supabase } from '@/config/supabase';

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
  const currentThreshold = LEVEL_XP[level - 1] ?? 0;
  const nextThreshold    = LEVEL_XP[level] ?? LEVEL_XP[LEVEL_XP.length - 1];
  return { current: xp - currentThreshold, needed: nextThreshold - currentThreshold };
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
  totalQuizzes: 0,
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

        // Fire-and-forget: sync to AWS DynamoDB in the background.
        // Works only when Amplify is configured and the user is authenticated.
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
          const pct    = Math.round((result.score / result.totalQuestions) * 100);
          const passed = pct >= 70;

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
            (result.score / result.totalQuestions) * 100;
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

          // Completion badges — awarded regardless of pass/fail
          if (completed === 1)                                           award('first-quiz');
          if (result.score === result.totalQuestions)                    award('perfect-score');
          if (streak >= 7)                                               award('seven-day-streak');
          if (result.timeTaken > 0 && result.timeTaken < 60)            award('speed-demon');
          if (completed >= 6)                                            award('half-way');
          if (completed >= quizzes.length)                               award('quiz-marathon');

          // Category master: all quizzes in same category completed
          // Use all historical results (not just the recent-20 window) to avoid
          // missing older completions that were pushed out of the rolling slice.
          const completedIds = new Set([result, ...prev.recentResults].map((r) => r.quizId));
          if (quizMeta) {
            const catQuizIds = quizzes
              .filter((q) => q.category === quizMeta.category)
              .map((q) => q.id);
            if (catQuizIds.every((qid) => completedIds.has(qid))) {
              award('category-master');
            }
          }

          // ── Coin & XP calculation ─────────────────────────────────────────
          // Coins awarded for every completion; XP only on pass (≥ 70%)
          const totalNewCoins =
            result.score * 10                                             // 10 per correct answer
            + 20                                                          // completion bonus
            + (result.score === result.totalQuestions ? 50 : 0)          // perfect score bonus
            + newBadges.length * 100;                                     // badge rewards

          const diffMult = quizMeta?.difficulty === 'advanced' ? 2
            : quizMeta?.difficulty === 'intermediate' ? 1.5 : 1;
          const xpEarned = passed
            ? Math.round((result.score / result.totalQuestions) * 100 * diffMult)
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
          // Merge: take the higher value for numeric fields to avoid regressing
          return {
            progress: {
              ...prev,
              totalQuizzes:     Math.max(prev.completedQuizzes, remote.totalQuizzes),
              completedQuizzes: Math.max(prev.completedQuizzes, remote.totalQuizzes),
              coins:            Math.max(prev.coins ?? 0, remote.totalCoins ?? 0),
              totalCoinsEarned: Math.max(prev.totalCoinsEarned ?? 0, remote.totalCoins ?? 0),
              xp:               Math.max(prev.xp ?? 0, remote.totalXP ?? 0),
              level:            calculateLevel(Math.max(prev.xp ?? 0, remote.totalXP ?? 0)),
            },
          };
        }),

      clearPendingBadges: () => set({ pendingBadges: [] }),
      clearPendingCoins:  () => set({ pendingCoins: 0 }),

      initFromSupabase: async (userId: string) => {
        const results = await getQuizResults(userId).catch(() => [] as QuizResult[]);
        if (results.length === 0) return;
        set((state) => ({
          progress: {
            ...state.progress,
            recentResults:    results.slice(0, 20),
            completedQuizzes: Math.max(state.progress.completedQuizzes, results.length),
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
