import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { flashcards, type FlashcardCategory } from '@/data/flashcards';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { F } from '@/constants/Typography';
import { AWS_SERVICE_ICONS, AWS_SERVICE_ACCENT } from '@/constants/awsIcons';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = 72;
const FLIP_DURATION  = 360;

const FILTERS: { key: FlashcardCategory | 'all'; label: string }[] = [
  { key: 'all',               label: 'All packs' },
  { key: 'aws-practitioner',  label: 'AWS'       },
  { key: 'genai-practitioner',label: 'GenAI'     },
];

export default function FlashcardsScreen() {
  const colors            = useThemeColors();
  const animationsEnabled = useThemeStore((s) => s.animationsEnabled);
  const { category } = useLocalSearchParams<{ category?: FlashcardCategory }>();

  const [filter,  setFilter]  = useState<FlashcardCategory | 'all'>('all');
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);

  // ── Shared animation values ────────────────────────────────────────────────
  const cardX        = useSharedValue(0);   // horizontal drag / exit
  const cardOpacity  = useSharedValue(1);
  const cardScale    = useSharedValue(1);
  const flipProgress = useSharedValue(0);   // 0 = front, 1 = back

  // ── Stale-closure-safe refs ────────────────────────────────────────────────
  const indexRef   = useRef(index);
  const flippedRef = useRef(flipped);
  useEffect(() => { indexRef.current = index; },   [index]);
  useEffect(() => { flippedRef.current = flipped; }, [flipped]);

  const items = useMemo(
    () => filter === 'all' ? flashcards : flashcards.filter((c) => c.category === filter),
    [filter],
  );
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const active = items[Math.min(index, Math.max(0, items.length - 1))];

  // ── Navigate to card with slide-out / slide-in animation ──────────────────
  const goTo = useCallback((nextIdx: number, dir: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!animationsEnabled) {
      // Instant: no animation, just swap
      cardX.value        = 0;
      cardOpacity.value  = 1;
      cardScale.value    = 1;
      flipProgress.value = 0;
      setIndex(nextIdx);
      setFlipped(false);
      return;
    }

    const exitX  = dir === 'left' ? -SCREEN_W * 1.1 : SCREEN_W * 1.1;
    const enterX = dir === 'left' ?  SCREEN_W * 1.1 : -SCREEN_W * 1.1;

    cardX.value = withTiming(exitX, { duration: 220, easing: Easing.in(Easing.quad) }, () => {
      cardX.value        = enterX;
      cardOpacity.value  = 0;
      flipProgress.value = 0;
      runOnJS(setIndex)(nextIdx);
      runOnJS(setFlipped)(false);
      cardX.value       = withSpring(0, { damping: 18, stiffness: 200 });
      cardOpacity.value = withDelay(60, withTiming(1, { duration: 180 }));
    });
  }, [animationsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    const curr = indexRef.current;
    const len  = itemsRef.current.length;
    if (curr < len - 1) goTo(curr + 1, 'left');
  }, [goTo]);

  const goPrev = useCallback(() => {
    const curr = indexRef.current;
    if (curr > 0) goTo(curr - 1, 'right');
  }, [goTo]);

  // ── 3-D flip (Y-axis rotation) ─────────────────────────────────────────────
  const doFlip = useCallback(() => {
    const toValue = flippedRef.current ? 0 : 1;
    if (animationsEnabled) {
      flipProgress.value = withTiming(toValue, {
        duration: FLIP_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Instant: jump to final position so back/front face opacity threshold fires immediately
      flipProgress.value = toValue;
    }
    setFlipped((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [animationsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset on filter / category change ─────────────────────────────────────
  const changeFilter = useCallback((key: FlashcardCategory | 'all') => {
    cardX.value        = 0;
    flipProgress.value = 0;
    cardOpacity.value  = animationsEnabled ? 0 : 1;
    setFilter(key);
    setIndex(0);
    setFlipped(false);
    if (animationsEnabled) {
      cardOpacity.value = withDelay(40, withTiming(1, { duration: 260 }));
    }
  }, [animationsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (category === 'aws-practitioner' || category === 'genai-practitioner') {
      changeFilter(category);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PanResponder — horizontal swipe to navigate ───────────────────────────
  // animRef keeps PanResponder closure in sync with the latest animationsEnabled value
  const animRef  = useRef(animationsEnabled);
  useEffect(() => { animRef.current = animationsEnabled; }, [animationsEnabled]);

  const dragging = useRef(false);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        !dragging.current &&
        Math.abs(gs.dx) > 10 &&
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.4,
      onPanResponderGrant: () => {
        dragging.current = true;
        if (animRef.current) cardScale.value = withTiming(0.96, { duration: 120 });
      },
      onPanResponderMove: (_, gs) => {
        if (animRef.current) cardX.value = gs.dx * 0.82;
      },
      onPanResponderRelease: (_, gs) => {
        dragging.current = false;
        if (animRef.current) cardScale.value = withSpring(1, { damping: 14, stiffness: 260 });
        if (gs.dx < -SWIPE_THRESHOLD) {
          goNext();
        } else if (gs.dx > SWIPE_THRESHOLD) {
          goPrev();
        } else if (animRef.current) {
          cardX.value = withSpring(0, { damping: 16, stiffness: 280 });
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        if (animRef.current) { cardScale.value = withSpring(1); cardX.value = withSpring(0); }
      },
    }),
  ).current;

  // ── Animated styles ────────────────────────────────────────────────────────

  // Outer wrapper: translates + tilts + scales during drag
  const wrapperStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      cardX.value,
      [-SCREEN_W / 2, 0, SCREEN_W / 2],
      [-10, 0, 10],
      'clamp',
    );
    return {
      transform: [
        { translateX: cardX.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
      opacity: cardOpacity.value,
    };
  });

  // Front face: rotates 0° → 90° in first half, then hides
  const frontFaceStyle = useAnimatedStyle(() => {
    const rotY = interpolate(flipProgress.value, [0, 0.5], [0, 90], 'clamp');
    const opacity = interpolate(flipProgress.value, [0, 0.45, 0.5, 1], [1, 1, 0, 0]);
    return {
      transform: [{ perspective: 1400 }, { rotateY: `${rotY}deg` }],
      opacity,
    };
  });

  // Back face: hidden in first half, rotates -90° → 0° in second half
  const backFaceStyle = useAnimatedStyle(() => {
    const rotY = interpolate(flipProgress.value, [0.5, 1], [-90, 0], 'clamp');
    const opacity = interpolate(flipProgress.value, [0, 0.5, 0.55, 1], [0, 0, 1, 1]);
    return {
      transform: [{ perspective: 1400 }, { rotateY: `${rotY}deg` }],
      opacity,
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
    };
  });

  // Swipe hint arrows — fade in as user drags
  const prevHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cardX.value, [0, SWIPE_THRESHOLD], [0, 0.7], 'clamp'),
  }));
  const nextHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cardX.value, [-SWIPE_THRESHOLD, 0], [0.7, 0], 'clamp'),
  }));

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[s.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={[s.backText, { color: colors.textSecondary }]}>Back</Text>
        </Pressable>
        <Text style={[s.title, { color: colors.text }]}>Flashcards</Text>
        <View style={{ width: 72 }} />
      </View>

      {/* ── Top controls (not in a ScrollView so card area gets flex: 1) ── */}
      <View style={s.topControls}>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Swipe left / right to navigate · tap to flip.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map((item) => {
            const active = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => changeFilter(item.key)}
                style={[s.filterChip, {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor:     active ? colors.primary : colors.surfaceBorder,
                }]}
              >
                <Text style={[s.filterChipText, { color: active ? '#FFFFFF' : colors.text }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[s.progressShell, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ProgressBar progress={items.length ? (index + 1) / items.length : 0} height={6} />
          <Text style={[s.progressText, { color: colors.textSecondary }]}>
            {items.length ? `${index + 1} / ${items.length}` : '0 / 0'}
          </Text>
        </View>
      </View>

      {/* ── Card area ── */}
      <View style={s.cardArea}>
        {/* Swipe-direction hints */}
        <Animated.View style={[s.hintLeft, prevHintStyle]} pointerEvents="none">
          <View style={[s.hintPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Feather name="chevron-left" size={18} color={colors.textSecondary} />
            <Text style={[s.hintText, { color: colors.textSecondary }]}>Prev</Text>
          </View>
        </Animated.View>
        <Animated.View style={[s.hintRight, nextHintStyle]} pointerEvents="none">
          <View style={[s.hintPill, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.hintText, { color: colors.textSecondary }]}>Next</Text>
            <Feather name="chevron-right" size={18} color={colors.textSecondary} />
          </View>
        </Animated.View>

        {active ? (
          <Animated.View style={[s.cardWrapper, wrapperStyle]} {...pan.panHandlers}>
            <Pressable onPress={doFlip} style={s.cardPressable}>

              {/* ── Front face ── */}
              <Animated.View
                style={[s.cardFace, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, frontFaceStyle]}
              >
                <View style={[s.cardStrip, { backgroundColor: colors.primary }]} />
                <View style={s.cardHeader}>
                  <Text style={[s.cardLabel, { color: colors.textSecondary }]}>QUESTION</Text>
                  <View style={[s.tagPill, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
                    <Text style={[s.tagPillText, { color: colors.text }]}>{active.tag ?? 'Concept'}</Text>
                  </View>
                </View>
                <View style={s.cardBody}>
                  {AWS_SERVICE_ICONS[active.front] ? (
                    <>
                      <View style={[s.serviceIconWrap, { backgroundColor: (AWS_SERVICE_ACCENT[active.front] ?? colors.primary) + '18' }]}>
                        <Image source={AWS_SERVICE_ICONS[active.front]!} style={s.serviceIcon} />
                      </View>
                      <Text style={[s.cardMain, { color: colors.text, fontSize: 24 }]}>{active.front}</Text>
                    </>
                  ) : (
                    <Text style={[s.cardMain, { color: colors.text, fontSize: 24 }]}>{active.front}</Text>
                  )}
                </View>
                <View style={[s.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <Feather name="rotate-cw" size={14} color={colors.textSecondary} />
                  <Text style={[s.cardFooterText, { color: colors.textSecondary }]}>Tap to reveal the answer</Text>
                </View>
              </Animated.View>

              {/* ── Back face ── */}
              <Animated.View
                style={[s.cardFace, { backgroundColor: colors.surface, borderColor: colors.primary }, backFaceStyle]}
              >
                <View style={[s.cardStrip, { backgroundColor: colors.primary }]} />
                <View style={s.cardHeader}>
                  <Text style={[s.cardLabel, { color: colors.primary }]}>ANSWER</Text>
                  <View style={[s.tagPill, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
                    <Text style={[s.tagPillText, { color: colors.text }]}>{active.tag ?? 'Concept'}</Text>
                  </View>
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardMain, { color: colors.text, fontSize: 18 }]}>{active.back}</Text>
                </View>
                <View style={[s.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <Feather name="rotate-cw" size={14} color={colors.textSecondary} />
                  <Text style={[s.cardFooterText, { color: colors.textSecondary }]}>Tap to see the question again</Text>
                </View>
              </Animated.View>

            </Pressable>
          </Animated.View>
        ) : (
          <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>No flashcards in this pack.</Text>
          </View>
        )}
      </View>

      {/* ── Bottom nav ── */}
      <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
        <Pressable
          onPress={goPrev}
          disabled={index === 0}
          style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: index === 0 ? 0.35 : 1 }]}
        >
          <Feather name="chevrons-left" size={18} color={colors.text} />
          <Text style={[s.navBtnText, { color: colors.text }]}>Previous</Text>
        </Pressable>

        <Pressable
          onPress={() => index < items.length - 1 ? goNext() : router.back()}
          style={[s.navBtn, { borderColor: colors.surfaceBorder }]}
        >
          <Text style={[s.navBtnText, { color: colors.text }]}>
            {index < items.length - 1 ? 'Next' : 'Done'}
          </Text>
          <Feather
            name={index < items.length - 1 ? 'chevrons-right' : 'check'}
            size={18}
            color={colors.text}
          />
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:   { flex: 1 },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:   { fontFamily: F.medium, fontSize: 15 },
  title:      { fontFamily: F.bold, fontSize: 18 },

  // Top controls
  topControls:  { paddingHorizontal: 16, paddingTop: 14, gap: 14 },
  subtitle:     { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
  filterRow:    { gap: 10, paddingRight: 4 },
  filterChip:   { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 13 },
  progressShell:  { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  progressText:   { fontFamily: F.semiBold, fontSize: 12, textAlign: 'right' },

  // Card area
  cardArea:   { flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },

  // Swipe hints
  hintLeft:   { position: 'absolute', left: 4, top: 0, bottom: 0, justifyContent: 'center', zIndex: 10 },
  hintRight:  { position: 'absolute', right: 4, top: 0, bottom: 0, justifyContent: 'center', zIndex: 10 },
  hintPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderRadius: 20 },
  hintText:   { fontFamily: F.semiBold, fontSize: 12 },

  // Card
  cardWrapper:   { flex: 1 },
  cardPressable: { flex: 1 },
  cardFace:      {
    flex: 1,
    borderWidth: 1.2,
    borderRadius: 24,
    overflow: 'hidden',
    // Shadow
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  cardStrip:     { height: 5 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 12 },
  cardLabel:     { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2 },
  tagPill:       { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagPillText:   { fontFamily: F.semiBold, fontSize: 12 },
  cardBody:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20, gap: 18 },
  cardMain:      { fontFamily: F.bold, lineHeight: 36, textAlign: 'center' },
  serviceIconWrap: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  serviceIcon:   { width: 56, height: 56 },
  cardFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 14 },
  cardFooterText:{ fontFamily: F.medium, fontSize: 13 },

  // Empty state
  emptyCard:  { minHeight: 220, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText:  { fontFamily: F.medium, fontSize: 15, textAlign: 'center' },

  // Bottom nav
  bottomNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  navBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  navBtnText:   { fontFamily: F.semiBold, fontSize: 15 },
});
