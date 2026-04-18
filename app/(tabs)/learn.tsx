import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { F } from '@/constants/Typography';
import { PLAYLIST } from '@/data/videos';
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import {
  fetchArticles,
  articleWebUrl,
  type ArticleSummary,
  type ArticleProvider,
} from '@/services/articlesService';

type Tab = 'VIDEOS' | 'ARTICLES';

type ProviderFilter = ArticleProvider | 'ALL' | 'Data & AI';

const PROVIDER_CHIPS: ProviderFilter[] = [
  'ALL', 'AWS', 'GCP', 'Azure', 'Oracle', 'Databricks', 'Snowflake', 'Data & AI',
];

const PROVIDER_COLORS: Record<string, string> = {
  AWS:        '#FF9900',
  GCP:        '#4285F4',
  Azure:      '#0078D4',
  Oracle:     '#F80000',
  Databricks: '#FF3621',
  Snowflake:  '#29B5E8',
  'Data & AI':'#7C3AED',
  General:    '#6B7280',
};

export default function LearnScreen() {
  const colors       = useThemeColors();
  const t            = useTypography();
  const platformConfig = usePlatformConfigStore((s) => s.config);

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('VIDEOS');

  // ── Videos state ─────────────────────────────────────────────────────────────
  const [videoTag, setVideoTag] = useState('ALL');
  const videoTags = ['ALL', ...Array.from(new Set(PLAYLIST.map((item) => item.tag.toUpperCase())))];
  const visibleVideos = (videoTag === 'ALL' ? PLAYLIST : PLAYLIST.filter((item) => item.tag.toUpperCase() === videoTag))
    .slice(0, platformConfig.layout.resourcesArticleCount);

  // ── Articles state ───────────────────────────────────────────────────────────
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('ALL');
  const [sortOrg, setSortOrg]               = useState(false);
  const [articles, setArticles]             = useState<ArticleSummary[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  const loadArticles = useCallback(async () => {
    setArticlesLoading(true);
    const data = await fetchArticles({
      provider: providerFilter === 'ALL' ? undefined : providerFilter,
      sort:     sortOrg ? 'organisation' : 'date',
    });
    setArticles(data);
    setArticlesLoading(false);
  }, [providerFilter, sortOrg]);

  useEffect(() => {
    if (activeTab === 'ARTICLES') loadArticles();
  }, [activeTab, loadArticles]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: t.screenTitle }]}>
          {platformConfig.copy.resourcesTitle}
        </Text>
      </View>

      {/* ── Tab Switcher ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {(['VIDEOS', 'ARTICLES'] as Tab[]).map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.textSecondary, fontFamily: active ? F.bold : F.medium }]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'VIDEOS' ? (
        /* ── Videos Tab ── */
        <>
          <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>{platformConfig.copy.resourcesFilter}</Text>
              <Text style={[styles.filterSecondary, { color: colors.textSecondary }]}>{EXPERIENCE_COPY.resources.secondaryFilter}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {videoTags.map((tag) => {
                const active = tag === videoTag;
                return (
                  <Pressable
                    key={tag}
                    onPress={() => setVideoTag(tag)}
                    style={[styles.chip, { backgroundColor: active ? colors.primaryLight : colors.backgroundAlt, borderColor: active ? colors.primary : colors.surfaceBorder }]}
                  >
                    <Text style={[styles.chipText, { color: active ? colors.primaryText : colors.text }]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={[styles.articleScroll, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
            {visibleVideos.map((item) => (
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
                <Text style={[styles.articleMeta, { color: colors.textSecondary, fontSize: t.caption }]}>LearnKloud Team • January 2026</Text>
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
        </>
      ) : (
        /* ── Articles Tab ── */
        <>
          {/* Provider chips + sort toggle */}
          <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: colors.textSecondary }]}>CLOUD PROVIDER</Text>
              <Pressable
                onPress={() => setSortOrg((v) => !v)}
                style={[styles.sortBtn, { backgroundColor: sortOrg ? colors.primaryLight : colors.backgroundAlt, borderColor: sortOrg ? colors.primary : colors.surfaceBorder }]}
              >
                <Feather name="layers" size={11} color={sortOrg ? colors.primary : colors.textSecondary} />
                <Text style={[styles.sortBtnText, { color: sortOrg ? colors.primary : colors.textSecondary }]}>By org</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              {PROVIDER_CHIPS.map((chip) => {
                const active = chip === providerFilter;
                const accent = PROVIDER_COLORS[chip === 'ALL' ? 'General' : chip] ?? colors.primary;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => setProviderFilter(chip)}
                    style={[styles.chip, {
                      backgroundColor: active ? accent + '22' : colors.backgroundAlt,
                      borderColor:     active ? accent        : colors.surfaceBorder,
                    }]}
                  >
                    <Text style={[styles.chipText, { color: active ? accent : colors.text }]}>{chip}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={[styles.articleScroll, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
          >
            {articlesLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
            ) : articles.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="file-text" size={36} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No articles yet</Text>
              </View>
            ) : (
              articles.map((article) => (
                <ArticleCard key={article._id} article={article} colors={colors} t={t} />
              ))
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

// ── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({
  article,
  colors,
  t,
}: {
  article: ArticleSummary;
  colors: ReturnType<typeof useThemeColors>;
  t: ReturnType<typeof useTypography>;
}) {
  const accent = PROVIDER_COLORS[article.provider] ?? colors.primary;

  return (
    <Pressable
      onPress={() => Linking.openURL(articleWebUrl(article.slug))}
      style={({ pressed }) => [styles.articleCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.articleCardHeader}>
        <View style={[styles.articleTag, { backgroundColor: accent + '22', borderColor: accent + '55', borderWidth: 1 }]}>
          <Text style={[styles.articleTagText, { color: accent }]}>{article.provider}</Text>
        </View>
        {article.accessTier === 'premium' && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.warning + '22' }]}>
            <Feather name="lock" size={10} color={colors.warning} />
            <Text style={[styles.premiumText, { color: colors.warning }]}>Premium</Text>
          </View>
        )}
      </View>

      <Text style={[styles.articleTitle, { color: colors.text, fontSize: t.sectionTitle }]} numberOfLines={2}>
        {article.title}
      </Text>

      {article.excerpt ? (
        <Text style={[styles.articleDescription, { color: colors.textSecondary, fontSize: t.body }]} numberOfLines={3}>
          {article.excerpt}
        </Text>
      ) : null}

      <View style={styles.articleFooter}>
        <Text style={[styles.articleMeta, { color: colors.textSecondary, fontSize: t.caption }]}>
          {article.organisation}
          {article.readTime ? ` • ${article.readTime}` : ''}
        </Text>
        <Feather name="external-link" size={13} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5, textAlign: 'center' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, letterSpacing: 0.4 },

  filterBar: { paddingVertical: 10, gap: 8 },
  filterHeader: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontFamily: F.bold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
  filterSecondary: { fontFamily: F.medium, fontSize: 11 },
  filterChips: { paddingHorizontal: 16, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontFamily: F.bold, fontSize: 11 },

  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  sortBtnText: { fontFamily: F.bold, fontSize: 11 },

  articleScroll: { paddingVertical: 14, paddingHorizontal: 16, gap: 14, paddingBottom: 36 },
  articleCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  articleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  articleTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  articleTagText: { fontFamily: F.bold, fontSize: 11 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  premiumText: { fontFamily: F.bold, fontSize: 10 },
  articleTitle: { fontFamily: F.bold, fontSize: 17, lineHeight: 24 },
  articleDescription: { fontFamily: F.regular, fontSize: 14, lineHeight: 21 },
  articleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  articleMeta: { fontFamily: F.medium, fontSize: 12 },
  chapterList: { gap: 8 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chapterText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  chapterTime: { fontFamily: F.semiBold, fontSize: 11 },

  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: F.medium, fontSize: 14 },
});
