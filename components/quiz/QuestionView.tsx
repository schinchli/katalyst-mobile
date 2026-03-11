/**
 * QuestionView — clean, no-bullet layout:
 *  - Large question text, full-width
 *  - Report link below question
 *  - "Select the correct answer" label in primary color
 *  - Options: plain text only, selected = primary color bold, no circles/bullets
 *  - Answered state: correct = success color, wrong = error color, explanation card below
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useFontScale } from '@/hooks/useFontScale';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

interface QuestionViewProps {
  question:         Question;
  selectedOptionId: string | undefined;
  onSelectOption:   (optionId: string) => void;
  showResult?:      boolean;
  resultTone?:      'correct' | 'incorrect';
  hiddenOptionIds?: string[];
  onReport?:        () => void;
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult      = false,
  resultTone      = 'correct',
  hiddenOptionIds = [],
  onReport,
}: QuestionViewProps) {
  const colors        = useThemeColors();
  const scale         = useFontScale();
  const isCorrectTone = resultTone === 'correct';
  const resultAccent  = isCorrectTone ? colors.success : colors.error;

  return (
    <View style={s.root}>

      {/* ── Question ── */}
      <Text style={[s.questionText, { color: colors.text, fontSize: Math.round(28 * scale), lineHeight: Math.round(40 * scale) }]}>{question.text}</Text>

      {/* ── Report link ── */}
      {onReport && (
        <Pressable onPress={onReport} style={s.reportBtn} hitSlop={12}>
          <Feather name="flag" size={13} color={colors.textMuted} />
          <Text style={[s.reportText, { color: colors.textMuted }]}>Report</Text>
        </Pressable>
      )}

      {/* ── "Select the correct answer" label ── */}
      {!showResult && (
        <Text style={[s.selectLabel, { color: colors.primary, fontSize: Math.round(15 * scale) }]}>
          Select the correct answer
        </Text>
      )}

      {/* ── Options — card background, no circles ── */}
      <View style={s.optionsList}>
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect  = option.id === question.correctOptionId;
          const isHidden   = hiddenOptionIds.includes(option.id);

          // Card background + border
          const cardBg = (() => {
            if (!showResult) return isSelected ? colors.primaryLight : colors.surface;
            if (isCorrect)   return colors.success + '18';
            if (isSelected)  return colors.error   + '18';
            return colors.surface;
          })();
          const cardBorder = (() => {
            if (!showResult) return isSelected ? colors.primary : colors.surfaceBorder;
            if (isCorrect)   return colors.success + '66';
            if (isSelected)  return colors.error   + '66';
            return colors.surfaceBorder;
          })();

          // Text color
          const textColor = (() => {
            if (!showResult) return isSelected ? colors.primary : colors.text;
            if (isCorrect)   return colors.success;
            if (isSelected)  return colors.error;
            return colors.textMuted;
          })();

          const isBold = isSelected || (showResult && isCorrect);

          return (
            <Pressable
              key={option.id}
              onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
              disabled={showResult || isHidden}
              style={[s.option, {
                opacity:         isHidden ? 0.15 : 1,
                backgroundColor: cardBg,
                borderColor:     cardBorder,
              }]}
            >
              <Text style={[s.optionText, { color: textColor, fontFamily: isBold ? F.bold : F.semiBold, fontSize: Math.round(18 * scale), lineHeight: Math.round(28 * scale) }]}>
                {option.text}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Explanation (shown after answering) ── */}
      {showResult && (
        <View style={[s.explanation, {
          backgroundColor: resultAccent + '1A',
          borderColor:     resultAccent + '44',
        }]}>
          <View style={s.explanationHeader}>
            <View style={[s.explanationBadge, { backgroundColor: resultAccent + '22' }]}>
              <Feather name={isCorrectTone ? 'check' : 'x'} size={12} color={resultAccent} />
            </View>
            <Text style={[s.explanationTitle, { color: resultAccent, fontSize: Math.round(14 * scale) }]}>
              {isCorrectTone ? 'Correct!' : 'Incorrect'}
            </Text>
          </View>
          <Text style={[s.explanationBody, { color: colors.text, fontSize: Math.round(14 * scale), lineHeight: Math.round(22 * scale) }]}>
            {question.explanation ?? 'No explanation available.'}
          </Text>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 22 },

  // Question
  questionText: { fontFamily: F.bold, fontSize: 28, lineHeight: 40, letterSpacing: -0.4 },

  // Report
  reportBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: -8 },
  reportText: { fontFamily: F.medium, fontSize: 13 },

  // "Select the correct answer"
  selectLabel: { fontFamily: F.semiBold, fontSize: 15, marginTop: -4 },

  // Options list
  optionsList: { gap: 10 },

  // Single option — card style, no circles
  option: {
    paddingVertical:   16,
    paddingHorizontal: 18,
    borderRadius:      14,
    borderWidth:       1,
  },

  // Option label
  optionText: { fontSize: 18, lineHeight: 28 },

  // Explanation card
  explanation: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  explanationBadge:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  explanationTitle:  { fontFamily: F.bold, fontSize: 14 },
  explanationBody:   { fontFamily: F.medium, fontSize: 14, lineHeight: 22 },
});
