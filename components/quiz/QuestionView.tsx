/**
 * QuestionView — fully theme-aware, zero hardcoded hex.
 * Layout: question at top, options flow naturally below — compact, top-aligned.
 */
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
  const isCorrectTone  = resultTone === 'correct';
  const resultAccent   = isCorrectTone ? colors.success : colors.error;

  return (
    <View style={s.root}>

      {/* ── Question — anchored top ── */}
      <View style={s.questionBlock}>
        <Text style={[s.questionText, { color: colors.text }]}>{question.text}</Text>
        {onReport && (
          <Pressable onPress={onReport} style={s.reportBtn} hitSlop={10}>
            <Feather name="flag" size={12} color={colors.textMuted} />
            <Text style={[s.reportText, { color: colors.textMuted }]}>Report</Text>
          </Pressable>
        )}
      </View>

      {/* ── Options — anchored bottom ── */}
      <View style={s.optionsBlock}>
        {!showResult && (
          <Text style={[s.selectLabel, { color: colors.gradientAccent }]}>
            Select the correct answer
          </Text>
        )}

        <View style={s.optionsList}>
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect  = option.id === question.correctOptionId;
            const isHidden   = hiddenOptionIds.includes(option.id);

            // Card state colors — all from theme
            const card = (() => {
              if (!showResult) {
                return isSelected
                  ? { bg: colors.primaryLight, border: colors.primary,      radio: colors.primary }
                  : { bg: colors.surface,      border: colors.surfaceBorder, radio: 'transparent' };
              }
              if (isCorrect) return {
                bg:    colors.success + '18',
                border: colors.success,
                radio:  colors.success,
              };
              if (isSelected) return {
                bg:    colors.error + '18',
                border: colors.error,
                radio:  colors.error,
              };
              return { bg: colors.surface, border: colors.surfaceBorder, radio: 'transparent' };
            })();

            const radioFilled = isSelected || (showResult && (isCorrect || isSelected));

            return (
              <Pressable
                key={option.id}
                onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
                disabled={showResult || isHidden}
                style={({ pressed }) => [
                  s.optionCard,
                  {
                    backgroundColor: card.bg,
                    borderColor:     card.border,
                    opacity: isHidden ? 0.15 : pressed ? 0.82 : 1,
                  },
                ]}
              >
                <View style={[s.radio, { borderColor: card.border, backgroundColor: radioFilled ? card.radio : 'transparent' }]}>
                  {radioFilled && <View style={[s.radioDot, { backgroundColor: colors.background }]} />}
                </View>
                <Text style={[s.optionText, { color: colors.text }]}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {showResult && (
          <View style={[s.explanation, {
            backgroundColor: resultAccent + '1A',
            borderColor:     resultAccent + '55',
          }]}>
            <View style={s.explanationHeader}>
              <View style={[s.explanationBadge, { backgroundColor: resultAccent + '22' }]}>
                <Feather name={isCorrectTone ? 'check' : 'x'} size={12} color={resultAccent} />
              </View>
              <Text style={[s.explanationTitle, { color: resultAccent }]}>
                {isCorrectTone ? 'Correct answer' : 'Incorrect'}
              </Text>
            </View>
            <Text style={[s.explanationBody, { color: colors.text }]}>
              {question.explanation ?? 'No explanation available.'}
            </Text>
          </View>
        )}
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 24 },

  // Question
  questionBlock: { gap: 10 },
  questionText:  { fontFamily: F.bold, fontSize: 25, lineHeight: 36, letterSpacing: -0.3 },
  reportBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  reportText:    { fontFamily: F.medium, fontSize: 11 },

  // Options
  optionsBlock: { gap: 10 },
  selectLabel:  { fontFamily: F.semiBold, fontSize: 13, marginBottom: 2 },
  optionsList:  { gap: 9 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  optionText: { fontFamily: F.semiBold, fontSize: 15, lineHeight: 22, flex: 1 },

  // Explanation
  explanation: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8, marginTop: 4 },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationBadge:  { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  explanationTitle:  { fontFamily: F.bold, fontSize: 13 },
  explanationBody:   { fontFamily: F.medium, fontSize: 14, lineHeight: 22 },
});
