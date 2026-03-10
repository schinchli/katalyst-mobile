import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { F } from '@/constants/Typography';
import type { Question } from '@/types';

// ─── Dark luxury palette (Quizlet night × MasterClass premium) ───────────────
const D = {
  questionBg:      '#13111F',   // deep purple-black
  answerBg:        '#0C1820',   // deep blue-black
  questionStrip:   '#7367F0',   // primary purple
  answerStrip:     '#28C76F',   // success green
  questionLabel:   '#9D94FF',   // soft purple
  answerLabel:     '#3DD68C',   // bright green
  questionText:    '#F0EEFF',   // warm white
  counterText:     '#5E5A7A',   // muted purple-grey
  answerBubbleBg:  '#0E2B1E',   // dark green tint
  answerBubbleBorder: '#1E5C38',
  answerBubbleText:'#3DD68C',   // vibrant green
  explanationBg:   '#1A1630',   // slightly lighter than bg
  explanationText: '#9994B8',   // muted lavender
  hintText:        '#46436A',   // very muted
  cardShadow:      '#7367F0',   // purple glow for question
  cardShadowA:     '#28C76F',   // green glow for answer
} as const;

interface FlashCardProps {
  question:   Question;
  isFlipped:  boolean;
  onFlip:     () => void;
  cardIndex:  number;
  total:      number;
}

export function FlashCard({ question, isFlipped, onFlip, cardIndex, total }: FlashCardProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 1 : 0, { duration: 450 });
  }, [isFlipped]);

  const correctOption = question.options.find((o) => o.id === question.correctOptionId);

  // ── Web: opacity-swap (backfaceVisibility unsupported on web) ─────────────
  if (Platform.OS === 'web') {
    return (
      <Pressable onPress={onFlip} style={s.container}>
        <View style={[
          s.card,
          { backgroundColor: isFlipped ? D.answerBg : D.questionBg },
          isFlipped ? s.cardGlowGreen : s.cardGlowPurple,
        ]}>
          <View style={[s.strip, { backgroundColor: isFlipped ? D.answerStrip : D.questionStrip }]} />
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.labelDot, { backgroundColor: isFlipped ? D.answerStrip : D.questionStrip }]} />
              <Text style={[s.sideLabel, { color: isFlipped ? D.answerLabel : D.questionLabel }]}>
                {isFlipped ? 'ANSWER' : 'QUESTION'}
              </Text>
            </View>
            <View style={s.counterPill}>
              <Text style={s.counter}>{cardIndex + 1}</Text>
              <Text style={s.counterSep}>/</Text>
              <Text style={s.counter}>{total}</Text>
            </View>
          </View>

          <View style={s.body}>
            {isFlipped ? (
              <>
                <View style={s.answerBubble}>
                  <Text style={s.answerText}>{correctOption?.text}</Text>
                </View>
                {question.explanation ? (
                  <View style={s.explanationBox}>
                    <Feather name="info" size={13} color={D.questionLabel} style={{ marginBottom: 6 }} />
                    <Text style={s.explanationText}>{question.explanation}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={s.questionText}>{question.text}</Text>
            )}
          </View>

          <View style={s.footer}>
            <Feather name="rotate-cw" size={13} color={D.hintText} />
            <Text style={s.hintText}>Tap to flip</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // ── Native: real 3D Y-axis flip ───────────────────────────────────────────
  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      position: 'absolute' as const,
      width: '100%',
      height: '100%',
    };
  });

  return (
    <Pressable onPress={onFlip} style={s.container}>
      <View style={s.flipContainer}>

        {/* ── Front: Question ── */}
        <Animated.View style={frontStyle}>
          <View style={[s.card, { backgroundColor: D.questionBg }, s.cardGlowPurple]}>
            <View style={[s.strip, { backgroundColor: D.questionStrip }]} />
            <View style={s.header}>
              <View style={s.headerLeft}>
                <View style={[s.labelDot, { backgroundColor: D.questionStrip }]} />
                <Text style={[s.sideLabel, { color: D.questionLabel }]}>QUESTION</Text>
              </View>
              <View style={s.counterPill}>
                <Text style={s.counter}>{cardIndex + 1}</Text>
                <Text style={s.counterSep}>/</Text>
                <Text style={s.counter}>{total}</Text>
              </View>
            </View>
            <View style={s.body}>
              <Text style={s.questionText}>{question.text}</Text>
            </View>
            <View style={s.footer}>
              <Feather name="rotate-cw" size={13} color={D.hintText} />
              <Text style={s.hintText}>Tap to reveal answer</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Back: Answer ── */}
        <Animated.View style={backStyle}>
          <View style={[s.card, { backgroundColor: D.answerBg }, s.cardGlowGreen]}>
            <View style={[s.strip, { backgroundColor: D.answerStrip }]} />
            <View style={s.header}>
              <View style={s.headerLeft}>
                <View style={[s.labelDot, { backgroundColor: D.answerStrip }]} />
                <Text style={[s.sideLabel, { color: D.answerLabel }]}>ANSWER</Text>
              </View>
              <View style={s.counterPill}>
                <Text style={s.counter}>{cardIndex + 1}</Text>
                <Text style={s.counterSep}>/</Text>
                <Text style={s.counter}>{total}</Text>
              </View>
            </View>
            <View style={s.body}>
              <View style={s.answerBubble}>
                <Text style={s.answerText}>{correctOption?.text}</Text>
              </View>
              {question.explanation ? (
                <View style={s.explanationBox}>
                  <Feather name="info" size={13} color={D.questionLabel} style={{ marginBottom: 6 }} />
                  <Text style={s.explanationText}>{question.explanation}</Text>
                </View>
              ) : null}
            </View>
            <View style={s.footer}>
              <Feather name="rotate-cw" size={13} color={D.hintText} />
              <Text style={s.hintText}>Tap to flip back</Text>
            </View>
          </View>
        </Animated.View>

      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  flipContainer: {
    flex: 1,
    position: 'relative',
  },

  // ── Card shell ──────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGlowPurple: {
    shadowColor: '#7367F0',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardGlowGreen: {
    shadowColor: '#28C76F',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // ── Top accent strip ────────────────────────────────────────────────────────
  strip: { height: 5 },

  // ── Header row ──────────────────────────────────────────────────────────────
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
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  counter: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: D.counterText,
  },
  counterSep: {
    fontFamily: F.regular,
    fontSize: 11,
    color: D.counterText,
    opacity: 0.5,
  },

  // ── Body (question / answer content) ────────────────────────────────────────
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 16,
    gap: 18,
  },
  questionText: {
    fontFamily: F.semiBold,
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    color: D.questionText,
    letterSpacing: 0.1,
  },

  // ── Answer bubble ───────────────────────────────────────────────────────────
  answerBubble: {
    backgroundColor: D.answerBubbleBg,
    borderWidth: 1,
    borderColor: D.answerBubbleBorder,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  answerText: {
    fontFamily: F.bold,
    fontSize: 19,
    color: D.answerBubbleText,
    textAlign: 'center',
    lineHeight: 28,
  },

  // ── Explanation ─────────────────────────────────────────────────────────────
  explanationBox: {
    backgroundColor: D.explanationBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  explanationText: {
    fontFamily: F.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: D.explanationText,
  },

  // ── Footer hint ─────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 22,
  },
  hintText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: D.hintText,
  },
});
