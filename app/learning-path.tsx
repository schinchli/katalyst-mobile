/**
 * Learning Path screen — shows the full step-by-step track for the
 * user's chosen certification with progress tracking.
 */
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { LEARNING_PATHS, type LearningStep } from '@/data/learningPaths';
import { PLAYLIST } from '@/data/videos';
import { useLearningPathStore } from '@/stores/learningPathStore';
import { useProgressStore } from '@/stores/progressStore';
import { getStudyEfficiencyHints } from '@/utils/recommendations';

export default function LearningPathScreen() {
  const colors = useThemeColors();
  const { activePathId, completedStepIds, markStepDone, setActivePath, setShowSelector } = useLearningPathStore();
  const recentResults = useProgressStore((s) => s.progress.recentResults);
  const [overlapExpanded, setOverlapExpanded] = useState(false);

  const path = useMemo(() => LEARNING_PATHS.find((p) => p.id === activePathId), [activePathId]);

  // A quiz step is complete if user has passed it (score ≥ 70%)
  const isQuizPassed = useCallback((quizId: string): boolean => {
    return recentResults.some((r) => r.quizId === quizId && r.score > 0);
  }, [recentResults]);

  const isStepDone = useCallback((step: LearningStep): boolean => {
    if (step.type === 'quiz') return isQuizPassed(step.resourceId);
    return completedStepIds.includes(step.id);
  }, [completedStepIds, isQuizPassed]);

  const completedCount = useMemo(
    () => path ? path.steps.filter(isStepDone).length : 0,
    [path, isStepDone],
  );

  const nextStep = useMemo(
    () => path?.steps.find((s) => !isStepDone(s)),
    [path, isStepDone],
  );

  // Cross-exam overlap hints — only meaningful when user has quiz history
  const hasHistory = recentResults.length > 0;

  const activePathHints = useMemo(
    () => (path && hasHistory) ? getStudyEfficiencyHints(path.id, recentResults) : [],
    [path, recentResults, hasHistory],
  );

  const activeOverlapDomains = useMemo(
    () => activePathHints.filter((h) => h.status !== 'fresh'),
    [activePathHints],
  );

  // Per-card overlap summary for the selector (computed lazily per path)
  const getPathOverlapSummary = useCallback((pathId: string) => {
    if (!hasHistory) return null;
    const hints = getStudyEfficiencyHints(pathId, recentResults);
    const covered = hints.filter((h) => h.status === 'covered').length;
    const partial = hints.filter((h) => h.status === 'partial').length;
    const total = hints.length;
    if (covered + partial === 0 || total === 0) return null;
    // Weighted coverage: covered = 100%, partial = 50%
    const pct = Math.round(((covered + partial * 0.5) / total) * 100);
    return { covered, partial, total, pct };
  }, [hasHistory, recentResults]);

  const handleStep = useCallback((step: LearningStep) => {
    if (step.type === 'quiz') {
      router.push(`/quiz/${step.resourceId}` as never);
    } else if (step.type === 'flashcard') {
      router.push({ pathname: '/flashcards', params: { category: step.resourceId } } as never);
    } else if (step.type === 'video') {
      const video = PLAYLIST.find((v) => v.id === step.resourceId);
      if (video) {
        Linking.openURL(`https://youtu.be/${video.youtubeId}`);
        markStepDone(step.id);
      }
    }
  }, [markStepDone]);

  const typeIcon = (type: LearningStep['type']): keyof typeof Feather.glyphMap => {
    if (type === 'quiz') return 'edit-3';
    if (type === 'flashcard') return 'layers';
    return 'play-circle';
  };

  const typeLabel = (type: LearningStep['type']) => {
    if (type === 'quiz') return 'Quiz';
    if (type === 'flashcard') return 'Flashcards';
    return 'Video';
  };

  if (!path) {
    // No path selected — show path selector inline
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[s.header, { borderBottomColor: colors.surfaceBorder }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>Learning Tracks</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.selectorScroll}>
          <Text style={[s.selectorHeadline, { color: colors.text }]}>
            What are you preparing for?
          </Text>
          <Text style={[s.selectorSub, { color: colors.textSecondary }]}>
            Choose a track and we'll guide you step by step through everything you need.
          </Text>
          {LEARNING_PATHS.map((p) => {
            const overlap = getPathOverlapSummary(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => setActivePath(p.id)}
                style={({ pressed }) => [
                  s.pathCard,
                  { backgroundColor: colors.surface, borderColor: p.color + '55', opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[s.pathColorBar, { backgroundColor: p.color }]} />
                <View style={s.pathCardBody}>
                  <View style={s.pathCardTop}>
                    <View style={[s.certBadge, { backgroundColor: p.color + '20' }]}>
                      <Text style={[s.certCode, { color: p.color }]}>{p.certCode}</Text>
                    </View>
                    <View style={[s.diffBadge, { backgroundColor: colors.backgroundAlt }]}>
                      <Text style={[s.diffText, { color: colors.textSecondary }]}>{p.difficulty}</Text>
                    </View>
                    {overlap && (
                      <View style={[s.overlapPill, { backgroundColor: '#28C76F18', borderColor: '#28C76F44' }]}>
                        <Feather name="zap" size={10} color="#28C76F" />
                        <Text style={[s.overlapPillText, { color: '#28C76F' }]}>{overlap.pct}% known</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.pathName, { color: colors.text }]}>{p.certName}</Text>
                  <Text style={[s.pathTagline, { color: colors.textSecondary }]}>{p.tagline}</Text>
                  {overlap && (
                    <View style={[s.overlapBar, { backgroundColor: colors.backgroundAlt }]}>
                      <View style={[s.overlapFill, { width: `${overlap.pct}%` as any, backgroundColor: '#28C76F' }]} />
                    </View>
                  )}
                  {overlap && (
                    <Text style={[s.overlapHint, { color: colors.textSecondary }]}>
                      {overlap.covered > 0 ? `${overlap.covered} domain${overlap.covered > 1 ? 's' : ''} already covered` : ''}
                      {overlap.covered > 0 && overlap.partial > 0 ? ' · ' : ''}
                      {overlap.partial > 0 ? `${overlap.partial} partial` : ''}
                      {` · ${overlap.total - overlap.covered - overlap.partial} new`}
                    </Text>
                  )}
                  <View style={[s.pathMeta, overlap ? { marginTop: 4 } : {}]}>
                    <Feather name="list" size={13} color={colors.textSecondary} />
                    <Text style={[s.pathMetaText, { color: colors.textSecondary }]}>{p.steps.length} steps</Text>
                    <Feather name="clock" size={13} color={colors.textSecondary} />
                    <Text style={[s.pathMetaText, { color: colors.textSecondary }]}>{p.totalHours}h total</Text>
                  </View>
                </View>
                <Feather name="arrow-right" size={18} color={p.color} />
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const pct = path.steps.length > 0 ? Math.round((completedCount / path.steps.length) * 100) : 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text }]}>My Track</Text>
        <Pressable onPress={() => { useLearningPathStore.getState().clearActivePath(); }} hitSlop={8}>
          <Text style={[s.changeBtn, { color: path.color }]}>Change</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Track hero */}
        <View style={[s.hero, { backgroundColor: path.color + '12', borderColor: path.color + '33' }]}>
          <View style={[s.certBadgeLg, { backgroundColor: path.color + '20' }]}>
            <Text style={[s.certCodeLg, { color: path.color }]}>{path.certCode}</Text>
          </View>
          <Text style={[s.heroName, { color: colors.text }]}>{path.certName}</Text>
          <Text style={[s.heroTagline, { color: colors.textSecondary }]}>{path.tagline}</Text>

          {/* Progress bar */}
          <View style={s.progressRow}>
            <View style={[s.progressTrack, { backgroundColor: colors.backgroundAlt }]}>
              <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: path.color }]} />
            </View>
            <Text style={[s.progressPct, { color: path.color }]}>{pct}%</Text>
          </View>
          <Text style={[s.progressLabel, { color: colors.textSecondary }]}>
            {completedCount} of {path.steps.length} steps complete
          </Text>
        </View>

        {/* Cross-exam overlap panel — only shown when user has relevant prior study */}
        {activeOverlapDomains.length > 0 && (
          <View style={[s.overlapPanel, { backgroundColor: colors.surface, borderColor: '#28C76F44' }]}>
            <Pressable onPress={() => setOverlapExpanded((v) => !v)} style={s.overlapHeader} hitSlop={8}>
              <View style={s.overlapHeaderLeft}>
                <Feather name="zap" size={15} color="#28C76F" />
                <Text style={[s.overlapTitle, { color: colors.text }]}>
                  Study overlap detected
                </Text>
                <View style={[s.overlapCountBadge, { backgroundColor: '#28C76F20' }]}>
                  <Text style={[s.overlapCountText, { color: '#28C76F' }]}>
                    {activeOverlapDomains.length} domain{activeOverlapDomains.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <Feather name={overlapExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
            </Pressable>
            {!overlapExpanded && (
              <Text style={[s.overlapSubtitle, { color: colors.textSecondary }]}>
                You already know some of this exam's content — tap to see what to skip or skim.
              </Text>
            )}
            {overlapExpanded && activePathHints.map((hint, i) => (
              <View
                key={i}
                style={[
                  s.overlapRow,
                  i < activePathHints.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder },
                ]}
              >
                <View style={s.overlapRowLeft}>
                  <View style={[
                    s.overlapStatusDot,
                    {
                      backgroundColor:
                        hint.status === 'covered' ? '#28C76F' :
                        hint.status === 'partial' ? '#FF9F43' : colors.backgroundAlt,
                    },
                  ]} />
                  <View style={s.overlapRowText}>
                    <Text style={[s.overlapDomainName, { color: colors.text }]} numberOfLines={1}>
                      {hint.domainName}
                    </Text>
                    <Text style={[s.overlapDomainHint, { color: colors.textSecondary }]} numberOfLines={2}>
                      {hint.hint}
                    </Text>
                  </View>
                </View>
                <View style={[
                  s.overlapStatusBadge,
                  {
                    backgroundColor:
                      hint.status === 'covered' ? '#28C76F18' :
                      hint.status === 'partial' ? '#FF9F4318' : colors.backgroundAlt,
                  },
                ]}>
                  <Text style={[
                    s.overlapStatusText,
                    {
                      color:
                        hint.status === 'covered' ? '#28C76F' :
                        hint.status === 'partial' ? '#FF9F43' : colors.textSecondary,
                    },
                  ]}>
                    {hint.status === 'covered' ? 'skip' : hint.status === 'partial' ? 'review' : 'new'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Next step CTA */}
        {nextStep && (
          <Pressable
            onPress={() => handleStep(nextStep)}
            style={({ pressed }) => [
              s.nextStepBtn,
              { backgroundColor: path.color, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View style={s.nextStepLeft}>
              <Text style={s.nextStepEyebrow}>Up next</Text>
              <Text style={s.nextStepTitle} numberOfLines={1}>{nextStep.title}</Text>
              <Text style={s.nextStepSub}>{typeLabel(nextStep.type)} · {nextStep.estimatedMinutes} min</Text>
            </View>
            <Feather name="arrow-right-circle" size={28} color="#fff" />
          </Pressable>
        )}

        {completedCount === path.steps.length && (
          <View style={[s.completeBanner, { backgroundColor: colors.success + '18', borderColor: colors.success + '44' }]}>
            <Feather name="award" size={20} color={colors.success} />
            <Text style={[s.completeText, { color: colors.success }]}>
              All steps complete! You're ready for the {path.certCode} exam.
            </Text>
          </View>
        )}

        {/* Steps timeline */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Steps</Text>

        {path.steps.map((step, idx) => {
          const done = isStepDone(step);
          const isNext = nextStep?.id === step.id;
          return (
            <View key={step.id} style={s.stepRow}>
              {/* Connector line */}
              <View style={s.stepLeft}>
                <View style={[
                  s.stepDot,
                  {
                    backgroundColor: done ? path.color : isNext ? path.color + '33' : colors.backgroundAlt,
                    borderColor: done ? path.color : isNext ? path.color : colors.surfaceBorder,
                  },
                ]}>
                  {done
                    ? <Feather name="check" size={12} color="#fff" />
                    : <Text style={[s.stepNum, { color: isNext ? path.color : colors.textSecondary }]}>{idx + 1}</Text>
                  }
                </View>
                {idx < path.steps.length - 1 && (
                  <View style={[s.connector, { backgroundColor: done ? path.color + '55' : colors.surfaceBorder }]} />
                )}
              </View>

              {/* Step card */}
              <Pressable
                onPress={() => handleStep(step)}
                style={({ pressed }) => [
                  s.stepCard,
                  {
                    backgroundColor: isNext ? path.color + '10' : colors.surface,
                    borderColor: isNext ? path.color + '55' : colors.surfaceBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={[s.stepTypeIcon, { backgroundColor: done ? path.color + '18' : colors.backgroundAlt }]}>
                  <Feather name={typeIcon(step.type)} size={16} color={done ? path.color : colors.textSecondary} />
                </View>
                <View style={s.stepBody}>
                  <View style={s.stepTitleRow}>
                    <Text style={[s.stepTitle, { color: done ? colors.textSecondary : colors.text }]} numberOfLines={1}>
                      {step.title}
                    </Text>
                    <View style={[s.stepTypePill, { backgroundColor: colors.backgroundAlt }]}>
                      <Text style={[s.stepTypeText, { color: colors.textSecondary }]}>{typeLabel(step.type)}</Text>
                    </View>
                  </View>
                  <Text style={[s.stepSubtitle, { color: colors.textSecondary }]}>{step.subtitle}</Text>
                  {isNext && (
                    <Text style={[s.stepWhy, { color: path.color }]}>{step.why}</Text>
                  )}
                </View>
                {done
                  ? <Feather name="check-circle" size={18} color={path.color} />
                  : <Feather name="chevron-right" size={16} color={colors.textSecondary} />
                }
              </Pressable>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontFamily: F.bold, fontSize: 17 },
  changeBtn:  { fontFamily: F.semiBold, fontSize: 14 },

  // Selector
  selectorScroll: { padding: 20, gap: 14 },
  selectorHeadline: { fontFamily: F.bold, fontSize: 22, lineHeight: 30 },
  selectorSub:    { fontFamily: F.regular, fontSize: 14, lineHeight: 21, marginBottom: 8 },
  pathCard:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 18, overflow: 'hidden', paddingRight: 16 },
  pathColorBar:   { width: 5, alignSelf: 'stretch' },
  pathCardBody:   { flex: 1, padding: 16, gap: 6 },
  pathCardTop:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  certBadge:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  certCode:       { fontFamily: F.bold, fontSize: 12, letterSpacing: 0 },
  diffBadge:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  diffText:       { fontFamily: F.medium, fontSize: 11 },
  pathName:       { fontFamily: F.bold, fontSize: 16 },
  pathTagline:    { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  pathMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  pathMetaText:   { fontFamily: F.regular, fontSize: 12 },

  // Main path view
  scroll:     { padding: 16, gap: 16 },
  hero:       { borderWidth: 1.5, borderRadius: 20, padding: 20, gap: 10 },
  certBadgeLg: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  certCodeLg: { fontFamily: F.bold, fontSize: 13, letterSpacing: 0 },
  heroName:   { fontFamily: F.bold, fontSize: 20 },
  heroTagline: { fontFamily: F.regular, fontSize: 14, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  progressTrack: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999 },
  progressPct: { fontFamily: F.bold, fontSize: 14, width: 40, textAlign: 'right' },
  progressLabel: { fontFamily: F.regular, fontSize: 12 },

  nextStepBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, gap: 12 },
  nextStepLeft: { flex: 1, gap: 3 },
  nextStepEyebrow: { fontFamily: F.bold, fontSize: 11, color: 'rgba(255,255,255,0.72)', letterSpacing: 0 },
  nextStepTitle: { fontFamily: F.bold, fontSize: 16, color: '#fff' },
  nextStepSub: { fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  completeBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  completeText: { fontFamily: F.semiBold, fontSize: 13, flex: 1, lineHeight: 19 },

  // Selector overlap badge
  overlapPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  overlapPillText: { fontFamily: F.bold, fontSize: 10 },
  overlapBar:      { height: 4, borderRadius: 99, overflow: 'hidden', marginTop: 6 },
  overlapFill:     { height: 4, borderRadius: 99 },
  overlapHint:     { fontFamily: F.regular, fontSize: 11, lineHeight: 15, marginTop: 2 },

  // Active path overlap panel
  overlapPanel:      { borderWidth: 1.5, borderRadius: 16, overflow: 'hidden' },
  overlapHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  overlapHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  overlapTitle:      { fontFamily: F.semiBold, fontSize: 14 },
  overlapCountBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  overlapCountText:  { fontFamily: F.bold, fontSize: 11 },
  overlapSubtitle:   { fontFamily: F.regular, fontSize: 12, lineHeight: 17, paddingHorizontal: 14, paddingBottom: 14 },
  overlapRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  overlapRowLeft:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  overlapStatusDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  overlapRowText:    { flex: 1, gap: 2 },
  overlapDomainName: { fontFamily: F.semiBold, fontSize: 12 },
  overlapDomainHint: { fontFamily: F.regular, fontSize: 11, lineHeight: 15 },
  overlapStatusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  overlapStatusText:  { fontFamily: F.bold, fontSize: 10, letterSpacing: 0 },

  sectionLabel: { fontFamily: F.bold, fontSize: 13, letterSpacing: 0, marginTop: 4 },

  stepRow:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepLeft:  { alignItems: 'center', width: 28 },
  stepDot:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepNum:   { fontFamily: F.bold, fontSize: 11 },
  connector: { width: 2, flex: 1, minHeight: 20, marginVertical: 4 },
  stepCard:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  stepTypeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepBody:  { flex: 1, gap: 3 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepTitle: { fontFamily: F.semiBold, fontSize: 13, flex: 1 },
  stepTypePill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  stepTypeText: { fontFamily: F.medium, fontSize: 10 },
  stepSubtitle: { fontFamily: F.regular, fontSize: 12 },
  stepWhy:   { fontFamily: F.medium, fontSize: 11, lineHeight: 16, marginTop: 2 },
});
