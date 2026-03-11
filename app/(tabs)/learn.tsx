import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { PLAYLIST } from '@/data/videos';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

export default function LearnScreen() {
  const colors = useThemeColors();
  const [selectedTag, setSelectedTag] = useState('ALL');
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const tags = ['ALL', ...Array.from(new Set(PLAYLIST.map((item) => item.tag.toUpperCase())))];
  const visibleItems = (selectedTag === 'ALL' ? PLAYLIST : PLAYLIST.filter((item) => item.tag.toUpperCase() === selectedTag)).slice(0, platformConfig.layout.resourcesArticleCount);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{platformConfig.copy.resourcesTitle}</Text>
      </View>

      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}>
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>{platformConfig.copy.resourcesFilter}</Text>
          <Text style={[styles.filterSecondary, { color: colors.textSecondary }]}>{EXPERIENCE_COPY.resources.secondaryFilter}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          {tags.map((tag) => {
            const active = tag === selectedTag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(tag)}
                style={[styles.chip, { backgroundColor: active ? colors.primaryLight : colors.backgroundAlt, borderColor: active ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.chipText, { color: active ? colors.primaryText : colors.text }]}>{tag}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.articleScroll, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {visibleItems.map((item) => (
          <View key={item.id} style={[styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.articleTag, { backgroundColor: item.tagColor + '22', borderColor: item.tagColor + '55', borderWidth: 1 }]}>
              <Text style={[styles.articleTagText, { color: item.tagColor }]}>{item.tag.toUpperCase()}</Text>
            </View>
            <Text style={[styles.articleTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.articleDescription, { color: colors.textSecondary }]}>{item.description}</Text>
            <Text style={[styles.articleMeta, { color: colors.textSecondary }]}>Katalyst Team • January 2026</Text>
            <View style={[styles.chapterList, { borderTopColor: colors.surfaceBorder, borderTopWidth: 1, paddingTop: 14 }]}>
              {item.chapters?.slice(0, 3).map((chapter) => (
                <View key={`${item.id}-${chapter.time}`} style={styles.chapterRow}>
                  <Feather name="play-circle" size={14} color={colors.primary} />
                  <Text style={[styles.chapterText, { color: colors.text }]}>{chapter.label}</Text>
                  <Text style={[styles.chapterTime, { color: colors.textSecondary }]}>{chapter.time}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20, borderBottomWidth: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.9, textAlign: 'center' },
  filterBar: { paddingVertical: 14, gap: 12 },
  filterHeader: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' },
  filterSecondary: { fontFamily: F.medium, fontSize: 13 },
  filterChips: { paddingHorizontal: 16, gap: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontFamily: F.bold, fontSize: 12 },
  articleScroll: { paddingVertical: 18, paddingHorizontal: 16, gap: 18, paddingBottom: 40 },
  articleCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  articleTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  articleTagText: { fontFamily: F.bold, fontSize: 12 },
  articleTitle: { fontFamily: F.bold, fontSize: 22, lineHeight: 30 },
  articleDescription: { fontFamily: F.regular, fontSize: 15, lineHeight: 26 },
  articleMeta: { fontFamily: F.medium, fontSize: 13 },
  chapterList: { gap: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterText: { fontFamily: F.medium, fontSize: 14, flex: 1 },
  chapterTime: { fontFamily: F.semiBold, fontSize: 12 },
});
