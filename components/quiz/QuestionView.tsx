import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

// DataCamp dark theme
const DC_SURFACE = '#111D35';
const DC_BORDER  = '#1E3055';
const DC_TEAL    = '#3DD6C0';

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

  return (
    // flex:1 + space-between → question floats top, options anchor bottom
    // (works because parent ScrollView has flexGrow:1)
    <View style={s.root}>

      {/* ── Question block — top ── */}
      <View style={s.questionBlock}>
        <Text style={s.questionText}>{question.text}</Text>
        {onReport ? (
          <Pressable onPress={onReport} style={s.reportRow} hitSlop={8}>
            <Feather name="alert-triangle" size={12} color="rgba(255,255,255,0.3)" />
            <Text style={s.reportText}>Report question</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ── Options block — bottom ── */}
      <View style={s.optionsBlock}>
        {!showResult && (
          <Text style={s.selectLabel}>Select the correct answer</Text>
        )}

        <View style={s.optionsList}>
          {question.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect  = option.id === question.correctOptionId;
            const isHidden   = hiddenOptionIds.includes(option.id);

            const card = (() => {
              if (!showResult) {
                return isSelected
                  ? { bg: '#162648', border: '#3DD6C0', radio: '#3DD6C0' }
                  : { bg: DC_SURFACE,  border: DC_BORDER,  radio: 'transparent' };
              }
              if (isCorrect) return { bg: '#0D2B1E', border: '#28C76F', radio: '#28C76F' };
              if (isSelected) return { bg: '#2A0F12', border: '#EF4444', radio: '#EF4444' };
              return { bg: DC_SURFACE, border: DC_BORDER, radio: 'transparent' };
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
                <View
                  style={[
                    s.radioCircle,
                    { borderColor: card.border, backgroundColor: radioFilled ? card.radio : 'transparent' },
                  ]}
                >
                  {radioFilled && <View style={s.radioDot} />}
                </View>
                <Text style={s.optionText}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Explanation — inline after options */}
        {showResult && question.explanation ? (
          <View style={[s.explanationCard, { borderColor: explanationAccent + '50' }]}>
            <View style={s.explanationHeader}>
              <View style={[s.explanationBadge, { backgroundColor: explanationAccent + '22' }]}>
                <Feather name={resultTone === 'correct' ? 'check' : 'x'} size={12} color={explanationAccent} />
              </View>
              <Text style={[s.explanationTitle, { color: explanationAccent }]}>
                {resultTone === 'correct' ? 'Correct answer' : 'Incorrect'}
              </Text>
            </View>
            <Text style={s.explanationText}>{question.explanation}</Text>
          </View>
        ) : showResult ? (
          <View style={[s.explanationCard, { borderColor: DC_BORDER }]}>
            <Text style={[s.explanationText, { color: 'rgba(255,255,255,0.4)' }]}>No explanation available.</Text>
          </View>
        ) : null}
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  // Outer container: question top, options bottom
  root: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 32,
  },

  // ── Question ──
  questionBlock: { gap: 12 },
  questionText: {
    fontFamily: F.bold,
    fontSize: 26,
    lineHeight: 38,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reportText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Options ──
  optionsBlock: { gap: 12 },
  selectLabel: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: DC_TEAL,
    marginBottom: 4,
  },
  optionsList: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#050B18',
  },
  optionText: {
    fontFamily: F.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    flex: 1,
  },

  // ── Explanation ──
  explanationCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explanationBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationTitle: {
    fontFamily: F.bold,
    fontSize: 13,
  },
  explanationText: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.75)',
  },
});
