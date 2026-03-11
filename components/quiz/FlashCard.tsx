import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

interface FlashCardProps {
  question: Question;
  isFlipped: boolean;
  onFlip: () => void;
  cardIndex: number;
  total: number;
}

export function FlashCard({ question, isFlipped, onFlip, cardIndex, total }: FlashCardProps) {
  const colors = useThemeColors();
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: isFlipped ? colors.primary : colors.surfaceBorder,
            shadowColor: isFlipped ? colors.primary : '#000',
          },
        ]}
      >
        <View style={[styles.strip, { backgroundColor: isFlipped ? colors.primary : colors.gradientAccent }]} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.labelDot, { backgroundColor: isFlipped ? colors.primary : colors.gradientAccent }]} />
            <Text style={[styles.sideLabel, { color: isFlipped ? colors.primary : colors.textSecondary }]}>
              {isFlipped ? 'ANSWER' : 'QUESTION'}
            </Text>
          </View>
          <View style={[styles.counterPill, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.counter, { color: colors.text }]}>{cardIndex + 1}</Text>
            <Text style={[styles.counterSep, { color: colors.textSecondary }]}>/</Text>
            <Text style={[styles.counter, { color: colors.textSecondary }]}>{total}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {isFlipped ? (
            <>
              <View style={[styles.answerBubble, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '55' }]}>
                <Text style={[styles.answerText, { color: colors.text }]}>{correctOption?.text}</Text>
              </View>
              <View style={[styles.explanationBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
                <View style={styles.explanationHeader}>
                  <Feather name="info" size={14} color={colors.primary} />
                  <Text style={[styles.explanationTitle, { color: colors.primary }]}>Explanation</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {question.explanation || 'No explanation available.'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
          <Feather name="rotate-cw" size={13} color={colors.textSecondary} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  strip: { height: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  labelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sideLabel: {
    fontFamily: F.bold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  counter: {
    fontFamily: F.semiBold,
    fontSize: 12,
  },
  counterSep: {
    fontFamily: F.regular,
    fontSize: 11,
    opacity: 0.6,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 18,
  },
  questionText: {
    fontFamily: F.semiBold,
    fontSize: 24,
    lineHeight: 38,
    textAlign: 'center',
  },
  answerBubble: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  answerText: {
    fontFamily: F.bold,
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'center',
  },
  explanationBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  explanationTitle: {
    fontFamily: F.bold,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  explanationText: {
    fontFamily: F.medium,
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  hintText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
});
