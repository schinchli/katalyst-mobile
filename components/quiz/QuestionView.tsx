import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

interface QuestionViewProps {
  question: Question;
  selectedOptionId: string | undefined;
  onSelectOption: (optionId: string) => void;
  showResult?: boolean;
  resultTone?: 'correct' | 'incorrect';
  hiddenOptionIds?: string[];
  onReport?: () => void;
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult = false,
  resultTone = 'correct',
  hiddenOptionIds = [],
  onReport,
}: QuestionViewProps) {
  const colors = useThemeColors();
  const explanationAccent = resultTone === 'correct' ? colors.primary : colors.error;
  const explanationTitle = resultTone === 'correct' ? 'Why this answer is right' : 'Why this answer was not right';

  return (
    <View style={styles.container}>
      <View style={styles.questionBlock}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>
        {onReport ? (
          <Pressable onPress={onReport} style={styles.reportRow}>
            <Feather name="alert-triangle" size={13} color={colors.textSecondary} />
            <Text style={[styles.reportText, { color: colors.textSecondary }]}>Report question</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.optionsList}>
        {question.options.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctOptionId;
          const isHidden = hiddenOptionIds.includes(option.id);

          const stateColors = (() => {
            if (!showResult) {
              return isSelected
                ? { background: colors.surfaceElevated, border: colors.primary, icon: colors.primary }
                : { background: colors.surface, border: colors.surfaceBorder, icon: colors.background };
            }

            if (isCorrect) {
              return { background: colors.surfaceElevated, border: colors.success, icon: colors.primary };
            }

            if (isSelected) {
              return { background: '#221841', border: colors.error, icon: colors.error };
            }

            return { background: colors.surface, border: colors.surfaceBorder, icon: colors.background };
          })();

          return (
            <Pressable
              key={option.id}
              onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
              disabled={showResult || isHidden}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: stateColors.background,
                  borderColor: stateColors.border,
                  opacity: isHidden ? 0.2 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={[styles.radioOuter, { borderColor: showResult && isCorrect ? colors.primary : isSelected ? colors.gradientAccent : colors.surfaceBorder }]}>
                {(isSelected || (showResult && isCorrect)) && (
                  <View style={[styles.radioInner, { backgroundColor: showResult && isCorrect ? colors.primary : colors.gradientAccent }]} />
                )}
              </View>

              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
              </View>

              {showResult && isCorrect ? <Feather name="check" size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      {showResult && question.explanation ? (
        <View style={[styles.explanationCard, { backgroundColor: colors.backgroundAlt, borderColor: explanationAccent + '55' }]}>
          <View style={styles.explanationHeader}>
            <View style={[styles.explanationBadge, { backgroundColor: explanationAccent + '22' }]}>
              <Feather name={resultTone === 'correct' ? 'check' : 'x'} size={12} color={explanationAccent} />
            </View>
            <Text style={[styles.explanationTitle, { color: explanationAccent }]}>{explanationTitle}</Text>
          </View>
          <Text style={[styles.explanationText, { color: colors.text }]}>{question.explanation}</Text>
        </View>
      ) : showResult ? (
        <View style={[styles.explanationCard, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>No explanation available.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  questionBlock: { paddingTop: 8, gap: 14 },
  questionText: { fontFamily: F.bold, fontSize: 24, lineHeight: 42 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportText: { fontFamily: F.medium, fontSize: 12 },
  optionsList: { gap: 12 },
  optionCard: { width: '100%', borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  optionContent: { flex: 1 },
  optionText: { fontFamily: F.semiBold, fontSize: 20, lineHeight: 38 },
  explanationCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  explanationTitle: { fontFamily: F.bold, fontSize: 13 },
  explanationText: { fontFamily: F.medium, fontSize: 15, lineHeight: 25 },
});
