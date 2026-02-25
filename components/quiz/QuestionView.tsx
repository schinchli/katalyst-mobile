import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import type { Question } from '@/types';

interface QuestionViewProps {
  question: Question;
  selectedOptionId: string | undefined;
  onSelectOption: (optionId: string) => void;
  showResult?: boolean;
  hiddenOptionIds?: string[];
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult = false,
  hiddenOptionIds = [],
}: QuestionViewProps) {
  const colors = useThemeColors(); // kept for Feather icon colors

  /** Returns Tailwind classes for the option row based on answer state */
  const getOptionClass = (optionId: string): string => {
    const isSelected = selectedOptionId === optionId;
    const isCorrect  = optionId === question.correctOptionId;

    if (showResult) {
      if (isCorrect)                  return 'border-app-success bg-app-success-tint';
      if (isSelected && !isCorrect)   return 'border-app-error bg-app-error-tint';
    }
    if (isSelected) {
      return 'border-app-primary bg-app-primary-faint dark:bg-app-primary-faint-dark';
    }
    return 'border-app-border dark:border-app-border-dark bg-app-surface dark:bg-app-surface-dark';
  };

  /** Returns Tailwind classes for the letter bubble inside the option */
  const getBubbleClass = (optionId: string): string => {
    const isSelected = selectedOptionId === optionId;
    const isCorrect  = optionId === question.correctOptionId;

    if (showResult && isCorrect)           return 'bg-app-success border-app-success';
    if (showResult && isSelected)          return 'bg-app-error border-app-error';
    if (isSelected)                        return 'bg-app-primary border-app-primary';
    return 'bg-transparent border-app-border dark:border-app-border-dark';
  };

  const getBubbleTextClass = (optionId: string): string => {
    const isSelected = selectedOptionId === optionId;
    const isCorrect  = optionId === question.correctOptionId;
    if ((showResult && isCorrect) || (showResult && isSelected) || isSelected) return 'text-white';
    return 'text-app-muted dark:text-app-muted-dark';
  };

  const getResultIcon = (optionId: string): React.ReactNode => {
    if (!showResult) return null;
    if (optionId === question.correctOptionId)
      return <Feather name="check-circle" size={20} color={colors.success} />;
    if (selectedOptionId === optionId)
      return <Feather name="x-circle" size={20} color={colors.error} />;
    return null;
  };

  return (
    <View className="gap-4">
      {/* Question text */}
      <Text className="text-lg font-semibold text-app-text dark:text-app-text-dark leading-[26px]">
        {question.text}
      </Text>

      {/* Options */}
      <View className="gap-2.5">
        {question.options.map((option) => {
          const isHidden = hiddenOptionIds.includes(option.id);
          return (
          <Pressable
            key={option.id}
            onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
            disabled={showResult || isHidden}
            style={{ opacity: isHidden ? 0.3 : 1 }}
            className={`flex-row items-center p-4 rounded-xl border-[1.5px] gap-3 ${getOptionClass(option.id)}`}
          >
            {/* Letter bubble */}
            <View className={`w-7 h-7 rounded-full border-[1.5px] items-center justify-center ${getBubbleClass(option.id)}`}>
              <Text className={`text-[13px] font-semibold ${getBubbleTextClass(option.id)}`}>
                {option.id.toUpperCase()}
              </Text>
            </View>

            <Text className="flex-1 text-[15px] text-app-text dark:text-app-text-dark leading-[22px]">
              {option.text}
            </Text>

            {getResultIcon(option.id)}
          </Pressable>
          );
        })}
      </View>

      {/* Explanation box */}
      {showResult && (
        <View className="bg-app-primary-faint dark:bg-app-primary-faint-dark p-3.5 rounded-xl border-l-[3px] border-l-app-primary">
          <Text className="text-[13px] font-semibold text-app-primary mb-1">Explanation</Text>
          <Text className="text-sm text-app-text dark:text-app-text-dark leading-5">
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}
