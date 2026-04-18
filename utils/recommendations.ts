/**
 * Session-aware content recommendation engine.
 *
 * PRIORITY MODEL
 * ──────────────
 * getPersonalisedFeed():
 *   0. Active learning-path next step    (always first if provided)
 *   1. Weak categories — domain-weight × score gap drives urgency
 *   2. Stale-strong categories — spaced repetition decay resurfaces content
 *   3. Untouched categories — cross-exam overlap discount applied
 *   4. Strong recent categories — "challenge yourself" harder quiz
 *
 * getRecommendations() (post-fail):
 *   1. Warm-up quizzes for the failed domain (from examGuides)
 *   2. Flashcard deck for the exam
 *   3. Videos scored by wrong-answer signals + exam-guide task keywords
 *
 * SPACED REPETITION
 * ─────────────────
 * Strong categories re-enter the "review" pool after:
 *   >7 days  → medium urgency (untouched tier)
 *   >21 days → high urgency (weak tier, purple "review" badge)
 *
 * SOURCE OF TRUTH
 * ───────────────
 * examGuides.ts drives domain weights, task keywords, and warm-up mappings.
 * Updating that file is the only change needed when AWS revises an exam guide.
 */

import { PLAYLIST, type VideoItem } from '@/data/videos';
import { quizzes } from '@/data/quizzes';
import type { Question, QuizResult } from '@/types';
import {
  getDomainWeightFactor,
  getDomainSignals,
  getDomainLabel,
  getDomainForQuiz,
  getRawDomainWeight,
  getDomainName,
  getMasteredSharedTopics,
  getSharedTopicsForQuiz,
  getCrossExamCoverage,
  type SharedTopicId,
} from '@/data/examGuides';

// ─── Category → topic tag mapping ────────────────────────────────────────────
const CATEGORY_TAGS: Record<string, string[]> = {
  bedrock:             ['Bedrock'],
  genai:               ['GenAI', 'Prompting'],
  security:            ['Security'],
  mlops:               ['MLOps'],
  'cost-optimization': ['Cost Optimization'],
  compute:             ['AWS'],
  networking:          ['AWS'],
  databases:           ['AWS'],
  serverless:          ['AWS'],
  'security-compliance': ['Security'],
  'clf-c02':           ['AWS', 'Security', 'Cost Optimization'],
  'aip-c01':           ['Bedrock', 'RAG', 'Agents', 'Security'],
  'aif-c01':           ['Bedrock', 'RAG', 'Agents', 'Security'],  // official AWS code alias
};

// ─── Exam → flashcard deck mapping ───────────────────────────────────────────
// Keys are AWS exam codes from examGuides; values are flashcard resourceIds.
const EXAM_FLASHCARD_MAP: Record<string, string> = {
  'CLF-C02': 'aws-practitioner',
  'AIF-C01': 'aip-c01',
};

