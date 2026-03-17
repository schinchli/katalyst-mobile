import { useMemo, useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { savePlatformConfigAsAdmin } from '@/services/platformConfigService';
import { ACCENT_PRESETS, type AccentPreset } from '@/stores/themeStore';
import { quizzes } from '@/data/quizzes';
import { supabase } from '@/config/supabase';
import { QUIZ_CATALOG_OVERRIDES_KEY } from '@/config/quizCatalog';
import { F } from '@/constants/Typography';

type QuizEntry = { isPremium: boolean; price: number; enabled: boolean };
type QuestionReport = {
  id: string;
  quizId: string;
  questionId: string;
  questionText: string;
  reason: string;
  reportedAt: string;
};

const PRESETS: AccentPreset[] = ['indigo', 'aurora', 'ocean', 'midnight', 'forest', 'sunset', 'amber', 'rose', 'emerald'];

export default function AdminSettingsScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const storedConfig = usePlatformConfigStore((s) => s.config);
  const setConfig = usePlatformConfigStore((s) => s.setConfig);
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
  const [draft, setDraft] = useState(storedConfig);
  const [saving, setSaving] = useState(false);

  // ── Quiz catalog CRUD state ──────────────────────────────────────────────
  const [quizCatalog, setQuizCatalog] = useState<Record<string, QuizEntry>>(() =>
    Object.fromEntries(
      quizzes.map((q) => [q.id, { isPremium: q.isPremium ?? false, price: q.price ?? 149, enabled: true }])
    )
  );
  const [quizSaving, setQuizSaving] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  // ── Question reports ─────────────────────────────────────────────────────
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setReportsLoading(true);
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'question_reports')
      .single()
      .then(({ data }) => {
        setReports(Array.isArray(data?.value) ? (data.value as QuestionReport[]) : []);
      })
      .then(() => setReportsLoading(false), () => setReportsLoading(false));
  }, [isAdmin]);

  const handleSaveQuizCatalog = async () => {
    setQuizSaving(true);
    try {
      const overrides = Object.fromEntries(
        Object.entries(quizCatalog).map(([id, val]) => [
          id,
          { isPremium: val.isPremium, enabled: val.enabled, ...(val.isPremium ? { price: val.price } : {}) },
        ])
      );
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: QUIZ_CATALOG_OVERRIDES_KEY, value: overrides }, { onConflict: 'key' });
      if (error) throw error;
      Alert.alert('Saved', 'Quiz catalog updated for all users.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unable to save quiz catalog.');
    } finally {
      setQuizSaving(false);
    }
  };

  const updateQuiz = (id: string, patch: Partial<QuizEntry>) =>
    setQuizCatalog((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const sections = useMemo(() => [
    { label: 'Auth headline', key: 'authHeadline' as const },
    { label: 'Auth subheadline', key: 'authSubheadline' as const },
    { label: 'Home hero title', key: 'homeHeroTitle' as const },
    { label: 'Home hero subtitle', key: 'homeHeroSubtitle' as const },
    { label: 'Premium headline', key: 'premiumHeadline' as const },
    { label: 'Premium subheadline', key: 'premiumSubheadline' as const },
    { label: 'Profile offer title', key: 'profileOfferTitle' as const },
    { label: 'Profile offer subtitle', key: 'profileOfferSubtitle' as const },
    { label: 'Resources title', key: 'resourcesTitle' as const },
    { label: 'Resources filter', key: 'resourcesFilter' as const },
  ], []);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.denied}>
          <Text style={[styles.deniedTitle, { color: colors.text }]}>Admin access required</Text>
          <Button title="Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backRow}>
            <Feather name="arrow-left" size={20} color={colors.text} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Profile</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Admin mobile settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Platform-level text, colors, layout, and default accent for all users.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Copy</Text>
          {sections.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              value={draft.copy[field.key]}
              onChangeText={(value) => setDraft((current) => ({ ...current, copy: { ...current.copy, [field.key]: value } }))}
            />
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Screen colors</Text>
          <Input label="Home hero course card background" value={draft.colors.homeHeroCourseBg} onChangeText={(value) => setDraft((current) => ({ ...current, colors: { ...current.colors, homeHeroCourseBg: value } }))} />
          <Input label="Premium accent color" value={draft.colors.premiumAccent} onChangeText={(value) => setDraft((current) => ({ ...current, colors: { ...current.colors, premiumAccent: value } }))} />
          <Input label="Resources background color" value={draft.colors.resourcesBackground} onChangeText={(value) => setDraft((current) => ({ ...current, colors: { ...current.colors, resourcesBackground: value } }))} />
          <Input label="Profile offer accent color" value={draft.colors.profileOfferAccent} onChangeText={(value) => setDraft((current) => ({ ...current, colors: { ...current.colors, profileOfferAccent: value } }))} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Layout</Text>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Home actions style</Text>
          <View style={styles.choiceRow}>
            {(['grid', 'stack'] as const).map((value) => (
              <Pressable key={value} onPress={() => setDraft((current) => ({ ...current, layout: { ...current.layout, homeActionsStyle: value } }))} style={[styles.choice, { borderColor: draft.layout.homeActionsStyle === value ? colors.primary : colors.surfaceBorder, backgroundColor: draft.layout.homeActionsStyle === value ? colors.primaryLight : colors.background }]}>
                <Text style={[styles.choiceText, { color: colors.text }]}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Course card columns</Text>
          <View style={styles.choiceRow}>
            {[1, 2].map((value) => (
              <Pressable key={value} onPress={() => setDraft((current) => ({ ...current, layout: { ...current.layout, courseCardColumns: value as 1 | 2 } }))} style={[styles.choice, { borderColor: draft.layout.courseCardColumns === value ? colors.primary : colors.surfaceBorder, backgroundColor: draft.layout.courseCardColumns === value ? colors.primaryLight : colors.background }]}>
                <Text style={[styles.choiceText, { color: colors.text }]}>{value} col</Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Resources article count"
            value={String(draft.layout.resourcesArticleCount)}
            keyboardType="number-pad"
            onChangeText={(value) =>
              setDraft((current) => ({
                ...current,
                layout: {
                  ...current.layout,
                  resourcesArticleCount: Math.max(1, Number.parseInt(value || '1', 10) || 1),
                },
              }))
            }
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Home widgets</Text>
          {[
            ['showHomeStats', 'Show top stats'],
            ['showHomeActions', 'Show quick actions'],
            ['showPopularCourses', 'Show popular courses'],
            ['showFlashcards', 'Show flashcard packs'],
            ['showGrowthWidget', 'Show growth snapshot'],
            ['showDiscountBanner', '🏷️ Show "Save 50%" discount badge'],
          ].map(([key, label]) => {
            const typedKey = key as keyof typeof draft.widgets;
            const enabled = draft.widgets[typedKey];
            return (
              <Pressable
                key={key}
                onPress={() => setDraft((current) => ({ ...current, widgets: { ...current.widgets, [typedKey]: !current.widgets[typedKey] } }))}
                style={[styles.toggleRow, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
                <View style={[styles.toggleTrack, { backgroundColor: enabled ? colors.primary : colors.surfaceBorder }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: enabled ? 18 : 2 }] }]} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform theme</Text>
          <View style={styles.swatchGrid}>
            {PRESETS.map((preset) => {
              const item = ACCENT_PRESETS[preset];
              const active = draft.theme.platformAccent === preset;
              return (
                <Pressable key={preset} onPress={() => setDraft((current) => ({ ...current, theme: { ...current.theme, platformAccent: preset } }))} style={[styles.swatchCard, { borderColor: active ? item.primary : colors.surfaceBorder, backgroundColor: active ? colors.primaryLight : colors.background }]}>
                  <View style={[styles.swatchBubble, { backgroundColor: item.primary }]} />
                  <Text style={[styles.swatchLabel, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Quiz Catalog CRUD ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.catalogHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quiz Catalog</Text>
              <Text style={[styles.catalogSubtitle, { color: colors.textSecondary }]}>
                {quizzes.length} quizzes · tap row to edit
              </Text>
            </View>
            <View style={[styles.catalogBadge, { backgroundColor: colors.primaryLight }]}>
              <Feather name="layers" size={14} color={colors.primary} />
              <Text style={[styles.catalogBadgeText, { color: colors.primary }]}>CRUD</Text>
            </View>
          </View>

          {quizzes.map((quiz) => {
            const entry = quizCatalog[quiz.id];
            const isExpanded = expandedQuiz === quiz.id;
            return (
              <View key={quiz.id} style={[styles.quizRow, {
                borderColor: isExpanded ? colors.primary : colors.surfaceBorder,
                backgroundColor: isExpanded ? colors.primaryLight + '30' : 'transparent',
              }]}>
                {/* Row header — always visible */}
                <Pressable
                  onPress={() => setExpandedQuiz(isExpanded ? null : quiz.id)}
                  style={styles.quizRowHeader}
                >
                  <View style={[styles.quizIconWrap, { backgroundColor: entry.enabled ? colors.primaryLight : colors.surfaceBorder }]}>
                    <Feather name={quiz.icon as any} size={15} color={entry.enabled ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quizTitle, { color: entry.enabled ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                      {quiz.title}
                    </Text>
                    <Text style={[styles.quizMeta, { color: colors.textSecondary }]}>
                      {entry.isPremium ? `₹${entry.price}/mo` : 'Free'} · {quiz.category}
                    </Text>
                  </View>
                  <View style={styles.quizRowBadges}>
                    {entry.isPremium && (
                      <View style={[styles.premiumChip, { backgroundColor: colors.warning + '22' }]}>
                        <Text style={[styles.premiumChipText, { color: colors.warning }]}>PRO</Text>
                      </View>
                    )}
                    {!entry.enabled && (
                      <View style={[styles.disabledChip, { backgroundColor: colors.error + '22' }]}>
                        <Text style={[styles.disabledChipText, { color: colors.error }]}>OFF</Text>
                      </View>
                    )}
                    <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>

                {/* Expanded edit area */}
                {isExpanded && (
                  <View style={[styles.quizEditArea, { borderTopColor: colors.surfaceBorder }]}>
                    {/* Enable/disable toggle */}
                    <Pressable
                      onPress={() => updateQuiz(quiz.id, { enabled: !entry.enabled })}
                      style={[styles.toggleRow, { borderColor: colors.surfaceBorder }]}
                    >
                      <Feather name="eye" size={15} color={colors.textSecondary} />
                      <Text style={[styles.toggleLabel, { color: colors.text, marginLeft: 8 }]}>Visible in app</Text>
                      <View style={[styles.toggleTrack, { backgroundColor: entry.enabled ? colors.primary : colors.surfaceBorder }]}>
                        <View style={[styles.toggleThumb, { transform: [{ translateX: entry.enabled ? 18 : 2 }] }]} />
                      </View>
                    </Pressable>

                    {/* Premium toggle */}
                    <Pressable
                      onPress={() => updateQuiz(quiz.id, { isPremium: !entry.isPremium })}
                      style={[styles.toggleRow, { borderColor: colors.surfaceBorder }]}
                    >
                      <Feather name="lock" size={15} color={colors.textSecondary} />
                      <Text style={[styles.toggleLabel, { color: colors.text, marginLeft: 8 }]}>Premium (paid)</Text>
                      <View style={[styles.toggleTrack, { backgroundColor: entry.isPremium ? colors.warning : colors.surfaceBorder }]}>
                        <View style={[styles.toggleThumb, { transform: [{ translateX: entry.isPremium ? 18 : 2 }] }]} />
                      </View>
                    </Pressable>

                    {/* Price — only when premium */}
                    {entry.isPremium && (
                      <Input
                        label="Price (₹)"
                        value={String(entry.price)}
                        keyboardType="number-pad"
                        onChangeText={(v) => updateQuiz(quiz.id, { price: Math.max(1, parseInt(v || '149', 10) || 149) })}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}

          <Button title="Save quiz catalog" loading={quizSaving} onPress={handleSaveQuizCatalog} />
        </View>

        {/* ── Question Reports ── */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.catalogHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Question Reports</Text>
              <Text style={[styles.catalogSubtitle, { color: colors.textSecondary }]}>
                {reportsLoading ? 'Loading…' : `${reports.length} report${reports.length !== 1 ? 's' : ''} submitted`}
              </Text>
            </View>
            <View style={[styles.catalogBadge, { backgroundColor: colors.error + '22' }]}>
              <Feather name="flag" size={14} color={colors.error} />
              <Text style={[styles.catalogBadgeText, { color: colors.error }]}>USER</Text>
            </View>
          </View>

          {reports.length === 0 && !reportsLoading ? (
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>No reports yet.</Text>
          ) : (
            [...reports].reverse().map((report) => (
              <View key={report.id} style={[styles.reportItem, { borderColor: colors.surfaceBorder }]}>
                <View style={styles.reportItemHeader}>
                  <View style={[styles.reportReasonChip, { backgroundColor: colors.error + '22' }]}>
                    <Text style={[styles.reportReasonText, { color: colors.error }]}>{report.reason}</Text>
                  </View>
                  <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.reportQuestionText, { color: colors.text }]} numberOfLines={2}>
                  {report.questionText || '(no text)'}
                </Text>
                <Text style={[styles.reportMeta, { color: colors.textSecondary }]}>
                  Quiz: {report.quizId}
                </Text>
              </View>
            ))
          )}
        </View>

        <Button
          title="Save platform settings"
          loading={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await savePlatformConfigAsAdmin(draft);
              setConfig(draft);
              Alert.alert('Saved', 'Mobile platform settings updated.');
            } catch (error) {
              Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save mobile config.');
            } finally {
              setSaving(false);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  deniedTitle: { fontFamily: F.bold, fontSize: 24 },
  header: { gap: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontFamily: F.medium, fontSize: 14 },
  title: { fontFamily: F.bold, fontSize: 30, lineHeight: 36 },
  subtitle: { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 14 },
  sectionTitle: { fontFamily: F.bold, fontSize: 18 },
  fieldLabel: { fontFamily: F.semiBold, fontSize: 13 },
  choiceRow: { flexDirection: 'row', gap: 10 },
  choice: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  choiceText: { fontFamily: F.medium, fontSize: 14, textTransform: 'capitalize' },
  toggleRow: { minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontFamily: F.medium, fontSize: 14, flex: 1, marginRight: 12 },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchCard: { width: '31%', borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 8 },
  swatchBubble: { width: 30, height: 30, borderRadius: 15 },
  swatchLabel: { fontFamily: F.medium, fontSize: 11, textAlign: 'center' },

  // ── Quiz catalog ──
  catalogHeader:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  catalogSubtitle:   { fontFamily: F.regular, fontSize: 12, marginTop: 2 },
  catalogBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  catalogBadgeText:  { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.6 },
  quizRow:           { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  quizRowHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  quizIconWrap:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  quizTitle:         { fontFamily: F.semiBold, fontSize: 13, lineHeight: 18 },
  quizMeta:          { fontFamily: F.regular, fontSize: 11, marginTop: 1 },
  quizRowBadges:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumChip:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  premiumChipText:   { fontFamily: F.bold, fontSize: 9, letterSpacing: 0.4 },
  disabledChip:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  disabledChipText:  { fontFamily: F.bold, fontSize: 9, letterSpacing: 0.4 },
  quizEditArea:      { borderTopWidth: 1, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4, gap: 6 },

  // ── Question reports ──
  reportItem:        { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  reportItemHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reportReasonChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  reportReasonText:  { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.3 },
  reportDate:        { fontFamily: F.regular, fontSize: 11 },
  reportQuestionText:{ fontFamily: F.medium, fontSize: 13, lineHeight: 18 },
  reportMeta:        { fontFamily: F.regular, fontSize: 11 },
});
