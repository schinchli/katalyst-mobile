import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

// Fixed tint backgrounds (light mode locked)
const SUCCESS_BG = '#D1F7E2';
const ERROR_BG   = '#FFE5E6';
const PRIMARY_BG = '#EBE9FD';
const LETTERS    = ['A', 'B', 'C', 'D', 'E'];

interface QuestionViewProps {
  question:         Question;
  selectedOptionId: string | undefined;
  onSelectOption:   (optionId: string) => void;
  showResult?:      boolean;
  hiddenOptionIds?: string[];
}

export function QuestionView({
  question,
  selectedOptionId,
  onSelectOption,
  showResult      = false,
  hiddenOptionIds = [],
}: QuestionViewProps) {
  const colors = useThemeColors();

  return (
    <View style={s.container}>

      {/* ── Question card ─────────────────────────────────────────── */}
      <View style={[s.questionCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderLeftColor: colors.primary }]}>
        <Text style={[s.questionText, { color: colors.text }]}>{question.text}</Text>
      </View>

      {/* ── Options ───────────────────────────────────────────────── */}
      <View style={s.optionsList}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect  = option.id === question.correctOptionId;
          const isHidden   = hiddenOptionIds.includes(option.id);

          // Option container style
          let optBg     = colors.surface;
          let optBorder = colors.surfaceBorder;
          if (showResult) {
            if (isCorrect)              { optBg = SUCCESS_BG; optBorder = colors.success; }
            else if (isSelected)        { optBg = ERROR_BG;   optBorder = colors.error; }
          } else if (isSelected) {
            optBg = PRIMARY_BG; optBorder = colors.primary;
          }

          // Bubble style
          let bubBg      = 'transparent';
          let bubBorder  = colors.surfaceBorder;
          let bubText    = colors.textSecondary;
          if (showResult && isCorrect)               { bubBg = colors.success; bubBorder = colors.success; bubText = '#fff'; }
          else if (showResult && isSelected)         { bubBg = colors.error;   bubBorder = colors.error;   bubText = '#fff'; }
          else if (!showResult && isSelected)        { bubBg = colors.primary; bubBorder = colors.primary; bubText = '#fff'; }

          return (
            <Pressable
              key={option.id}
              onPress={() => !showResult && !isHidden && onSelectOption(option.id)}
              disabled={showResult || isHidden}
              style={[
                s.option,
                { backgroundColor: optBg, borderColor: optBorder, opacity: isHidden ? 0.28 : 1 },
              ]}
              accessibilityRole="button"
            >
              {/* Letter bubble */}
              <View style={[s.bubble, { backgroundColor: bubBg, borderColor: bubBorder }]}>
                <Text style={[s.bubbleLetter, { color: bubText }]}>
                  {LETTERS[idx] ?? option.id.toUpperCase()}
                </Text>
              </View>

              {/* Option text */}
              <Text style={[s.optionText, { color: colors.text }]}>{option.text}</Text>

              {/* Result icon */}
              {showResult && isCorrect && (
                <Feather name="check-circle" size={20} color={colors.success} />
              )}
              {showResult && isSelected && !isCorrect && (
                <Feather name="x-circle" size={20} color={colors.error} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Explanation ───────────────────────────────────────────── */}
      {showResult && question.explanation ? (
        <View style={[s.explanationBox, { backgroundColor: PRIMARY_BG, borderLeftColor: colors.primary }]}>
          <View style={s.explanationHeader}>
            <View style={[s.explanationIconWrap, { backgroundColor: colors.primary }]}>
              <Feather name="info" size={12} color="#fff" />
            </View>
            <Text style={[s.explanationLabel, { color: colors.primary }]}>Explanation</Text>
          </View>
          <Text style={[s.explanationText, { color: colors.text }]}>{question.explanation}</Text>
        </View>
      ) : showResult ? (
        <View style={[s.explanationBox, { backgroundColor: colors.surface, borderLeftColor: colors.surfaceBorder }]}>
          <Text style={[s.explanationText, { color: colors.textSecondary }]}>No explanation available.</Text>
        </View>
      ) : null}

    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 12 },

  // Question card
  questionCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  questionText: {
    fontFamily: F.semiBold,
    fontSize: 17,
    lineHeight: 27,
  },

  // Options
  optionsList: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleLetter: { fontFamily: F.bold,     fontSize: 13 },
  optionText:   { fontFamily: F.medium,   flex: 1, fontSize: 15, lineHeight: 22 },

  // Explanation
  explanationBox: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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
  explanationLabel: { fontFamily: F.bold,    fontSize: 13, letterSpacing: 0.2 },
  explanationText:  { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
});
