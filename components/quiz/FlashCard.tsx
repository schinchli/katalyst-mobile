/**
 * FlashCard — tap to flip, no color change on flip.
 * Swipe left/right is handled by the parent via PanResponder.
 */
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
  const correctOption = question.options.find((o) => o.id === question.correctOptionId);

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,   // never changes on flip
            shadowColor: colors.text,
          },
        ]}
      >
        {/* Top accent strip — static color */}
        <View style={[styles.strip, { backgroundColor: colors.primary }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.labelDot, { backgroundColor: colors.gradientAccent }]} />
            <Text style={[styles.sideLabel, { color: colors.primary }]}>
              {isFlipped ? 'Answer' : 'Question'}
            </Text>
          </View>
          <View style={[styles.counterPill, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.counter, { color: colors.text }]}>{cardIndex + 1}</Text>
            <Text style={[styles.counterSep, { color: colors.textSecondary }]}>/</Text>
            <Text style={[styles.counter, { color: colors.textSecondary }]}>{total}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {isFlipped ? (
            <>
              {/* Answer bubble */}
              <View style={[styles.answerBubble, {
                backgroundColor: colors.primary + '18',
                borderColor:     colors.primary + '44',
              }]}>
                <Text style={[styles.answerText, { color: colors.text }]}>
                  {correctOption?.text}
                </Text>
              </View>

              {/* Explanation box */}
              <View style={[styles.explanationBox, {
                backgroundColor: colors.surfaceElevated,
                borderColor:     colors.surfaceBorder,
              }]}>
                <View style={styles.explanationHeader}>
                  <Feather name="info" size={14} color={colors.gradientAccent} />
                  <Text style={[styles.explanationTitle, { color: colors.primary }]}>
                    Explanation
                  </Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.text }]}>
                  {question.explanation || 'No explanation available.'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>
          )}
        </View>

        {/* Footer hint */}
        <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
          <Feather name="rotate-cw" size={13} color={colors.textSecondary} />
          <View style={styles.hintCopy}>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {isFlipped ? 'Tap to flip back' : 'Tap to reveal answer'}
            </Text>
            {!isFlipped && (
              <Text style={[styles.hintTextSecondary, { color: colors.textSecondary }]}>
                Swipe to navigate
              </Text>
            )}
          </View>
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
    borderRadius: 16,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  strip: { height: 4 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
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
    fontSize: 12,
    letterSpacing: 0,
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
    gap: 16,
  },

  questionText: {
    fontFamily: F.semiBold,
    fontSize: 21,
    lineHeight: 32,
    textAlign: 'center',
  },

  answerBubble: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  answerText: {
    fontFamily: F.bold,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },

  explanationBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  explanationTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    letterSpacing: 0,
  },
  explanationText: {
    fontFamily: F.medium,
    fontSize: 14,
    lineHeight: 22,
    // no opacity — full brightness for dark mode readability
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  hintCopy: {
    alignItems: 'center',
    gap: 2,
  },
  hintText: {
    fontFamily: F.medium,
    fontSize: 12,
  },
  hintTextSecondary: {
    fontFamily: F.regular,
    fontSize: 11,
  },
});
