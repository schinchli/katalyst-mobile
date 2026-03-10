import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface QuestionViewProps {
  question: Question;
  selectedOptionId: string | undefined;
  onSelectOption: (optionId: string) => void;
  showResult?: boolean;
  hiddenOptionIds?: string[];
  onReport?: () => void;
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult = false,
  hiddenOptionIds = [],
  onReport,
}: QuestionViewProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.questionCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
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
                <Text style={[styles.optionLabel, { color: colors.textMuted }]}>{LETTERS[index] ?? option.id}</Text>
                <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
              </View>

              {showResult && isCorrect ? <Feather name="check" size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      {showResult && question.explanation ? (
        <View style={[styles.explanationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <View style={styles.explanationHeader}>
            <View style={[styles.explanationBadge, { backgroundColor: colors.primaryLight }]}>
              <Feather name="zap" size={12} color={colors.primary} />
            </View>
            <Text style={[styles.explanationTitle, { color: colors.primary }]}>Why this answer is right</Text>
          </View>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>{question.explanation}</Text>
        </View>
      ) : showResult ? (
        <View style={[styles.explanationCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>No explanation available.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  questionCard: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 12 },
  questionText: { fontFamily: F.bold, fontSize: 22, lineHeight: 34 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportText: { fontFamily: F.medium, fontSize: 12 },
  optionsList: { gap: 12 },
  optionCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  optionContent: { flex: 1, gap: 8 },
  optionLabel: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.8 },
  optionText: { fontFamily: F.semiBold, fontSize: 18, lineHeight: 30 },
  explanationCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  explanationTitle: { fontFamily: F.bold, fontSize: 13 },
  explanationText: { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
});
