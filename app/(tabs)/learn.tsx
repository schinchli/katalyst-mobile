import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { F } from '@/constants/Typography';
import { PLAYLIST } from '@/data/videos';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

export default function LearnScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const [selectedTag, setSelectedTag] = useState('ALL');
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const tags = ['ALL', ...Array.from(new Set(PLAYLIST.map((item) => item.tag.toUpperCase())))];
  const visibleItems = (selectedTag === 'ALL' ? PLAYLIST : PLAYLIST.filter((item) => item.tag.toUpperCase() === selectedTag)).slice(0, platformConfig.layout.resourcesArticleCount);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: t.screenTitle }]}>{platformConfig.copy.resourcesTitle}</Text>
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
          <Pressable
            key={item.id}
            onPress={() => Linking.openURL(`https://youtu.be/${item.youtubeId}`)}
            style={({ pressed }) => [styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.articleTag, { backgroundColor: item.tagColor + '22', borderColor: item.tagColor + '55', borderWidth: 1 }]}>
              <Text style={[styles.articleTagText, { color: item.tagColor }]}>{item.tag.toUpperCase()}</Text>
            </View>
            <Text style={[styles.articleTitle, { color: colors.text, fontSize: t.sectionTitle }]}>{item.title}</Text>
            <Text style={[styles.articleDescription, { color: colors.textSecondary, fontSize: t.body }]}>{item.description}</Text>
            <Text style={[styles.articleMeta, { color: colors.textSecondary, fontSize: t.caption }]}>Katalyst Team • January 2026</Text>
            <View style={[styles.chapterList, { borderTopColor: colors.surfaceBorder, borderTopWidth: 1, paddingTop: 14 }]}>
              {item.chapters?.slice(0, 3).map((chapter) => {
                const seconds = chapter.time.split(':').reduce((acc, t) => acc * 60 + parseInt(t, 10), 0);
                return (
                  <Pressable
                    key={`${item.id}-${chapter.time}`}
                    onPress={(e) => { e.stopPropagation?.(); Linking.openURL(`https://youtu.be/${item.youtubeId}?t=${seconds}`); }}
                    style={styles.chapterRow}
                  >
                    <Feather name="play-circle" size={14} color={colors.primary} />
                    <Text style={[styles.chapterText, { color: colors.text, fontSize: t.caption }]}>{chapter.label}</Text>
                    <Text style={[styles.chapterTime, { color: colors.textSecondary, fontSize: t.micro }]}>{chapter.time}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, textAlign: 'center' },
  filterBar: { paddingVertical: 10, gap: 8 },
  filterHeader: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  filterSecondary: { fontFamily: F.medium, fontSize: 11 },
  filterChips: { paddingHorizontal: 16, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontFamily: F.bold, fontSize: 11 },
  articleScroll: { paddingVertical: 14, paddingHorizontal: 16, gap: 14, paddingBottom: 36 },
  articleCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  articleTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  articleTagText: { fontFamily: F.bold, fontSize: 11 },
  articleTitle: { fontFamily: F.bold, fontSize: 17, lineHeight: 24 },
  articleDescription: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 },
  articleMeta: { fontFamily: F.medium, fontSize: 12 },
  chapterList: { gap: 8 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chapterText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  chapterTime: { fontFamily: F.semiBold, fontSize: 11 },
});