// ─── Topic keyword signals (for wrong-answer analysis) ───────────────────────
const TOPIC_SIGNALS: Record<string, string[]> = {
  Bedrock: [
    'bedrock', 'foundation model', 'fm', 'claude', 'titan', 'nova',
    'converse api', 'invocation', 'bedrock flows', 'intelligent routing',
    'provisioned throughput', 'model unit',
  ],
  RAG: [
    'rag', 'retrieval', 'knowledge base', 'chunking', 'embedding',
    'vector', 'opensearch', 'semantic', 'hierarchical', 'grounding',
    'ragas', 'faithfulness', 'context recall',
  ],
  Agents: [
    'agent', 'multi-agent', 'agentcore', 'supervisor', 'sub-agent',
    'action group', 'orchestrat', 'tool use', 'function calling',
  ],
  Prompting: [
    'prompt', 'few-shot', 'zero-shot', 'chain-of-thought',
    'system prompt', 'context window', 'temperature', 'top-p',
    'prompt caching', 'prompt engineering',
  ],
  Security: [
    'guardrail', 'security', 'iam', 'policy', 'encryption', 'kms',
    'vpc', 'compliance', 'gdpr', 'scp', 'audit', 'model invocation logging',
    'a2i', 'human review', 'shared responsibility',
  ],
  MLOps: [
    'mlops', 'sagemaker', 'pipeline', 'deploy', 'inference', 'endpoint',
    'monitoring', 'drift', 'appconfig', 'model routing', 'neo', 'edge',
  ],
  'Cost Optimization': [
    'cost', 'saving', 'optimize', 'budget', 'billing', 'pricing',
    'reserved', 'spot', 'free tier', 'cri', 'cross-region',
  ],
  GenAI: [
    'generative ai', 'genai', 'llm', 'large language model', 'diffusion',
    'multimodal', 'fine-tun', 'rlhf', 'alignment', 'hallucination',
  ],
  AWS: [
    'ec2', 's3', 'cloudwatch', 'cloudformation', 'rds', 'dynamodb',
    'sns', 'sqs', 'api gateway', 'route53', 'cloudfront', 'elb',
    'auto scaling', 'ecs', 'eks', 'fargate', 'elastic',
    'cloud concepts', 'availability zone', 'region',
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Recommendation {
  type: 'video' | 'quiz' | 'flashcard';
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor?: string;
  youtubeId?: string;
  quizId?: string;
  flashcardCategory?: string;
  reason: string;
  priority: 'weak' | 'new' | 'reinforce' | 'review';
  relevanceScore: number;
  domainLabel?: string;
  isReview?: boolean;  // true = spaced repetition resurface
}

// ─── Category performance analysis ───────────────────────────────────────────
interface CategoryPerf {
  category: string;
  attempts: number;
  avgScore: number;
  lastScore: number;
  lastAttemptDate: string | null;
  status: 'weak' | 'strong' | 'untouched';
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function analyseHistory(results: QuizResult[]): CategoryPerf[] {
  // results are expected newest-first (from progressStore)
  const byCategory: Record<string, {
    scores: number[];
    lastScore: number;
    lastDate: string | null;
  }> = {};

  for (const result of results) {
    const quiz = quizzes.find((q) => q.id === result.quizId);
    if (!quiz) continue;
    const pct = result.totalQuestions > 0
      ? Math.round((result.score / result.totalQuestions) * 100)
      : 0;
    const cat = quiz.category;
    if (!byCategory[cat]) byCategory[cat] = { scores: [], lastScore: pct, lastDate: null };
    byCategory[cat].scores.push(pct);
    // First entry is newest (results are newest-first)
    if (!byCategory[cat].lastDate) byCategory[cat].lastDate = result.completedAt ?? null;
    byCategory[cat].lastScore = byCategory[cat].scores[0];
  }

  const attempted = Object.entries(byCategory).map(([category, data]) => {
    const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
    return {
      category,
      attempts: data.scores.length,
      avgScore,
      lastScore: data.lastScore,
      lastAttemptDate: data.lastDate,
      status: (avgScore >= 70 ? 'strong' : 'weak') as CategoryPerf['status'],
    };
  });

  const allCategories = [...new Set(quizzes.map((q) => q.category))];
  const attemptedCats = new Set(attempted.map((a) => a.category));
  const untouched = allCategories
    .filter((c) => !attemptedCats.has(c))
    .map((c) => ({
      category: c,
      attempts: 0,
      avgScore: 0,
      lastScore: 0,
      lastAttemptDate: null,
      status: 'untouched' as const,
    }));

  return [...attempted, ...untouched];
}

// ─── Exam-guide helpers ───────────────────────────────────────────────────────

function getCategoryWeightFactor(category: string): number {
  const ids = quizzes.filter((q) => q.category === category).map((q) => q.id);
  if (ids.length === 0) return 0.5;
  return Math.max(...ids.map(getDomainWeightFactor));
}

function getCategoryDomainLabel(category: string): string | null {
  const ids = quizzes.filter((q) => q.category === category).map((q) => q.id);
  for (const id of ids) {
    const label = getDomainLabel(id);
    if (label) return label;
  }
  return null;
}

/**
 * Priority score incorporating:
 *   - exam domain weight (high-weight domains surface first)
 *   - performance (lower score = more urgent)
 *   - spaced repetition (stale strong content resurfaces)
 *   - cross-exam overlap (already-mastered topics discounted)
 *
 * Tier bands (never overlap, so weak > untouched > review > strong):
 *   weak:          200 + gap × (1 + wf)         → 200–400
 *   stale strong:  80–160 based on staleness     → review tier
 *   untouched:     100 + 50 × (1 + wf), -overlap → 90–200
 *   strong recent: 20 × (1 + wf)                 → 20–40
 */
function categoryPriorityScore(
  perf: CategoryPerf,
  masteredTopics: Set<SharedTopicId> = new Set(),
): number {
  const wf = getCategoryWeightFactor(perf.category);

  if (perf.status === 'weak') {
    return 200 + Math.round((100 - perf.avgScore) * (1 + wf));
  }

  if (perf.status === 'strong') {
    const age = daysSince(perf.lastAttemptDate);
    if (age > 21) {
      // High urgency review — resurfaces above untouched low-weight categories
      return 160 + Math.round(wf * 40);
    }
    if (age > 7) {
      // Medium urgency review
      return 80 + Math.round(wf * 40);
    }
    // Recent strong — lowest priority
    return Math.round(20 * (1 + wf));
  }

  // untouched
  let score = 100 + Math.round(50 * (1 + wf));
  const ids = quizzes.filter((q) => q.category === perf.category).map((q) => q.id);
  const categoryTopics = new Set(ids.flatMap(getSharedTopicsForQuiz));
  if (categoryTopics.size > 0) {
    const covered = [...categoryTopics].filter((t) => masteredTopics.has(t)).length;
    score = Math.round(score * (1 - (covered / categoryTopics.size) * 0.4));
  }
  return score;
}

/** Whether a strong category should be treated as a spaced-repetition review. */
function isStaleStrong(perf: CategoryPerf): boolean {
  return perf.status === 'strong' && daysSince(perf.lastAttemptDate) > 7;
}

// ─── Video helpers ────────────────────────────────────────────────────────────
function videosForTags(tags: string[], exclude: Set<string> = new Set()): VideoItem[] {
  return PLAYLIST.filter((v) => tags.includes(v.tag) && !exclude.has(v.id));
}

// ─── Wrong-answer signal scoring ─────────────────────────────────────────────
function scoreWrongAnswers(
  questions: Question[],
  failedQuizId?: string,
): Record<string, number> {
  const extraSignals = failedQuizId ? getDomainSignals(failedQuizId) : [];
  const signals: Record<string, string[]> = { ...TOPIC_SIGNALS };
  if (extraSignals.length > 0) {
    signals['AWS'] = [...(signals['AWS'] ?? []), ...extraSignals];
  }

  const totals: Record<string, number> = {};
  for (const q of questions) {
    const text = (q.text + ' ' + (q.category ?? '')).toLowerCase();
    for (const [tag, kws] of Object.entries(signals)) {
      const hit = kws.filter((s) => text.includes(s)).length;
      if (hit > 0) totals[tag] = (totals[tag] ?? 0) + hit;
    }
  }
  return totals;
}

// ─── PUBLIC: Post-quiz-fail recommendations ───────────────────────────────────
/**
 * Returns a mixed feed of: warm-up quizzes → flashcard → videos.
 * Warm-ups come from the failed quiz's domain definition in examGuides.ts —
 * updating that file automatically changes what surfaces here.
 *
 * @param failedQuizId  ID of the quiz that was just failed.
 *                      Enables domain warm-up lookup + precise signal matching.
 */
export function getRecommendations(
  wrongQuestions: Question[],
  limit = 4,
  sessionHistory: QuizResult[] = [],
  failedQuizId?: string,
): Recommendation[] {
  const completedIds = new Set(sessionHistory.map((r) => r.quizId));
  const domainResult = failedQuizId ? getDomainForQuiz(failedQuizId) : null;
  const domainLabel = failedQuizId ? getDomainLabel(failedQuizId) : null;
  const recs: Recommendation[] = [];

  // 1. Warm-up quizzes for the failed domain ──────────────────────────────────
  if (domainResult) {
    const warmups = domainResult.domain.warmupQuizIds
      .filter((id) => id !== failedQuizId && !completedIds.has(id));

    for (const wId of warmups) {
      if (recs.length >= limit) break;
      const quiz = quizzes.find((q) => q.id === wId);
      if (!quiz) continue;
      recs.push({
        type: 'quiz',
        id: `wup-${wId}`,
        title: quiz.title,
        subtitle: `${quiz.questionCount}Q · warm-up`,
        tag: quiz.category,
        quizId: wId,
        reason: `Warm-up for ${domainLabel ?? domainResult.domain.name} — build the foundations first`,
        priority: 'weak',
        relevanceScore: 200,
        domainLabel: domainLabel ?? undefined,
      });
    }
  }

  // 2. Flashcard deck for the exam ────────────────────────────────────────────
  if (domainResult && recs.length < limit) {
    const flashcardCat = EXAM_FLASHCARD_MAP[domainResult.guide.examCode];
    if (flashcardCat) {
      recs.push({
        type: 'flashcard',
        id: `fc-${flashcardCat}`,
        title: `${domainResult.guide.examName} Flashcards`,
        subtitle: 'Key terms & definitions',
        tag: domainResult.guide.examCode,
        flashcardCategory: flashcardCat,
        reason: `Reinforce terminology for ${domainLabel ?? domainResult.domain.name} before retrying`,
        priority: 'weak',
        relevanceScore: 180,
        domainLabel: domainLabel ?? undefined,
      });
    }
  }

  // 3. Videos scored by wrong-answer signals ──────────────────────────────────
  if (recs.length < limit) {
    const wrongScores = scoreWrongAnswers(wrongQuestions, failedQuizId);
    const videoRecs = PLAYLIST
      .map((video) => {
        const tagScore = wrongScores[video.tag] ?? 0;
        const descLower = (video.title + ' ' + (video.description ?? '')).toLowerCase();
        let secondary = 0;
        for (const [tag, score] of Object.entries(wrongScores)) {
          if ((TOPIC_SIGNALS[tag] ?? []).some((s) => descLower.includes(s))) secondary += score;
        }
        const relevanceScore = tagScore * 2 + secondary;
        return {
          type: 'video' as const,
          id: video.id,
          title: video.title,
          subtitle: `${video.tag} · ${video.duration}`,
          tag: video.tag,
          tagColor: video.tagColor,
          youtubeId: video.youtubeId,
          reason: domainLabel
            ? `Covers ${domainLabel} topics you missed`
            : 'Covers topics you struggled with',
          priority: 'weak' as const,
          relevanceScore,
          domainLabel: domainLabel ?? undefined,
        };
      })
      .filter((r) => r.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    for (const v of videoRecs) {
      if (recs.length >= limit) break;
      recs.push(v);
    }
  }

  // 4. Fallback: best-matching video regardless of score ──────────────────────
  if (recs.length === 0) {
    const tags = domainResult
      ? (CATEGORY_TAGS[domainResult.guide.examCode.toLowerCase()] ?? ['AWS'])
      : ['AWS'];
    const fallback = PLAYLIST.find((v) => tags.includes(v.tag));
    if (fallback) {
      recs.push({
        type: 'video',
        id: fallback.id,
        title: fallback.title,
        subtitle: `${fallback.tag} · ${fallback.duration}`,
        tag: fallback.tag,
        tagColor: fallback.tagColor,
        youtubeId: fallback.youtubeId,
        reason: 'Foundation resource — start here',
        priority: 'weak',
        relevanceScore: 10,
      });
    }
  }

  return recs.slice(0, limit);
}

// ─── PUBLIC: Full session-aware personalised recommendations ─────────────────
/**
 * @param nextPathQuizId  Quiz ID of the next uncompleted step in the user's
 *                        active learning path. When provided, this step is
 *                        always inserted first in the feed.
 */
export function getPersonalisedFeed(
  sessionHistory: QuizResult[],
  limit = 6,
  nextPathQuizId?: string,
): Recommendation[] {
  const performance = analyseHistory(sessionHistory);
  const completedIds = new Set(sessionHistory.map((r) => r.quizId));
  const usedVideoIds = new Set<string>();
  const usedQuizIds = new Set<string>();
  const recs: Recommendation[] = [];

  const masteredTopics = getMasteredSharedTopics(sessionHistory);

  // ── 0. Active learning-path next step ─────────────────────────────────────
  if (nextPathQuizId && !completedIds.has(nextPathQuizId)) {
    const quiz = quizzes.find((q) => q.id === nextPathQuizId);
    if (quiz) {
      const label = getDomainLabel(nextPathQuizId) ?? undefined;
      usedQuizIds.add(nextPathQuizId);
      recs.push({
        type: 'quiz',
        id: `path-${nextPathQuizId}`,
        title: quiz.title,
        subtitle: `${quiz.questionCount}Q · next in path`,
        tag: quiz.category,
        quizId: nextPathQuizId,
        reason: label
          ? `Your next learning path step — ${label}`
          : 'Your next learning path step',
        priority: 'new',
        relevanceScore: 999,
        domainLabel: label,
      });
    }
  }

  // Sort remaining categories by priority score
  const sorted = [...performance].sort(
    (a, b) => categoryPriorityScore(b, masteredTopics) - categoryPriorityScore(a, masteredTopics),
  );

  for (const perf of sorted) {
    if (recs.length >= limit) break;

    const tags = CATEGORY_TAGS[perf.category] ?? [];
    const wf = getCategoryWeightFactor(perf.category);
    const domainLabel = getCategoryDomainLabel(perf.category) ?? undefined;
    const stale = isStaleStrong(perf);

    // ── 1 & 2. Weak + stale-strong (spaced repetition) ──────────────────────
    if (perf.status === 'weak' || stale) {
      const weightedScore = stale
        ? Math.round(80 + wf * 40)
        : Math.round((100 - perf.avgScore) * (1 + wf));

      const reason = stale
        ? domainLabel
          ? `${domainLabel} — last reviewed ${daysSince(perf.lastAttemptDate)}d ago, time to refresh`
          : `${perf.category} — time to review (${daysSince(perf.lastAttemptDate)}d since last attempt)`
        : domainLabel
          ? `${domainLabel} — you averaged ${perf.avgScore}%, fix this first`
          : `You averaged ${perf.avgScore}% in ${perf.category}`;

      // Retry / review quiz
      const retryQuiz = quizzes.find(
        (q) => q.category === perf.category && !usedQuizIds.has(q.id),
      );
      if (retryQuiz && recs.length < limit) {
        usedQuizIds.add(retryQuiz.id);
        recs.push({
          type: 'quiz',
          id: `q-${retryQuiz.id}`,
          title: retryQuiz.title,
          subtitle: stale
            ? `${retryQuiz.questionCount}Q · review`
            : `${retryQuiz.questionCount}Q · retry`,
          tag: perf.category,
          quizId: retryQuiz.id,
          reason: stale
            ? `Review ${perf.category} — spaced repetition keeps it in long-term memory`
            : `Retry to improve from ${perf.avgScore}% — need ≥70%`,
          priority: stale ? 'review' : 'weak',
          relevanceScore: weightedScore,
          domainLabel,
          isReview: stale,
        });
      }

      // Supporting video
      const vids = videosForTags(tags, usedVideoIds);
      if (vids.length > 0 && recs.length < limit) {
        const v = vids[0];
        usedVideoIds.add(v.id);
        recs.push({
          type: 'video',
          id: `v-${v.id}`,
          title: v.title,
          subtitle: `${v.tag} · ${v.duration}`,
          tag: v.tag,
          tagColor: v.tagColor,
          youtubeId: v.youtubeId,
          reason,
          priority: stale ? 'review' : 'weak',
          relevanceScore: Math.round(weightedScore * 0.9),
          domainLabel,
          isReview: stale,
        });
      }

    // ── 3. Untouched ─────────────────────────────────────────────────────────
    } else if (perf.status === 'untouched') {
      const weightedScore = Math.round(50 * (1 + wf));
      const reason = domainLabel
        ? `${domainLabel} — not started yet`
        : `You haven't tried ${perf.category} yet`;

      const q = quizzes.find(
        (quiz) => quiz.category === perf.category && !usedQuizIds.has(quiz.id),
      );
      if (q && recs.length < limit) {
        usedQuizIds.add(q.id);
        recs.push({
          type: 'quiz',
          id: `q-${q.id}`,
          title: q.title,
          subtitle: `${q.questionCount}Q · new topic`,
          tag: q.category,
          quizId: q.id,
          reason,
          priority: 'new',
          relevanceScore: weightedScore,
          domainLabel,
        });
      }

      const vids = videosForTags(tags, usedVideoIds);
      if (vids.length > 0 && recs.length < limit) {
        const v = vids[0];
        usedVideoIds.add(v.id);
        recs.push({
          type: 'video',
          id: `v-${v.id}`,
          title: v.title,
          subtitle: `${v.tag} · ${v.duration}`,
          tag: v.tag,
          tagColor: v.tagColor,
          youtubeId: v.youtubeId,
          reason: `Start here before attempting the ${perf.category} quiz`,
          priority: 'new',
          relevanceScore: Math.round(weightedScore * 0.9),
          domainLabel,
        });
      }

    // ── 4. Strong (recent) — challenge mode ──────────────────────────────────
    } else {
      const weightedScore = Math.round(20 * (1 + wf));
      const harder = quizzes.find(
        (q) =>
          q.category === perf.category &&
          !usedQuizIds.has(q.id) &&
          q.difficulty !== 'beginner',
      );
      if (harder && recs.length < limit) {
        usedQuizIds.add(harder.id);
        recs.push({
          type: 'quiz',
          id: `q-${harder.id}`,
          title: harder.title,
          subtitle: `${harder.questionCount}Q · challenge`,
          tag: harder.category,
          quizId: harder.id,
          reason: `You're at ${perf.avgScore}% — ready for harder questions`,
          priority: 'reinforce',
          relevanceScore: weightedScore,
          domainLabel,
        });
      }
    }
  }

  // Fallback: seed with beginner videos when no history
  if (recs.length === 0) {
    return PLAYLIST.slice(0, limit).map((v) => ({
      type: 'video' as const,
      id: `v-${v.id}`,
      title: v.title,
      subtitle: `${v.tag} · ${v.duration}`,
      tag: v.tag,
      tagColor: v.tagColor,
      youtubeId: v.youtubeId,
      reason: 'Start here — great foundation resource',
      priority: 'new' as const,
      relevanceScore: 10,
    }));
  }

  return recs.slice(0, limit);
}

// ─── PUBLIC: Gap analysis summary ────────────────────────────────────────────
export interface GapSummary {
  weakCategories: string[];
  untouchedCategories: string[];
  strongCategories: string[];
  staleCategories: string[];      // strong but not reviewed in >7 days
  overallScore: number;
  topGap: string | null;
  topWeightedGap: {
    category: string;
    domainName: string;
    examWeight: number;
    avgScore: number;
    domainLabel: string;
  } | null;
}

export function getGapSummary(sessionHistory: QuizResult[]): GapSummary {
  const performance = analyseHistory(sessionHistory);
  const masteredTopics = getMasteredSharedTopics(sessionHistory);

  const weak     = performance.filter((p) => p.status === 'weak').map((p) => p.category);
  const untouched = performance.filter((p) => p.status === 'untouched').map((p) => p.category);
  const strong   = performance.filter((p) => p.status === 'strong').map((p) => p.category);
  const stale    = performance.filter((p) => isStaleStrong(p)).map((p) => p.category);

  const attempted = performance.filter((p) => p.status !== 'untouched');
  const overallScore = attempted.length
    ? Math.round(attempted.reduce((sum, p) => sum + p.avgScore, 0) / attempted.length)
    : 0;

  const topGap = performance
    .filter((p) => p.status === 'weak')
    .sort((a, b) => a.avgScore - b.avgScore)[0]?.category ?? null;

  const topWeightedGapPerf = performance
    .filter((p) => p.status === 'weak')
    .sort((a, b) => categoryPriorityScore(b, masteredTopics) - categoryPriorityScore(a, masteredTopics))[0];

  let topWeightedGap: GapSummary['topWeightedGap'] = null;
  if (topWeightedGapPerf) {
    const ids = quizzes.filter((q) => q.category === topWeightedGapPerf.category).map((q) => q.id);
    for (const id of ids) {
      const label = getDomainLabel(id);
      const rawWeight = getRawDomainWeight(id);
      const domainName = getDomainName(id);
      if (label && rawWeight !== null && domainName) {
        topWeightedGap = {
          category: topWeightedGapPerf.category,
          domainName,
          examWeight: rawWeight,
          avgScore: topWeightedGapPerf.avgScore,
          domainLabel: label,
        };
        break;
      }
    }
    if (!topWeightedGap) {
      topWeightedGap = {
        category: topWeightedGapPerf.category,
        domainName: topWeightedGapPerf.category,
        examWeight: 0,
        avgScore: topWeightedGapPerf.avgScore,
        domainLabel: topWeightedGapPerf.category,
      };
    }
  }

  return { weakCategories: weak, untouchedCategories: untouched, strongCategories: strong, staleCategories: stale, overallScore, topGap, topWeightedGap };
}

// ─── PUBLIC: Cross-exam study efficiency ─────────────────────────────────────

export {
  getCrossExamCoverage,
  getRecommendedExamOrder,
  getMasteredSharedTopics,
  SHARED_TOPICS,
} from '@/data/examGuides';

export function getStudyEfficiencyHints(
  targetExamKey: string,
  sessionHistory: QuizResult[],
): Array<{
  domainName: string;
  examWeight: number;
  coveragePct: number;
  status: 'covered' | 'partial' | 'fresh';
  hint: string;
}> {
  const masteredTopics = getMasteredSharedTopics(sessionHistory);
  const coverage = getCrossExamCoverage(targetExamKey, masteredTopics);
  return coverage.map(({ domain, status, coveragePct }) => {
    const hint =
      status === 'covered' ? `Already covered → skim to confirm, skip deep study` :
      status === 'partial' ? `${coveragePct}% covered from prior study → focus on the ${100 - coveragePct}% delta` :
      `Fully new material — full study needed`;
    return { domainName: domain.name, examWeight: domain.weight, coveragePct, status, hint };
  });
}
