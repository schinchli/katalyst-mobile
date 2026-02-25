import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgressStore } from '@/stores/progressStore';
import { quizzes } from '@/data/quizzes';
import { useWebLayout } from '@/hooks/useWebLayout';

type StatKey = 'completedQuizzes' | 'averageScore' | 'currentStreak' | 'badges';
interface StatCard { icon: string; iconColor: string; bgClass: string; key: StatKey; label: string; suffix?: string; isArray?: boolean; }

// Stat card config — icon colors use Vuexy status tokens
const STAT_CARDS: StatCard[] = [
  { icon: 'check-circle', iconColor: '#7367F0',  bgClass: 'bg-app-primary-faint dark:bg-app-primary-faint-dark', key: 'completedQuizzes', label: 'Quizzes Done' },
  { icon: 'award',        iconColor: '#FF9F43',  bgClass: 'bg-app-warning-tint',                                  key: 'averageScore',     label: 'Avg Score', suffix: '%' },
  { icon: 'zap',          iconColor: '#28C76F',  bgClass: 'bg-app-success-tint',                                  key: 'currentStreak',    label: 'Day Streak' },
  { icon: 'star',         iconColor: '#FF4C51',  bgClass: 'bg-app-error-tint',                                    key: 'badges',           label: 'Badges',    isArray: true },
];

const categoryIcons: Record<string, string> = {
  bedrock: 'cpu', rag: 'database', agents: 'users', guardrails: 'shield',
  'prompt-eng': 'edit-3', routing: 'shuffle', security: 'lock',
  monitoring: 'activity', orchestration: 'git-branch', evaluation: 'bar-chart', general: 'book',
};

export default function ProgressScreen() {
  const progress = useProgressStore((s) => s.progress);
  const { isDesktop, contentContainerWeb } = useWebLayout();

  const categoryProgress = quizzes.reduce(
    (acc, quiz) => {
      if (!acc[quiz.category]) acc[quiz.category] = { total: 0, completed: 0 };
      acc[quiz.category].total++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>,
  );

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark" edges={isDesktop ? [] : ['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, ...contentContainerWeb }}>

        <Text className="text-[26px] font-bold text-app-text dark:text-app-text-dark mb-5">
          Progress
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          {STAT_CARDS.map((cfg) => {
            const raw = progress[cfg.key as keyof typeof progress];
            const val = cfg.isArray ? (raw as unknown[]).length : (raw as number);
            return (
              <Card key={cfg.key} style={{ width: '48%' }}>
                <View className="flex-row items-center gap-2.5">
                  <View className={`w-10 h-10 rounded-[10px] items-center justify-center ${cfg.bgClass}`}>
                    <Feather name={cfg.icon as any} size={20} color={cfg.iconColor} />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-app-text dark:text-app-text-dark">
                      {val}{cfg.suffix ?? ''}
                    </Text>
                    <Text className="text-xs text-app-muted dark:text-app-muted-dark">{cfg.label}</Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Category Breakdown */}
        <Text className="text-lg font-bold text-app-text dark:text-app-text-dark mb-3.5">
          By Category
        </Text>
        {Object.entries(categoryProgress).map(([category, data]) => (
          <Card key={category} style={{ marginBottom: 10 }}>
            <View className="flex-row items-center gap-3 mb-2.5">
              <Feather name={(categoryIcons[category] ?? 'book') as any} size={18} color="#7367F0" />
              <Text className="flex-1 text-[15px] font-semibold text-app-text dark:text-app-text-dark">
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </Text>
              <Text className="text-[13px] text-app-muted dark:text-app-muted-dark">
                {data.completed}/{data.total}
              </Text>
            </View>
            <ProgressBar progress={data.total > 0 ? data.completed / data.total : 0} height={6} />
          </Card>
        ))}

        {/* Recent Results */}
        {progress.recentResults.length > 0 && (
          <>
            <Text className="text-lg font-bold text-app-text dark:text-app-text-dark mt-3.5 mb-3.5">
              Recent Results
            </Text>
            {progress.recentResults.slice(0, 5).map((result, idx) => {
              const quiz = quizzes.find((q) => q.id === result.quizId);
              const pct  = Math.round((result.score / result.totalQuestions) * 100);
              const passClass = pct >= 70 ? 'text-app-success' : 'text-app-error';
              return (
                <Card key={idx} style={{ marginBottom: 10 }}>
                  <View className="flex-row justify-between">
                    <Text className="text-[15px] font-semibold text-app-text dark:text-app-text-dark">
                      {quiz?.title ?? result.quizId}
                    </Text>
                    <Text className={`text-[15px] font-bold ${passClass}`}>{pct}%</Text>
                  </View>
                  <Text className="text-xs text-app-muted dark:text-app-muted-dark mt-1">
                    {result.score}/{result.totalQuestions} correct
                  </Text>
                </Card>
              );
            })}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
