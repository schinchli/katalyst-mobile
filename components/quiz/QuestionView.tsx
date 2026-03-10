import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

const SUCCESS_BG     = '#D1F7E2';
const ERROR_BG       = '#FFE5E6';
const SUCCESS_BORDER = '#28C76F';
const ERROR_BORDER   = '#EA5455';
const LETTERS        = ['A', 'B', 'C', 'D', 'E'];
// Selected-but-unconfirmed option colours (used before result is shown)
const SELECTED_BG     = '#EBE9FD';
const SELECTED_BORDER = '#7367F0';

interface QuestionViewProps {
  question:         Question;
  selectedOptionId: string | undefined;
  onSelectOption:   (optionId: string) => void;
  showResult?:      boolean;
  hiddenOptionIds?: string[];
  onReport?:        () => void;
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult      = false,
  hiddenOptionIds = [],
  onReport,
}: QuestionViewProps) {
  const colors   = useThemeColors();
  const darkMode = useThemeStore((s) => s.darkMode);
  // Explanation box bg: use surface in dark mode (readable), primaryLight tint in light mode
  const explanationBg = darkMode ? colors.surface : colors.primaryLight;

  return (
    <View style={s.container}>

      {/* ── Question card ────────────────────────────────────── */}
      <View style={[s.questionCard, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder,
        borderLeftColor: colors.primary,
      }]}>
        <Text style={[s.questionText, { color: colors.text }]}>{question.text}</Text>
        {onReport && (
          <Pressable onPress={onReport} hitSlop={10} style={s.reportBtn}>
            <Feather name="flag" size={13} color={colors.textSecondary} />
            <Text style={[s.reportText, { color: colors.textSecondary }]}>Report</Text>
          </Pressable>
        )}
      </View>

      {/* ── Options ──────────────────────────────────────────── */}
      <View style={s.optionsList}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect  = option.id === question.correctOptionId;
          const isHidden   = hiddenOptionIds.includes(option.id);

          let optBg: string     = colors.surface;
          let optBorder: string = colors.surfaceBorder;
          if (showResult) {
            if (isCorrect)       { optBg = SUCCESS_BG; optBorder = SUCCESS_BORDER; }
            else if (isSelected) { optBg = ERROR_BG;   optBorder = ERROR_BORDER; }
          } else if (isSelected) {
            optBg = SELECTED_BG; optBorder = SELECTED_BORDER;
          }

          const letter = LETTERS[idx] ?? option.id.toUpperCase();
          let labelColor = showResult
            ? isCorrect ? SUCCESS_BORDER
            : isSelected ? ERROR_BORDER
            : colors.textSecondary
            : isSelected ? colors.primary
            : colors.textSecondary;

          return (
            <Pressable
              key={option.id}
              onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
              disabled={showResult || isHidden}
              style={({ pressed }) => [
                s.option,
                { backgroundColor: optBg, borderColor: optBorder, opacity: isHidden ? 0.25 : pressed ? 0.9 : 1 },
              ]}
              accessibilityRole="button"
            >
              <View style={[s.optionLabelPill, { backgroundColor: isSelected ? colors.primaryLight : colors.background }]}>
                <Text style={[s.optionLabel, { color: labelColor }]}>{letter}</Text>
              </View>
              <Text style={[s.optionText, { color: colors.text }]}>{option.text}</Text>

              <View style={s.optionStatusSlot}>
                {showResult && isCorrect && (
                  <Feather name="check-circle" size={18} color={SUCCESS_BORDER} />
                )}
                {showResult && isSelected && !isCorrect && (
                  <Feather name="x-circle" size={18} color={ERROR_BORDER} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ── Explanation ───────────────────────────────────────── */}
      {showResult && question.explanation ? (
        <View style={[s.explanationBox, { borderLeftColor: colors.primary, backgroundColor: explanationBg }]}>
          <View style={s.explanationHeader}>
            <View style={[s.explanationIconWrap, { backgroundColor: colors.primary }]}>
              <Feather name="zap" size={11} color="#fff" />
            </View>
            <Text style={[s.explanationLabel, { color: colors.primary }]}>Explanation</Text>
          </View>
          <Text style={[s.explanationText, { color: colors.text }]}>{question.explanation}</Text>
        </View>
      ) : showResult ? (
        <View style={[s.explanationBox, { borderLeftColor: colors.surfaceBorder, backgroundColor: colors.surface }]}>
          <Text style={[s.explanationText, { color: colors.textSecondary }]}>No explanation available.</Text>
        </View>
      ) : null}

    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 12 },

  questionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    shadowColor: '#4B465C',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionText: {
    fontFamily: F.semiBold,
    fontSize: 17,
    lineHeight: 28,
  },

  optionsList: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#4B465C',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  optionLabelPill: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLabel: { fontFamily: F.bold, fontSize: 14 },
  optionText:  { fontFamily: F.medium, fontSize: 15, lineHeight: 22, flex: 1, flexShrink: 1 },
  optionStatusSlot: {
    width: 20,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  explanationBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    marginTop: 4,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  explanationIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationLabel: { fontFamily: F.bold,    fontSize: 13, letterSpacing: 0.3 },
  explanationText:  { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },

  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  reportText: { fontFamily: F.regular, fontSize: 12 },
});
