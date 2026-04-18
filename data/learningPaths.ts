/**
 * Learning Path definitions — sequenced step-by-step content tracks
 * for each AWS/GenAI certification target.
 *
 * Each step has a type (video | flashcard | quiz), a resourceId that
 * maps to PLAYLIST[id], flashcard category, or quiz id, and
 * estimated minutes to complete.
 */

export type StepType = 'video' | 'flashcard' | 'quiz';

export interface LearningStep {
  id: string;
  type: StepType;
  resourceId: string;   // video.id | flashcard category | quiz.id
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  icon: string;         // Feather icon name
  why: string;          // short explanation of why this step matters
}

export interface LearningPath {
  id: string;
  certCode: string;
  certName: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalHours: number;
  color: string;        // accent hex for this track
  steps: LearningStep[];
}

export const LEARNING_PATHS: LearningPath[] = [
  // ─────────────────────────────────────────────────────────────
  // AWS Cloud Practitioner — CLF-C02
  // ─────────────────────────────────────────────────────────────
  {
    id: 'clf-c02',
    certCode: 'CLF-C02',
    certName: 'AWS Cloud Practitioner',
    tagline: 'Exam-guide aligned across all 4 CLF-C02 domains — quiz-first, no distractions',
    difficulty: 'Beginner',
    totalHours: 14,
    color: '#FF9F43',
    steps: [
      {
        id: 'clf-flash1',
        type: 'flashcard',
        resourceId: 'aws-practitioner',
        title: 'AWS Practitioner Flashcards',
        subtitle: 'Key concepts, services, and definitions',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Memorise the most frequently tested AWS terms before tackling domain questions.',
      },
      {
        id: 'clf-q1',
        type: 'quiz',
        resourceId: 'clf-c02-cloud-concepts',
        title: 'Cloud Concepts',
        subtitle: '29 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'cloud',
        why: 'Domain 1 (Tasks 1.1–1.4) = 24% of the exam. Covers cloud value proposition, design principles, and migration benefits.',
      },
      {
        id: 'clf-q2a',
        type: 'quiz',
        resourceId: 'security-compliance',
        title: 'Security Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'shield',
        why: 'Domain 2 warm-up — builds shared responsibility and IAM intuition before the full 42-question set.',
      },
      {
        id: 'clf-q2',
        type: 'quiz',
        resourceId: 'clf-c02-security',
        title: 'Security & Compliance',
        subtitle: '42 questions · 35 min',
        estimatedMinutes: 35,
        icon: 'lock',
        why: 'Domain 2 (Tasks 2.1–2.4) = 30% of the exam. IAM, GuardDuty, Shield, KMS, and the Shared Responsibility Model.',
      },
      {
        id: 'clf-q3a',
        type: 'quiz',
        resourceId: 'serverless',
        title: 'Compute Warm-Up (Serverless)',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'zap',
        why: 'Domain 3 warm-up — Task 3.3 focus: Lambda, Fargate, and serverless compute patterns.',
      },
      {
        id: 'clf-q3b',
        type: 'quiz',
        resourceId: 'networking',
        title: 'Networking Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'globe',
        why: 'Domain 3 warm-up — Tasks 3.2 + 3.5 focus: VPC, Route 53, CloudFront, and AWS global infrastructure.',
      },
      {
        id: 'clf-q3c',
        type: 'quiz',
        resourceId: 'databases',
        title: 'Database Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'database',
        why: 'Domain 3 warm-up — Task 3.4 focus: RDS, DynamoDB, and choosing the right database service.',
      },
      {
        id: 'clf-q3',
        type: 'quiz',
        resourceId: 'clf-c02-technology',
        title: 'Technology & Services',
        subtitle: '90 questions · 60 min',
        estimatedMinutes: 60,
        icon: 'cpu',
        why: 'Domain 3 (Tasks 3.1–3.8) = 34% of the exam — the largest domain. Covers EC2, S3, Lambda, RDS, VPC, and global services.',
      },
      {
        id: 'clf-q4a',
        type: 'quiz',
        resourceId: 'cost-optimization',
        title: 'Billing Warm-Up',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'trending-down',
        why: 'Domain 4 warm-up — pricing models, Reserved vs Spot vs On-Demand, and cost optimisation strategies.',
      },
      {
        id: 'clf-q4',
        type: 'quiz',
        resourceId: 'clf-c02-billing',
        title: 'Billing & Pricing',
        subtitle: '34 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'dollar-sign',
        why: 'Domain 4 (Tasks 4.1–4.3) = 12% of the exam. Pricing models, Support plans, and the AWS Free Tier.',
      },
      {
        id: 'clf-q-final',
        type: 'quiz',
        resourceId: 'clf-c02-full-exam',
        title: 'Full Practice Exam',
        subtitle: '195 questions · 90 min',
        estimatedMinutes: 90,
        icon: 'award',
        why: 'Integration exam covering all 4 domains. Aim for ≥70% before booking the real CLF-C02.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // AWS AI Practitioner — AIP-C01
  // ─────────────────────────────────────────────────────────────
  {
    id: 'aip-c01',
    certCode: 'AIP-C01',
    certName: 'AWS AI Practitioner',
    tagline: 'Master generative AI on AWS and pass AIP-C01',
    difficulty: 'Intermediate',
    totalHours: 10,
    color: '#7367F0',
    steps: [
      {
        id: 'aip-v1',
        type: 'video',
        resourceId: 'bedrock-intro',
        title: 'Amazon Bedrock Introduction',
        subtitle: "A Beginner's Guide to Amazon Bedrock",
        estimatedMinutes: 22,
        icon: 'play-circle',
        why: 'Amazon Bedrock is the core service tested across all AIP-C01 domains.',
      },
      {
        id: 'aip-v2',
        type: 'video',
        resourceId: 'rag-bedrock',
        title: 'RAG with Amazon Bedrock',
        subtitle: 'Building RAG Applications with Amazon Bedrock',
        estimatedMinutes: 19,
        icon: 'play-circle',
        why: 'RAG is heavily tested — accounts for ~20% of AIP-C01 questions.',
      },
      {
        id: 'aip-flash1',
        type: 'flashcard',
        resourceId: 'aip-c01',
        title: 'AIP-C01 Flashcards',
        subtitle: '20 key concepts & definitions',
        estimatedMinutes: 20,
        icon: 'layers',
        why: 'Memorise RAG techniques, Bedrock APIs, and governance concepts.',
      },
      {
        id: 'aip-q1',
        type: 'quiz',
        resourceId: 'aip-c01-rag-foundations',
        title: 'RAG & Bedrock Foundations',
        subtitle: '30 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'database',
        why: 'Knowledge Bases, chunking strategies, and embedding models.',
      },
      {
        id: 'aip-v3',
        type: 'video',
        resourceId: 'bedrock-agents',
        title: 'Amazon Bedrock Agents',
        subtitle: 'Build AI Agents — 15 min',
        estimatedMinutes: 16,
        icon: 'play-circle',
        why: 'Agents & orchestration is a key AIP-C01 section. Watch before the next quiz.',
      },
      {
        id: 'aip-q2',
        type: 'quiz',
        resourceId: 'aip-c01-agents-ops',
        title: 'Agents, MLOps & Advanced Patterns',
        subtitle: '28 questions · 25 min',
        estimatedMinutes: 25,
        icon: 'zap',
        why: 'Multi-agent collaboration, AppConfig routing, SageMaker Neo.',
      },
      {
        id: 'aip-q3',
        type: 'quiz',
        resourceId: 'aip-c01-security-governance',
        title: 'Security & Governance',
        subtitle: '27 questions · 20 min',
        estimatedMinutes: 20,
        icon: 'shield',
        why: 'Guardrails, IAM, model invocation logging, and A2I review.',
      },
      {
        id: 'aip-q-final',
        type: 'quiz',
        resourceId: 'aip-c01-full-exam',
        title: 'Full Practice Exam',
        subtitle: '85 questions · 90 min',
        estimatedMinutes: 90,
        icon: 'award',
        why: 'Complete exam simulation — aim for ≥70% before booking.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // GenAI Foundations track (no cert, skill builder)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'genai-foundations',
    certCode: 'GenAI',
    certName: 'GenAI Foundations',
    tagline: 'Build practical generative AI skills on AWS',
    difficulty: 'Beginner',
    totalHours: 5,
    color: '#28C76F',
    steps: [
      {
        id: 'gf-v1',
        type: 'video',
        resourceId: 'bedrock-intro',
        title: 'Amazon Bedrock Introduction',
        subtitle: 'Foundation models, APIs, and use cases',
        estimatedMinutes: 22,
        icon: 'play-circle',
        why: 'Start with the platform that powers all AWS GenAI workloads.',
      },
      {
        id: 'gf-v2',
        type: 'video',
        resourceId: 'prompt-engineering',
        title: 'Prompt Engineering',
        subtitle: 'Prompt Engineering for AWS GenAI',
        estimatedMinutes: 28,
        icon: 'play-circle',
        why: 'Writing effective prompts is the single highest-leverage GenAI skill.',
      },
      {
        id: 'gf-q1',
        type: 'quiz',
        resourceId: 'bedrock-fundamentals',
        title: 'Bedrock Fundamentals Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Validate your Bedrock foundations before moving to advanced topics.',
      },
      {
        id: 'gf-flash1',
        type: 'flashcard',
        resourceId: 'genai-practitioner',
        title: 'GenAI Practitioner Flashcards',
        subtitle: 'Key GenAI terms and concepts',
        estimatedMinutes: 15,
        icon: 'layers',
        why: 'Reinforce terminology: embeddings, RAG, hallucination, grounding.',
      },
      {
        id: 'gf-v3',
        type: 'video',
        resourceId: 'rag-bedrock',
        title: 'RAG Applications on AWS',
        subtitle: 'Knowledge Bases + OpenSearch',
        estimatedMinutes: 19,
        icon: 'play-circle',
        why: 'RAG is the dominant pattern for enterprise GenAI — learn it hands-on.',
      },
      {
        id: 'gf-q2',
        type: 'quiz',
        resourceId: 'rag-knowledge-bases',
        title: 'RAG & Knowledge Bases Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Test your RAG fundamentals before the agents section.',
      },
      {
        id: 'gf-q3',
        type: 'quiz',
        resourceId: 'prompt-engineering',
        title: 'Prompt Engineering Quiz',
        subtitle: '10 questions · 15 min',
        estimatedMinutes: 15,
        icon: 'check-square',
        why: 'Confirm you can write optimised prompts across model families.',
      },
    ],
  },
];

export function getLearningPath(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}
