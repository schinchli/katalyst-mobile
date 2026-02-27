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
  explanation?: string;
  correctOptionId: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  quizId?: string;
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
  lastPlayedDate: string | null;
  badges: Badge[];
  recentResults: QuizResult[];
  // Coin economy + level system (Elite Quiz parity)
  coins: number;
  totalCoinsEarned: number;
  xp: number;
  level: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarInitial: string;
  score: number;       // total score points
  coins: number;
  streak: number;
  quizzesCompleted: number;
  isCurrentUser?: boolean;
}

export type ContestStatus = 'live' | 'upcoming' | 'past';

export interface Contest {
  id: string;
  title: string;
  description: string;
  status: ContestStatus;
  quizId: string;
  quizTitle: string;
  category: string;
  icon: string;
  entryFee: number;    // coins
  prizeCoins: number;
  startTime: string;   // ISO
  endTime: string;     // ISO
  participants: number;
  maxParticipants: number;
  topScore?: number;
  winner?: string;
}

export type BadgeId =
  | 'first-quiz'
  | 'perfect-score'
  | 'seven-day-streak'
  | 'speed-demon'
  | 'category-master'
  | 'half-way'
  | 'quiz-marathon';

export interface Badge {
  id: BadgeId;
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
  | 'cost'
  | 'general';
