import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { AppConfig } from '@/config/appConfig';
import { F } from '@/constants/Typography';
import type { Contest, ContestStatus } from '@/types';

type Tab = ContestStatus;

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'live',     label: 'Live',     icon: 'radio' },
  { key: 'upcoming', label: 'Upcoming', icon: 'clock' },
  { key: 'past',     label: 'Past',     icon: 'archive' },
];

function getContestTone(category: string, colors: ReturnType<typeof useThemeColors>) {
  const tones = [colors.primary, colors.success, colors.warning, colors.error, colors.gradientAccent];
  const score = [...category].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[score % tones.length];
}

// ─── Countdown timer display ──────────────────────────────────────────────────
function useCountdown(endTime: string) {
  const calc = () => Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Contest card ─────────────────────────────────────────────────────────────
function ContestCard({
  contest,
  coins,
  colors,
}: {
  contest: Contest;
  coins: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const countdown = useCountdown(contest.endTime);
  const catColor  = getContestTone(contest.category, colors);
  const canAfford = coins >= contest.entryFee;

  const handleJoin = () => {
    router.push(`/quiz/${contest.quizId}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      {/* Accent strip */}
      <View style={[styles.cardStrip, { backgroundColor: catColor }]} />

      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.catIcon, { backgroundColor: catColor + '18' }]}>
            <Feather name={contest.icon as any} size={18} color={catColor} />
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{contest.title}</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>
              {contest.description}
            </Text>
          </View>
          {contest.status === 'live' && (
            <View style={[styles.liveBadge, { backgroundColor: colors.error + '18' }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.liveBadgeText, { color: colors.error }]}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="zap" size={13} color={colors.warning} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Fee: <Text style={{ color: colors.text, fontFamily: F.semiBold }}>{contest.entryFee} coins</Text>
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="award" size={13} color={colors.success} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              Prize: <Text style={{ color: colors.success, fontFamily: F.semiBold }}>{contest.prizeCoins.toLocaleString()} coins</Text>
            </Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="users" size={13} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {contest.participants}/{contest.maxParticipants}
            </Text>
          </View>
        </View>

        {/* Timer / date */}
        {contest.status === 'live' && (
          <View style={[styles.timerRow, { backgroundColor: colors.error + '08', borderColor: colors.error + '30' }]}>
            <Feather name="clock" size={13} color={colors.error} />
            <Text style={[styles.timerText, { color: colors.error }]}>Ends in {countdown}</Text>
          </View>
        )}
        {contest.status === 'upcoming' && (
          <View style={[styles.timerRow, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
            <Feather name="calendar" size={13} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.primary }]}>Starts {formatDate(contest.startTime)}</Text>
          </View>
        )}
        {contest.status === 'past' && contest.winner && (
          <View style={[styles.timerRow, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '30' }]}>
            <Feather name="award" size={13} color={colors.warning} />
            <Text style={[styles.timerText, { color: colors.warning }]}>
              Winner: {contest.winner} · {contest.topScore}%
            </Text>
          </View>
        )}

        {/* CTA */}
        {contest.status !== 'past' && (
          <Pressable
            onPress={handleJoin}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.joinBtn,
              {
                backgroundColor: canAfford ? catColor : colors.surfaceBorder,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Feather name={contest.status === 'live' ? 'play' : 'bell'} size={15} color={canAfford ? colors.surface : colors.textSecondary} />
            <Text style={[styles.joinBtnText, { color: canAfford ? colors.surface : colors.textSecondary }]}>
              {contest.status === 'live' ? 'Join Now' : 'Notify Me'}
            </Text>
          </Pressable>
        )}
        {contest.status === 'past' && (
          <Pressable
            onPress={() => router.push(`/quiz/${contest.quizId}`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.joinBtn, { backgroundColor: colors.primaryLight, opacity: pressed ? 0.88 : 1 }]}
          >
            <Feather name="rotate-cw" size={15} color={colors.primary} />
            <Text style={[styles.joinBtnText, { color: colors.primary }]}>Practice Again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab, colors }: { tab: Tab; colors: ReturnType<typeof useThemeColors> }) {
  const msgs: Record<Tab, { icon: string; text: string }> = {
    live:     { icon: 'radio',   text: 'No live contests right now.\nCheck back soon!' },
    upcoming: { icon: 'clock',   text: 'No upcoming contests yet.\nNew ones are added every week.' },
    past:     { icon: 'archive', text: 'No past contests to show.' },
  };
  const m = msgs[tab];
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={m.icon as any} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{m.text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ContestScreen() {
  const colors = useThemeColors();
  const [tab, setTab] = useState<Tab>('live');
  const coins = useProgressStore((s) => s.progress.coins ?? 0);
  const [allContests, setAllContests] = useState<Contest[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);

  useEffect(() => {
    const baseUrl = AppConfig.web.baseUrl || 'https://lms-amber-two.vercel.app';
    fetch(`${baseUrl}/api/contests`)
      .then((r) => r.json())
      .then((d: { ok: boolean; contests?: Contest[] }) => {
        if (d.ok && Array.isArray(d.contests)) setAllContests(d.contests);
      })
      .catch(() => { /* show empty state on error */ })
      .finally(() => setLoadingContests(false));
  }, []);

  const list: Contest[] = allContests.filter((c) => c.status === tab);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contests</Text>
        {/* Coin balance */}
        <View style={[styles.coinBadge, { backgroundColor: colors.warning + '18' }]}>
          <Feather name="zap" size={14} color={colors.warning} />
          <Text style={[styles.coinBadgeText, { color: colors.warning }]}>{(coins).toLocaleString()}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {TABS.map((t) => {
          const count = allContests.filter((c) => c.status === t.key).length;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="button"
              style={[styles.tab, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.textSecondary} />
              <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.textSecondary }]}>
                {t.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCount, { backgroundColor: tab === t.key ? colors.primary : colors.textSecondary + '40' }]}>
                  <Text style={[styles.tabCountText, { color: tab === t.key ? colors.surface : colors.textSecondary }]}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loadingContests
          ? <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
          : list.length === 0
            ? <EmptyState tab={tab} colors={colors} />
            : list.map((c) => <ContestCard key={c.id} contest={c} coins={coins} colors={colors} />)
        }
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: F.bold, fontSize: 18, flex: 1 },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coinBadgeText: { fontFamily: F.bold, fontSize: 13 },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontFamily: F.semiBold, fontSize: 13 },
  tabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountText: { fontFamily: F.bold, fontSize: 10 },

  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardStrip: { height: 4 },
  cardBody: { padding: 16, gap: 12 },

  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitleWrap: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: F.bold, fontSize: 16, lineHeight: 22 },
  cardSub:   { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveBadgeText: { fontFamily: F.bold, fontSize: 10, letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontFamily: F.regular, fontSize: 12 },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timerText: { fontFamily: F.semiBold, fontSize: 13 },

  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  joinBtnText: { fontFamily: F.semiBold, fontSize: 14 },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
