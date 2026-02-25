export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'premium';
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: QuizCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  duration: number; // minutes
  isPremium: boolean;
  icon: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  explanation: string;
  correctOptionId: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number; // seconds
  answers: Record<string, string>; // questionId -> selectedOptionId
  completedAt: string;
}

export interface Progress {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  recentResults: QuizResult[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export type QuizCategory =
  | 'bedrock'
  | 'rag'
  | 'agents'
  | 'guardrails'
  | 'prompt-eng'
  | 'routing'
  | 'security'
  | 'monitoring'
  | 'orchestration'
  | 'mlops'
  | 'evaluation'
  | 'general';
