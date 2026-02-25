import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/hooks/useThemeColor';
import type { Quiz } from '@/types';

interface QuizCardProps {
  quiz: Quiz;
  onPress: () => void;
}

// Difficulty colors — Vuexy status tokens
const difficultyColor: Record<string, string> = {
  beginner:     '#28C76F',  // app-success
  intermediate: '#FF9F43',  // app-warning
  advanced:     '#FF4C51',  // app-error
};

export function QuizCard({ quiz, onPress }: QuizCardProps) {
  const colors = useThemeColors(); // kept for Feather icon colors (not NativeWind)

  return (
    <Card onPress={onPress} style={{ marginBottom: 12 }}>
      <View className="flex-row items-center gap-3.5">
        {/* Icon container */}
        <View className="w-12 h-12 rounded-xl bg-app-primary-faint dark:bg-app-primary-faint-dark items-center justify-center">
          <Feather name={quiz.icon as any} size={22} color={colors.primary} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-base font-semibold text-app-text dark:text-app-text-dark flex-1"
              numberOfLines={1}
            >
              {quiz.title}
            </Text>
            {quiz.isPremium && <Badge label="PRO" color={colors.aws} size="sm" />}
          </View>

          <Text
            className="text-[13px] text-app-muted dark:text-app-muted-dark mt-0.5"
            numberOfLines={1}
          >
            {quiz.description}
          </Text>

          <View className="flex-row items-center gap-3 mt-2">
            <Badge label={quiz.difficulty} color={difficultyColor[quiz.difficulty]} size="sm" />

            <View className="flex-row items-center gap-1">
              <Feather name="help-circle" size={13} color={colors.textSecondary} />
              <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                {quiz.questionCount} questions
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Feather name="clock" size={13} color={colors.textSecondary} />
              <Text className="text-xs text-app-muted dark:text-app-muted-dark">
                {quiz.duration} min
              </Text>
            </View>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </Card>
  );
}
