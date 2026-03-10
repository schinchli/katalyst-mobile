import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { PLAYLIST, type VideoItem } from '@/data/videos';
import { WebView } from 'react-native-webview';

// ─── Playlist data (mirrors web /dashboard/learn) ─────────────────────────────

// Playlist shared with Home previews via data/videos.ts

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const colors = useThemeColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const openVideo = (video: VideoItem) => setActiveVideo(video);
  const closeVideo = () => setActiveVideo(null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <Modal
        visible={!!activeVideo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeVideo}
      >
        <SafeAreaView style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Now Playing</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
                {activeVideo?.title}
              </Text>
            </View>
            <Pressable onPress={closeVideo} hitSlop={10} accessibilityRole="button">
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.playerWrap}>
            {activeVideo && (
              <WebView
                source={{ uri: `https://www.youtube.com/embed/${activeVideo.youtubeId}?playsinline=1&autoplay=1&modestbranding=1` }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Video Library</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
          AWS Generative AI — {PLAYLIST.length} videos
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {PLAYLIST.map((video, idx) => {
          const isExpanded = expandedId === video.id;
          return (
            <View
              key={video.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              {/* Accent bar */}
              <View style={[styles.cardAccent, { backgroundColor: video.tagColor }]} />

              <View style={styles.cardBody}>
                {/* Top row: thumbnail + info */}
                <View style={styles.cardTop}>
                  {/* Thumbnail */}
                  <Pressable
                    onPress={() => openVideo(video)}
                    style={({ pressed }) => [
                      styles.thumb,
                      { backgroundColor: '#0f172a', opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.thumbGradient, { backgroundColor: video.tagColor + '35' }]} />
                    <Feather name="play-circle" size={30} color={video.tagColor} style={styles.thumbIcon} />
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{video.duration}</Text>
                    </View>
                  </Pressable>

                  {/* Info */}
                  <View style={styles.cardInfo}>
                    <View style={[styles.tagBadge, { backgroundColor: video.tagColor + '18' }]}>
                      <Text style={[styles.tagText, { color: video.tagColor }]}>{video.tag}</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                      {video.title}
                    </Text>
                    <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                      {video.author} · {video.views} views
                    </Text>
                  </View>
                </View>

                {/* Description (expandable) */}
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : video.id)}
                  style={styles.expandRow}
                >
                  {isExpanded && (
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                      {video.description}
                    </Text>
                  )}
                  {video.chapters && video.chapters.length > 0 && isExpanded && (
                    <View style={[styles.chaptersBox, { borderTopColor: colors.surfaceBorder }]}>
                      <Text style={[styles.chaptersTitle, { color: colors.text }]}>
                        Chapters ({video.chapters.length})
                      </Text>
                      {video.chapters.map((ch, i) => (
                        <View key={i} style={styles.chapterRow}>
                          <View style={[styles.chapterNum, { backgroundColor: video.tagColor + '18' }]}>
                            <Text style={[styles.chapterNumText, { color: video.tagColor }]}>
                              {String(i + 1).padStart(2, '0')}
                            </Text>
                          </View>
                          <Text style={[styles.chapterLabel, { color: colors.text }]} numberOfLines={1}>
                            {ch.label}
                          </Text>
                          <Text style={[styles.chapterTime, { color: video.tagColor, backgroundColor: video.tagColor + '12' }]}>
                            {ch.time}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.expandToggle}>
                  <Text style={[styles.expandText, { color: colors.primary }]}>
                    {isExpanded ? 'Show less' : 'Show details'}
                  </Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>

                {/* Watch button */}
                <Pressable
                  onPress={() => openVideo(video)}
                  style={({ pressed }) => [
                    styles.watchBtn,
                    { backgroundColor: video.tagColor, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <Feather name="youtube" size={15} color="#fff" />
                  <Text style={styles.watchBtnText}>Play in app</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Videos sourced from official AWS channels
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 52, paddingHorizontal: 16, paddingTop: 16 },

  header: {
    paddingHorizontal: 20, paddingVertical: 17,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: F.bold,    fontSize: 22 },
  headerSub:   { fontFamily: F.regular, fontSize: 13, marginTop: 2 },

  modalRoot: { flex: 1 },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalLabel: { fontFamily: F.semiBold, fontSize: 12, letterSpacing: 0.2 },
  modalTitle: { fontFamily: F.bold, fontSize: 16, marginTop: 3 },
  playerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    paddingHorizontal: 12,
    paddingBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: { flex: 1 },

  card: {
    borderRadius: 14, borderWidth: 1, marginBottom: 14,
    overflow: 'hidden', flexDirection: 'row',
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 15, gap: 10 },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },

  thumb: {
    width: 96, height: 66, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  thumbGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.75 },
  thumbIcon: { zIndex: 2 },
  durationBadge: {
    position: 'absolute', bottom: 5, right: 6,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  durationText: { fontFamily: F.bold, fontSize: 10, color: '#fff' },

  cardInfo:  { flex: 1, gap: 5 },
  tagBadge:  { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  tagText:   { fontFamily: F.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardTitle: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  cardMeta:  { fontFamily: F.regular,  fontSize: 11 },

  expandRow:   { gap: 9 },
  description: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },

  chaptersBox: { borderTopWidth: 1, paddingTop: 11, gap: 7 },
  chaptersTitle: { fontFamily: F.semiBold, fontSize: 13, marginBottom: 2 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterNum: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chapterNumText: { fontFamily: F.bold, fontSize: 11 },
  chapterLabel: { fontFamily: F.regular, fontSize: 13, flex: 1 },
  chapterTime: { fontFamily: F.semiBold, fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  expandToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandText:   { fontFamily: F.semiBold, fontSize: 13 },

  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 42, paddingVertical: 9, borderRadius: 10,
  },
  watchBtnText: { fontFamily: F.semiBold, fontSize: 13, color: '#fff' },

  footer: {
    fontFamily: F.regular, fontSize: 12,
    textAlign: 'center', marginTop: 8,
  },
});
