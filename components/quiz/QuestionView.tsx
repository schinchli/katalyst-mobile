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
  const explanationAccent = resultTone === 'correct' ? colors.success : colors.error;
  const explanationTitle = resultTone === 'correct' ? 'Correct answer' : 'Incorrect';

  return (
    <View style={styles.container}>
      {/* Question */}
      <View style={styles.questionBlock}>
        <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>
        {onReport ? (
          <Pressable onPress={onReport} style={styles.reportRow}>
            <Feather name="alert-triangle" size={13} color={colors.textSecondary} />
            <Text style={[styles.reportText, { color: colors.textSecondary }]}>Report question</Text>
          </Pressable>
        ) : null}
      </View>

      {/* "Select the correct answer" label — teal, only before result */}
      {!showResult && (
        <Text style={[styles.selectLabel, { color: colors.gradientAccent }]}>Select the correct answer</Text>
      )}

      {/* Options */}
      <View style={styles.optionsList}>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctOptionId;
          const isHidden = hiddenOptionIds.includes(option.id);

          const cardBase = colors.surface; // dark #101C36 — close to DataCamp card bg
          const stateColors = (() => {
            if (!showResult) {
              return isSelected
                ? { background: cardBase, border: colors.primary, radioBg: colors.primary }
                : { background: cardBase, border: colors.surfaceBorder, radioBg: 'transparent' };
            }
            if (isCorrect) return { background: colors.success + '18', border: colors.success, radioBg: colors.success };
            if (isSelected) return { background: colors.error + '12', border: colors.error, radioBg: colors.error };
            return { background: cardBase, border: colors.surfaceBorder, radioBg: 'transparent' };
          })();

          const radioFilled = isSelected || (showResult && (isCorrect || isSelected));

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
                  opacity: isHidden ? 0.2 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioCircle,
                  { borderColor: stateColors.border, backgroundColor: radioFilled ? stateColors.radioBg : 'transparent' },
                ]}>
                  {radioFilled && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, { color: colors.text }]}>{option.text}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Explanation inline */}
      {showResult && question.explanation ? (
        <View style={[styles.explanationCard, { backgroundColor: colors.surfaceElevated, borderColor: explanationAccent + '50' }]}>
          <View style={styles.explanationHeader}>
            <View style={[styles.explanationBadge, { backgroundColor: explanationAccent + '22' }]}>
              <Feather name={resultTone === 'correct' ? 'check' : 'x'} size={12} color={explanationAccent} />
            </View>
            <Text style={[styles.explanationTitle, { color: explanationAccent }]}>{explanationTitle}</Text>
          </View>
          <Text style={[styles.explanationText, { color: colors.text }]}>{question.explanation}</Text>
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
  container:       { gap: 16 },
  questionBlock:   { paddingTop: 4, gap: 14 },
  questionText:    { fontFamily: F.bold, fontSize: 28, lineHeight: 40 },
  reportRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportText:      { fontFamily: F.medium, fontSize: 12 },
  selectLabel:     { fontFamily: F.semiBold, fontSize: 14, marginBottom: 2 },
  optionsList:     { gap: 12 },
  optionCard:      { width: '100%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 18 },
  optionContent:   { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16 },
  radioCircle:     { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#04111F' },
  optionText:      { fontFamily: F.bold, fontSize: 17, lineHeight: 26, flex: 1 },
  explanationCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationBadge:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  explanationTitle:  { fontFamily: F.bold, fontSize: 13 },
  explanationText:   { fontFamily: F.medium, fontSize: 15, lineHeight: 25 },
});
