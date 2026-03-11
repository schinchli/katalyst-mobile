import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { flashcards, type FlashcardCategory } from '@/data/flashcards';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { F } from '@/constants/Typography';

const FILTERS: { key: FlashcardCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All packs' },
  { key: 'aws-practitioner', label: 'AWS' },
  { key: 'genai-practitioner', label: 'GenAI' },
];

export default function FlashcardsScreen() {
  const colors = useThemeColors();
  const { category } = useLocalSearchParams<{ category?: FlashcardCategory }>();
  const [filter, setFilter] = useState<FlashcardCategory | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (category === 'aws-practitioner' || category === 'genai-practitioner') {
      setFilter(category);
      setIndex(0);
      setFlipped(false);
    }
  }, [category]);

  const items = useMemo(() => {
    const next = filter === 'all' ? flashcards : flashcards.filter((item) => item.category === filter);
    return next;
  }, [filter]);

  const active = items[Math.min(index, Math.max(0, items.length - 1))];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Flashcards</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review concepts with the same dark theme and uniform controls as the quiz flow.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((item) => {
            const activeFilter = item.key === filter;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  setFilter(item.key);
                  setIndex(0);
                  setFlipped(false);
                }}
                style={[styles.filterChip, { backgroundColor: activeFilter ? colors.primary : colors.surface, borderColor: activeFilter ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.filterChipText, { color: activeFilter ? '#04111F' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.progressShell, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ProgressBar progress={items.length ? (index + 1) / items.length : 0} height={6} />
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>{items.length ? `${index + 1} / ${items.length}` : '0 / 0'}</Text>
        </View>

        {active ? (
          <Pressable onPress={() => setFlipped((value) => !value)} style={[styles.card, { backgroundColor: colors.surface, borderColor: flipped ? colors.primary : colors.surfaceBorder, shadowColor: flipped ? colors.primary : '#000' }]}>
            <View style={[styles.cardStrip, { backgroundColor: flipped ? colors.primary : colors.gradientAccent }]} />
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: flipped ? colors.primary : colors.textSecondary }]}>{flipped ? 'ANSWER' : 'QUESTION'}</Text>
              <View style={[styles.tagPill, { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.tagPillText, { color: colors.text }]}>{active.tag ?? 'Concept'}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardMain, { color: colors.text }]}>{flipped ? active.back : active.front}</Text>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
              <Feather name="rotate-cw" size={14} color={colors.textSecondary} />
              <Text style={[styles.cardFooterText, { color: colors.textSecondary }]}>{flipped ? 'Tap to see the question again' : 'Tap to reveal the answer'}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No flashcards available for this pack.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder }]}>
        <Button
          title="Previous"
          variant="outline"
          size="lg"
          disabled={index === 0}
          onPress={() => {
            setIndex((value) => Math.max(0, value - 1));
            setFlipped(false);
          }}
          style={{ flex: 1 }}
        />
        <Button
          title={index < items.length - 1 ? 'Next' : 'Done'}
          size="lg"
          onPress={() => {
            if (index < items.length - 1) {
              setIndex((value) => value + 1);
              setFlipped(false);
            } else {
              router.back();
            }
          }}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontFamily: F.medium, fontSize: 15 },
  title: { fontFamily: F.bold, fontSize: 18 },
  content: { padding: 16, paddingBottom: 140, gap: 18 },
  subtitle: { fontFamily: F.regular, fontSize: 15, lineHeight: 24 },
  filterRow: { gap: 10, paddingRight: 12 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  filterChipText: { fontFamily: F.semiBold, fontSize: 13 },
  progressShell: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  progressText: { fontFamily: F.semiBold, fontSize: 12, textAlign: 'right' },
  card: { minHeight: 420, borderWidth: 1.2, borderRadius: 24, overflow: 'hidden', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  cardStrip: { height: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, gap: 12 },
  cardLabel: { fontFamily: F.bold, fontSize: 12, letterSpacing: 1.2 },
  tagPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  tagPillText: { fontFamily: F.semiBold, fontSize: 12 },
  cardBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  cardMain: { fontFamily: F.bold, fontSize: 24, lineHeight: 38, textAlign: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderTopWidth: 1, paddingHorizontal: 18, paddingVertical: 14 },
  cardFooterText: { fontFamily: F.medium, fontSize: 13 },
  emptyCard: { minHeight: 220, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontFamily: F.medium, fontSize: 15, textAlign: 'center' },
  bottomNav: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
});
