import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  cancelAnimation,
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
  { key: 'all',                label: 'All packs' },
  { key: 'aws-practitioner',   label: 'AWS'       },
  { key: 'genai-practitioner', label: 'GenAI'     },
  { key: 'aip-c01',            label: 'AIP-C01'   },
];

const KNOWN_KEY = (filter: string) => `flashcards-known-${filter}`;

async function loadKnown(filter: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KNOWN_KEY(filter));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

async function saveKnown(filter: string, known: Set<string>) {
  try {
    if (known.size === 0) { await AsyncStorage.removeItem(KNOWN_KEY(filter)); }
    else { await AsyncStorage.setItem(KNOWN_KEY(filter), JSON.stringify([...known])); }
  } catch { /* storage unavailable */ }
}

export default function FlashcardsScreen() {
  const colors            = useThemeColors();
  const animationsEnabled = useThemeStore((s) => s.animationsEnabled);
  const { category } = useLocalSearchParams<{ category?: FlashcardCategory }>();

  const [filter,  setFilter]  = useState<FlashcardCategory | 'all'>('all');
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState<Set<string>>(new Set());
  const [phase,   setPhase]   = useState<'practice' | 'review' | 'complete'>('practice');

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

  const allItems = useMemo(
    () => filter === 'all' ? flashcards : flashcards.filter((c) => c.category === filter),
    [filter],
  );

  // Queue = cards not yet known in this session
  const items = useMemo(
    () => allItems.filter((c) => !known.has(c.id)),
    [allItems, known],
  );

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const active   = items[Math.min(index, Math.max(0, items.length - 1))];
  const stillLearning = allItems.filter((c) => !known.has(c.id));
  const knewItCards   = allItems.filter((c) =>  known.has(c.id));

  // Load known set when filter changes and reset to practice
  useEffect(() => {
    loadKnown(filter).then((k) => {
      setKnown(k);
      setPhase('practice');
      setIndex(0);
      setFlipped(false);
    });
  }, [filter]);

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

    cardX.value = withTiming(exitX, { duration: 220, easing: Easing.in(Easing.quad) }, (finished) => {
      // If animation was cancelled (e.g. filter changed mid-swipe) abort — don't
      // move the card to enterX, which would leave it stuck off-screen.
      if (!finished) return;
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

  const markKnown = useCallback(() => {
    if (!active) return;
    const updated = new Set([...known, active.id]);
    setKnown(updated);
    void saveKnown(filter, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (updated.size >= allItems.length) { setPhase('complete'); return; }
    const nextIdx = Math.min(indexRef.current, itemsRef.current.length - 2);
    if (nextIdx >= 0) goTo(nextIdx, 'left');
    else { setIndex(0); setFlipped(false); }
  }, [active, known, filter, allItems.length, goTo]);

  const markKnownById = useCallback((id: string) => {
    const updated = new Set([...known, id]);
    setKnown(updated);
    void saveKnown(filter, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (updated.size >= allItems.length) setPhase('complete');
  }, [known, filter, allItems.length]);

  const markAllKnown = useCallback(() => {
    const updated = new Set(allItems.map((c) => c.id));
    setKnown(updated);
    void saveKnown(filter, updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhase('complete');
  }, [allItems, filter]);

  const markStillLearning = useCallback(() => {
    if (!active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goNext();
  }, [active, goNext]);

  const resetKnown = useCallback(() => {
    setKnown(new Set());
    setIndex(0);
    setFlipped(false);
    setPhase('practice');
    void saveKnown(filter, new Set());
  }, [filter]);

  const practiceStillLearning = useCallback(() => {
    setIndex(0);
    setFlipped(false);
    flipProgress.value = 0;
    cardX.value = 0;
    cardOpacity.value = 1;
    setPhase('practice');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Cancel any in-flight swipe/fade animation so their callbacks don't fire
    // after we reset the values, which would leave the card stuck off-screen.
    cancelAnimation(cardX);
    cancelAnimation(cardOpacity);
    cancelAnimation(cardScale);
    cancelAnimation(flipProgress);
    cardX.value        = 0;
    cardScale.value    = 1;
    flipProgress.value = 0;
    cardOpacity.value  = animationsEnabled ? 0 : 1;
    setFilter(key);
    setIndex(0);
    setFlipped(false);
    setPhase('practice');
    if (animationsEnabled) {
      cardOpacity.value = withDelay(40, withTiming(1, { duration: 260 }));
    }
  }, [animationsEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (category === 'aws-practitioner' || category === 'genai-practitioner') {
      changeFilter(category);
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PanResponder — handles both tap-to-flip and swipe-to-navigate ──────────
  // Claiming from onStart means we own every touch on the card, so we can
  // distinguish a short tap (flip) from a horizontal drag (navigate) ourselves.
  // This avoids Pressable/PanResponder conflicts on Android New Architecture.
  const animRef   = useRef(animationsEnabled);
  const doFlipRef = useRef(doFlip);
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  useEffect(() => { animRef.current   = animationsEnabled; }, [animationsEnabled]);
  useEffect(() => { doFlipRef.current = doFlip; },           [doFlip]);
  useEffect(() => { goNextRef.current = goNext; },           [goNext]);
  useEffect(() => { goPrevRef.current = goPrev; },           [goPrev]);

  const dragging = useRef(false);
  const pan = useRef(
    PanResponder.create({
      // Claim the responder on the very first touch so we see every event.
      onStartShouldSetPanResponder:        () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder:         () => true,
      onMoveShouldSetPanResponderCapture:  () => false,

      onPanResponderGrant: () => {
        dragging.current = true;
        if (animRef.current) cardScale.value = withTiming(0.96, { duration: 120 });
      },
      onPanResponderMove: (_, gs) => {
        if (animRef.current) cardX.value = gs.dx * 0.82;
      },
      onPanResponderRelease: (_, gs) => {
        dragging.current = false;
        cardScale.value = withSpring(1, { damping: 14, stiffness: 260 });

        const isTap = Math.abs(gs.dx) < 8 && Math.abs(gs.dy) < 8;

        if (isTap) {
          // Snap card back (it barely moved) then flip
          cardX.value = withSpring(0, { damping: 16, stiffness: 280 });
          doFlipRef.current();
        } else if (gs.dx < -SWIPE_THRESHOLD) {
          goNextRef.current();
        } else if (gs.dx > SWIPE_THRESHOLD) {
          goPrevRef.current();
        } else {
          // Didn't reach threshold — snap back
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

      {/* ── Top controls — hidden during review/complete ── */}
      {phase === 'practice' && <View style={s.topControls}>
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
                <Text style={[s.filterChipText, { color: active ? colors.surface : colors.text }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[s.progressShell, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ProgressBar progress={items.length ? (index + 1) / items.length : 0} height={6} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[s.progressText, { color: colors.textSecondary }]}>
              {items.length ? `${index + 1} / ${items.length}` : '0 / 0'}
            </Text>
            {known.size > 0 && (
              <Text style={[s.progressText, { color: '#28C76F' }]}>
                ✓ {known.size} known
              </Text>
            )}
          </View>
        </View>
      </View>}

      {/* ══════════════════ PRACTICE phase ══════════════════ */}
      {phase === 'practice' && (
        <>
          {/* ── Card area ── */}
          <View style={s.cardArea}>
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
                {/* Front face */}
                <Animated.View style={[s.cardFace, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, frontFaceStyle]} pointerEvents="none">
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
                {/* Back face */}
                <Animated.View style={[s.cardFace, { backgroundColor: colors.surface, borderColor: colors.primary }, backFaceStyle]} pointerEvents="none">
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
              </Animated.View>
            ) : (
              <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[s.emptyText, { color: colors.textSecondary }]}>No flashcards in this pack.</Text>
              </View>
            )}
          </View>

          {/* ── Bottom nav ── */}
          {flipped ? (
            <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
              <Pressable onPress={markStillLearning} style={[s.navBtn, { flex: 1, justifyContent: 'center', borderColor: '#FF9F43', backgroundColor: '#FF9F4318' }]}>
                <Feather name="refresh-cw" size={16} color="#FF9F43" />
                <Text style={[s.navBtnText, { color: '#FF9F43' }]}>Still learning</Text>
              </Pressable>
              <Pressable onPress={markKnown} style={[s.navBtn, { flex: 1, justifyContent: 'center', borderColor: '#28C76F', backgroundColor: '#28C76F18' }]}>
                <Feather name="check-circle" size={16} color="#28C76F" />
                <Text style={[s.navBtnText, { color: '#28C76F' }]}>I knew it</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[s.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
              <Pressable onPress={goPrev} disabled={index === 0} style={[s.navBtn, { borderColor: colors.surfaceBorder, opacity: index === 0 ? 0.35 : 1 }]}>
                <Feather name="chevrons-left" size={18} color={colors.text} />
                <Text style={[s.navBtnText, { color: colors.text }]}>Previous</Text>
              </Pressable>
              <Pressable
                onPress={() => index < items.length - 1 ? goNext() : setPhase('review')}
                style={[s.navBtn, { borderColor: index < items.length - 1 ? colors.surfaceBorder : colors.primary }]}
              >
                <Text style={[s.navBtnText, { color: index < items.length - 1 ? colors.text : colors.primary }]}>
                  {index < items.length - 1 ? 'Next' : 'Finish'}
                </Text>
                <Feather name={index < items.length - 1 ? 'chevrons-right' : 'flag'} size={18} color={index < items.length - 1 ? colors.text : colors.primary} />
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* ══════════════════ REVIEW phase ══════════════════ */}
      {phase === 'review' && (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={s.reviewList} showsVerticalScrollIndicator={false}>

            {/* ── Stats banner ── */}
            <View style={[s.statsBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: colors.text }]}>{allItems.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: '#28C76F' }]}>{knewItCards.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>You know</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: '#FF9F43' }]}>{stillLearning.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>To learn</Text>
              </View>
            </View>

            {/* ── Progress bar ── */}
            <View style={{ gap: 6 }}>
              <ProgressBar progress={allItems.length ? knewItCards.length / allItems.length : 0} height={8} />
              <Text style={[s.reviewStatText, { color: colors.textSecondary, textAlign: 'center' }]}>
                {allItems.length ? Math.round((knewItCards.length / allItems.length) * 100) : 0}% mastered
              </Text>
            </View>

            {/* Still learning */}
            {stillLearning.length > 0 && (
              <>
                <Text style={[s.reviewSectionTitle, { color: '#FF9F43', marginTop: 8 }]}>↻  Still Learning</Text>
                {stillLearning.map((card) => (
                  <View key={card.id} style={[s.reviewRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[s.reviewRowFront, { color: colors.text }]} numberOfLines={2}>{card.front}</Text>
                      <Text style={[s.reviewRowBack, { color: colors.textSecondary }]} numberOfLines={1}>{card.back}</Text>
                    </View>
                    <Pressable onPress={() => markKnownById(card.id)} style={[s.reviewMarkBtn, { borderColor: '#28C76F', backgroundColor: '#28C76F14' }]}>
                      <Feather name="check" size={15} color="#28C76F" />
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            {/* I knew it */}
            {knewItCards.length > 0 && (
              <>
                <Text style={[s.reviewSectionTitle, { color: '#28C76F', marginTop: stillLearning.length > 0 ? 20 : 8 }]}>✓  I Knew It</Text>
                {knewItCards.map((card) => (
                  <View key={card.id} style={[s.reviewRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: 0.55 }]}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[s.reviewRowFront, { color: colors.text }]} numberOfLines={2}>{card.front}</Text>
                      <Text style={[s.reviewRowBack, { color: colors.textSecondary }]} numberOfLines={1}>{card.back}</Text>
                    </View>
                    <View style={[s.reviewMarkBtn, { borderColor: '#28C76F55', backgroundColor: '#28C76F10' }]}>
                      <Feather name="check" size={15} color="#28C76F" />
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          {/* Review footer */}
          <View style={[s.reviewFooter, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
            {stillLearning.length > 0 ? (
              <>
                <Pressable onPress={practiceStillLearning} style={[s.footerBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
                  <Feather name="refresh-cw" size={16} color={colors.primary} />
                  <Text style={[s.footerBtnText, { color: colors.primary }]}>Restart Flashcards</Text>
                  <Text style={[s.footerBtnSub, { color: colors.textSecondary }]}>{stillLearning.length} cards to learn</Text>
                </Pressable>
                <Pressable onPress={markAllKnown} style={[s.footerBtn, { borderColor: '#28C76F', backgroundColor: '#28C76F14' }]}>
                  <Feather name="check-circle" size={16} color="#28C76F" />
                  <Text style={[s.footerBtnText, { color: '#28C76F' }]}>Mark All Known</Text>
                  <Text style={[s.footerBtnSub, { color: colors.textSecondary }]}>Complete this pack</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setPhase('complete')} style={[s.footerBtn, { flex: 1, alignItems: 'center', borderColor: '#28C76F', backgroundColor: '#28C76F14' }]}>
                <Feather name="award" size={20} color="#28C76F" />
                <Text style={[s.footerBtnText, { color: '#28C76F' }]}>All Done!</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.replace('/(tabs)')} style={[s.footerBtnOutline, { borderColor: colors.surfaceBorder }]}>
              <Feather name="home" size={16} color={colors.textSecondary} />
              <Text style={[s.footerBtnOutlineText, { color: colors.textSecondary }]}>Go to Home</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* ══════════════════ COMPLETE phase ══════════════════ */}
      {phase === 'complete' && (
        <>
          {/* Stats banner reused */}
          <View style={[s.cardArea, { justifyContent: 'center', gap: 20 }]}>
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View style={[s.completeIcon, { backgroundColor: '#28C76F18' }]}>
                <Feather name="award" size={52} color="#28C76F" />
              </View>
              <Text style={[s.completeTitle, { color: colors.text }]}>Pack Complete!</Text>
            </View>

            <View style={[s.statsBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: colors.text }]}>{allItems.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: '#28C76F' }]}>{knewItCards.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>You know</Text>
              </View>
              <View style={[s.statDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={s.statItem}>
                <Text style={[s.statNumber, { color: stillLearning.length > 0 ? '#FF9F43' : '#28C76F' }]}>{stillLearning.length}</Text>
                <Text style={[s.statLabel, { color: colors.textSecondary }]}>To learn</Text>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <ProgressBar progress={allItems.length ? knewItCards.length / allItems.length : 0} height={10} />
              <Text style={[s.completeSubtitle, { color: colors.textSecondary }]}>
                {Math.round((knewItCards.length / allItems.length) * 100)}% mastered · Great work! 🎉
              </Text>
            </View>
          </View>

          <View style={[s.reviewFooter, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
            <Pressable onPress={resetKnown} style={[s.footerBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <Text style={[s.footerBtnText, { color: colors.primary }]}>Restart Flashcards</Text>
              <Text style={[s.footerBtnSub, { color: colors.textSecondary }]}>Start fresh from the top</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} style={[s.footerBtnOutline, { borderColor: colors.surfaceBorder }]}>
              <Feather name="home" size={16} color={colors.textSecondary} />
              <Text style={[s.footerBtnOutlineText, { color: colors.textSecondary }]}>Go to Home</Text>
            </Pressable>
          </View>
        </>
      )}

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
  bottomNav:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  navBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  navBtnText:   { fontFamily: F.semiBold, fontSize: 15 },

  // Review / Stats screen
  reviewList:         { padding: 16, paddingBottom: 24, gap: 12 },
  reviewStatText:     { fontFamily: F.semiBold, fontSize: 13 },
  reviewSectionTitle: { fontFamily: F.bold, fontSize: 13, letterSpacing: 0.4, paddingHorizontal: 2 },
  reviewRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  reviewRowFront:     { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  reviewRowBack:      { fontFamily: F.regular, fontSize: 12 },
  reviewMarkBtn:      { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Stats banner (used in both review + complete)
  statsBanner:  { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8 },
  statItem:     { flex: 1, alignItems: 'center', gap: 4 },
  statNumber:   { fontFamily: F.bold, fontSize: 28, lineHeight: 32 },
  statLabel:    { fontFamily: F.medium, fontSize: 12 },
  statDivider:  { width: 1, height: 36 },

  // Footer (review + complete)
  reviewFooter:       { gap: 10, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  footerBtn:          { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  footerBtnText:      { fontFamily: F.bold, fontSize: 15, flex: 1 },
  footerBtnSub:       { fontFamily: F.regular, fontSize: 12 },
  footerBtnOutline:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 13 },
  footerBtnOutlineText: { fontFamily: F.semiBold, fontSize: 15 },

  // Complete screen
  completeIcon:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  completeTitle:   { fontFamily: F.bold, fontSize: 26, textAlign: 'center' },
  completeSubtitle:{ fontFamily: F.medium, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
