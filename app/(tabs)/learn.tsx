import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

// ─── Playlist data (mirrors web /dashboard/learn) ─────────────────────────────

interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  duration: string;
  views: string;
  tag: string;
  tagColor: string;
  description: string;
  chapters?: { time: string; label: string }[];
}

const PLAYLIST: VideoItem[] = [
  {
    id: 'bedrock-intro',
    youtubeId: 'BY4YlxhSKr8',
    title: "A Beginner's Guide to Amazon Bedrock",
    author: 'AWS Official',
    duration: '22:14',
    views: '84k',
    tag: 'Bedrock',
    tagColor: '#7367F0',
    description:
      "A comprehensive beginner's guide to Amazon Bedrock — covers Knowledge Bases, Guardrails, and Security best practices for enterprise deployments.",
    chapters: [
      { time: '0:00',  label: 'Introduction to Amazon Bedrock' },
      { time: '3:45',  label: 'Foundation Models Overview' },
      { time: '7:20',  label: 'Amazon Bedrock Knowledge Bases' },
      { time: '12:10', label: 'Guardrails for Amazon Bedrock' },
      { time: '17:30', label: 'Security & IAM Best Practices' },
      { time: '20:45', label: 'Next Steps & Resources' },
    ],
  },
  {
    id: 'rag-bedrock',
    youtubeId: 'N0tlOXZwrSs',
    title: 'Building RAG Applications with Amazon Bedrock',
    author: 'AWS Developers',
    duration: '18:32',
    views: '52k',
    tag: 'RAG',
    tagColor: '#00BAD1',
    description:
      'Learn how to build RAG pipelines using Amazon Bedrock Knowledge Bases, OpenSearch Serverless, and Claude foundation models.',
    chapters: [
      { time: '0:00',  label: 'What is RAG?' },
      { time: '4:10',  label: 'Knowledge Bases Setup' },
      { time: '9:00',  label: 'Vector Embeddings & Search' },
      { time: '13:45', label: 'Query & Response Flow' },
      { time: '16:30', label: 'Production Best Practices' },
    ],
  },
  {
    id: 'bedrock-agents',
    youtubeId: 'iMxfwZWl3EY',
    title: 'Amazon Bedrock Agents — Build AI Agents',
    author: 'AWS Official',
    duration: '15:48',
    views: '39k',
    tag: 'Agents',
    tagColor: '#FF9F43',
    description:
      'Deep dive into Amazon Bedrock Agents — how to create, configure, and deploy autonomous AI agents that execute multi-step tasks.',
    chapters: [
      { time: '0:00',  label: 'Agents Architecture Overview' },
      { time: '3:20',  label: 'Creating Your First Agent' },
      { time: '8:15',  label: 'Action Groups & Lambda' },
      { time: '12:00', label: 'Testing & Monitoring' },
    ],
  },
  {
    id: 'prompt-engineering',
    youtubeId: 'dOxUroR57xs',
    title: 'Prompt Engineering for AWS GenAI',
    author: 'AWS re:Invent',
    duration: '28:05',
    views: '121k',
    tag: 'Prompting',
    tagColor: '#28C76F',
    description:
      'Master prompt engineering techniques for Claude and other foundation models on Amazon Bedrock. Covers chain-of-thought, few-shot, and advanced patterns.',
    chapters: [
      { time: '0:00',  label: 'Prompt Engineering Basics' },
      { time: '5:30',  label: 'Chain-of-Thought Prompting' },
      { time: '12:00', label: 'Few-Shot & Zero-Shot' },
      { time: '18:40', label: 'Advanced Techniques' },
      { time: '24:10', label: 'Real-world Examples' },
    ],
  },
  {
    id: 'guardrails-security',
    youtubeId: 'fqpSMDX2Xho',
    title: 'Guardrails & Security in Amazon Bedrock',
    author: 'AWS Security',
    duration: '20:17',
    views: '28k',
    tag: 'Security',
    tagColor: '#FF4C51',
    description:
      'Learn how to implement Guardrails in Amazon Bedrock to prevent harmful content, filter PII, and enforce content policies.',
    chapters: [
      { time: '0:00',  label: 'Why Guardrails Matter' },
      { time: '4:30',  label: 'Content Filtering' },
      { time: '9:15',  label: 'PII Detection & Redaction' },
      { time: '14:00', label: 'Topic Denial Policies' },
      { time: '17:45', label: 'Monitoring & Audit Logs' },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const colors = useThemeColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openVideo = async (youtubeId: string) => {
    await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${youtubeId}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
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
                    onPress={() => openVideo(video.youtubeId)}
                    style={({ pressed }) => [
                      styles.thumb,
                      { backgroundColor: video.tagColor + '18', opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.thumbGradient, { backgroundColor: video.tagColor + '22' }]} />
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
                  onPress={() => openVideo(video.youtubeId)}
                  style={({ pressed }) => [
                    styles.watchBtn,
                    { backgroundColor: video.tagColor, opacity: pressed ? 0.88 : 1 },
                  ]}
                >
                  <Feather name="youtube" size={15} color="#fff" />
                  <Text style={styles.watchBtnText}>Watch on YouTube</Text>
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
  scroll: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },

  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontFamily: F.bold,    fontSize: 22 },
  headerSub:   { fontFamily: F.regular, fontSize: 13, marginTop: 2 },

  card: {
    borderRadius: 12, borderWidth: 1, marginBottom: 14,
    overflow: 'hidden', flexDirection: 'row',
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 14, gap: 10 },

  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },

  thumb: {
    width: 90, height: 62, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  thumbGradient: { ...StyleSheet.absoluteFillObject },
  thumbIcon: { zIndex: 1 },
  durationBadge: {
    position: 'absolute', bottom: 4, right: 5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  durationText: { fontFamily: F.bold, fontSize: 10, color: '#fff' },

  cardInfo:  { flex: 1, gap: 4 },
  tagBadge:  { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  tagText:   { fontFamily: F.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  cardTitle: { fontFamily: F.semiBold, fontSize: 14, lineHeight: 20 },
  cardMeta:  { fontFamily: F.regular,  fontSize: 11 },

  expandRow:   { gap: 8 },
  description: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },

  chaptersBox: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  chaptersTitle: { fontFamily: F.semiBold, fontSize: 13, marginBottom: 2 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chapterNum: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chapterNumText: { fontFamily: F.bold, fontSize: 11 },
  chapterLabel: { fontFamily: F.regular, fontSize: 13, flex: 1 },
  chapterTime: { fontFamily: F.semiBold, fontSize: 11, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  expandToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expandText:   { fontFamily: F.semiBold, fontSize: 13 },

  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 9, borderRadius: 8,
  },
  watchBtnText: { fontFamily: F.semiBold, fontSize: 13, color: '#fff' },

  footer: {
    fontFamily: F.regular, fontSize: 12,
    textAlign: 'center', marginTop: 8,
  },
});
