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
      <View style={[styles.darkHeader, { borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{platformConfig.copy.resourcesTitle}</Text>
      </View>

      <View style={[styles.filterBar, { backgroundColor: platformConfig.colors.resourcesBackground }]}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>{platformConfig.copy.resourcesFilter}</Text>
          <Text style={styles.filterSecondary}>{EXPERIENCE_COPY.resources.secondaryFilter}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          {tags.map((tag) => {
            const active = tag === selectedTag;
            return (
              <Pressable key={tag} onPress={() => setSelectedTag(tag)} style={[styles.chip, { backgroundColor: active ? '#D7FEE7' : '#FFFFFF', borderColor: active ? '#00ED64' : '#D5DBE6' }]}>
                <Text style={[styles.chipText, { color: active ? '#04111F' : '#1E293B' }]}>{tag}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.articleScroll} showsVerticalScrollIndicator={false}>
        {visibleItems.map((item) => (
          <View key={item.id} style={styles.articleShell}>
            <View style={styles.articleCard}>
              <View style={[styles.articleTag, { backgroundColor: item.tagColor }]}>
                <Text style={styles.articleTagText}>{item.tag.toUpperCase()}</Text>
              </View>
              <Text style={styles.articleTitle}>{item.title}</Text>
              <Text style={styles.articleDescription}>{item.description}</Text>
              <Text style={styles.articleMeta}>DataCamp Team • January 2026</Text>
              <View style={styles.chapterList}>
                {item.chapters?.slice(0, 3).map((chapter) => (
                  <View key={`${item.id}-${chapter.time}`} style={styles.chapterRow}>
                    <Feather name="play-circle" size={14} color="#3A4B6E" />
                    <Text style={styles.chapterText}>{chapter.label}</Text>
                    <Text style={styles.chapterTime}>{chapter.time}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  darkHeader: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20, borderBottomWidth: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -0.9, textAlign: 'center' },
  filterBar: { paddingVertical: 14, gap: 12 },
  filterHeader: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontFamily: F.bold, fontSize: 17, color: '#10233D', letterSpacing: 1.6, textTransform: 'uppercase' },
  filterSecondary: { fontFamily: F.medium, fontSize: 17, color: '#10233D' },
  filterChips: { paddingHorizontal: 16, gap: 10 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontFamily: F.bold, fontSize: 12 },
  articleScroll: { backgroundColor: '#ECEFF4', paddingVertical: 18, paddingHorizontal: 16, gap: 18, paddingBottom: 40 },
  articleShell: { borderRadius: 18 },
  articleCard: { backgroundColor: '#FAFAFA', borderColor: '#D7D6CF', borderWidth: 1, borderRadius: 12, padding: 18, gap: 18 },
  articleTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  articleTagText: { color: '#04111F', fontFamily: F.bold, fontSize: 12 },
  articleTitle: { color: '#091433', fontFamily: F.bold, fontSize: 26, lineHeight: 34 },
  articleDescription: { color: '#6B7280', fontFamily: F.regular, fontSize: 16, lineHeight: 28 },
  articleMeta: { color: '#6B7280', fontFamily: F.medium, fontSize: 14 },
  chapterList: { gap: 10 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterText: { color: '#10233D', fontFamily: F.medium, fontSize: 14, flex: 1 },
  chapterTime: { color: '#64748B', fontFamily: F.semiBold, fontSize: 12 },
});
