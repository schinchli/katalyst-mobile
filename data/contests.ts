import type { Contest } from '@/types';

// ─── Mock contest data ────────────────────────────────────────────────────────
// Times are relative so the UI always looks fresh
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export const contests: Contest[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  {
    id: 'live-001',
    title: 'Bedrock Sprint',
    description: 'Test your AWS Bedrock fundamentals in this live speed quiz. Fastest accurate scores win!',
    status: 'live',
    quizId: 'bedrock-fundamentals',
    quizTitle: 'Bedrock Fundamentals',
    category: 'bedrock',
    icon: 'cloud',
    entryFee: 50,
    prizeCoins: 1000,
    startTime: hoursAgo(1),
    endTime: hoursFromNow(2),
    participants: 148,
    maxParticipants: 200,
    topScore: 95,
  },

  // ── Upcoming ──────────────────────────────────────────────────────────────
  {
    id: 'upcoming-001',
    title: 'Agents & Multi-Agent Showdown',
    description: 'Put your agentic AI skills to the test. Top 3 win bonus coins and an exclusive badge!',
    status: 'upcoming',
    quizId: 'agents-multi-agent',
    quizTitle: 'Agents & Multi-Agent',
    category: 'agents',
    icon: 'users',
    entryFee: 50,
    prizeCoins: 800,
    startTime: hoursFromNow(6),
    endTime: hoursFromNow(9),
    participants: 67,
    maxParticipants: 150,
  },
  {
    id: 'upcoming-002',
    title: 'RAG Masters Challenge',
    description: 'Deep dive into Retrieval Augmented Generation — embeddings, vector DBs, and Knowledge Bases.',
    status: 'upcoming',
    quizId: 'rag-knowledge-bases',
    quizTitle: 'RAG & Knowledge Bases',
    category: 'rag',
    icon: 'database',
    entryFee: 75,
    prizeCoins: 1500,
    startTime: hoursFromNow(26),
    endTime: hoursFromNow(29),
    participants: 34,
    maxParticipants: 100,
  },
  {
    id: 'upcoming-003',
    title: 'Security & Compliance Expert Cup',
    description: 'Prove your expertise in AWS AI security, IAM, and compliance frameworks.',
    status: 'upcoming',
    quizId: 'security-compliance',
    quizTitle: 'Security & Compliance',
    category: 'security',
    icon: 'lock',
    entryFee: 100,
    prizeCoins: 2000,
    startTime: hoursFromNow(50),
    endTime: hoursFromNow(53),
    participants: 18,
    maxParticipants: 75,
  },

  // ── Past ──────────────────────────────────────────────────────────────────
  {
    id: 'past-001',
    title: 'Prompt Engineering Masters',
    description: 'Weekly prompt engineering challenge.',
    status: 'past',
    quizId: 'prompt-engineering',
    quizTitle: 'Prompt Engineering',
    category: 'prompt-eng',
    icon: 'edit-3',
    entryFee: 50,
    prizeCoins: 800,
    startTime: hoursAgo(72),
    endTime: hoursAgo(69),
    participants: 186,
    maxParticipants: 200,
    topScore: 100,
    winner: 'Alex Chen',
  },
  {
    id: 'past-002',
    title: 'Monitoring & Observability Sprint',
    description: 'AWS CloudWatch and GenAI observability challenge.',
    status: 'past',
    quizId: 'monitoring-observability',
    quizTitle: 'Monitoring & Observability',
    category: 'monitoring',
    icon: 'activity',
    entryFee: 50,
    prizeCoins: 600,
    startTime: hoursAgo(120),
    endTime: hoursAgo(117),
    participants: 124,
    maxParticipants: 150,
    topScore: 90,
    winner: 'Raj Patel',
  },
];

export function getContests(status: 'live' | 'upcoming' | 'past'): Contest[] {
  return contests.filter((c) => c.status === status);
}
