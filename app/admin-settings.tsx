import { useMemo, useState } from 'react';
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
import { F } from '@/constants/Typography';

const PRESETS: AccentPreset[] = ['indigo', 'aurora', 'ocean', 'midnight', 'forest', 'sunset', 'amber', 'rose', 'emerald'];

export default function AdminSettingsScreen() {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const storedConfig = usePlatformConfigStore((s) => s.config);
  const setConfig = usePlatformConfigStore((s) => s.setConfig);
  const isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
  const [draft, setDraft] = useState(storedConfig);
  const [saving, setSaving] = useState(false);

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
});
