import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

type BattleType = 'one_vs_one' | 'group' | 'random';

interface ModeCard {
  type: BattleType;
  title: string;
  description: string;
  icon: string;
  maxPlayers: string;
  featherIcon: string;
}

const MODE_CARDS: ModeCard[] = [
  {
    type: 'random',
    title: '1v1 Random Battle',
    description: 'Get matched with a random opponent instantly.',
    icon: '⚡',
    maxPlayers: '2 players',
    featherIcon: 'zap',
  },
  {
    type: 'one_vs_one',
    title: '1v1 Challenge',
    description: 'Challenge a friend with a private invite code.',
    icon: '⚔️',
    maxPlayers: '2 players',
    featherIcon: 'user',
  },
  {
    type: 'group',
    title: 'Group Battle',
    description: 'Compete with up to 8 players at once.',
    icon: '🏟️',
    maxPlayers: '2–8 players',
    featherIcon: 'users',
  },
];

export default function BattleScreen() {
  const colors = useThemeColors();
  const toneMap: Record<BattleType, string> = {
    random: colors.warning,
    one_vs_one: colors.error,
    group: colors.primary,
  };

  const handleStart = (type: BattleType) => {
    router.push({ pathname: '/battle-lobby', params: { type } });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Battle Modes</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Real-time quiz battles</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          Choose your battle mode
        </Text>

        {MODE_CARDS.map((card) => (
          <View key={card.type} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, shadowColor: colors.text }]}>
            <View style={[styles.cardStrip, { backgroundColor: toneMap[card.type] }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: toneMap[card.type] + '18' }]}>
                  <Feather name={card.featherIcon as 'zap' | 'user' | 'users'} size={22} color={toneMap[card.type]} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{card.description}</Text>
                  <Text style={[styles.cardMeta, { color: toneMap[card.type] }]}>{card.maxPlayers}</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleStart(card.type)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.startBtn,
                  { backgroundColor: toneMap[card.type], opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <Feather name="play" size={15} color={colors.surface} />
                <Text style={[styles.startBtnText, { color: colors.surface }]}>Start</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Info */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            <Text style={{ color: colors.primary, fontFamily: F.semiBold }}>Foundation Layer: </Text>
            Full battle game loop coming in a future update.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTextBlock: { flex: 1 },
  headerTitle: { fontFamily: F.bold, fontSize: 18 },
  headerSub: { fontFamily: F.regular, fontSize: 12, marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  sectionLabel: { fontFamily: F.semiBold, fontSize: 13, marginBottom: 4 },

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
  cardBody: { padding: 16, gap: 14 },

  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontFamily: F.bold, fontSize: 16 },
  cardSub: { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  cardMeta: { fontFamily: F.semiBold, fontSize: 11, letterSpacing: 0.3, marginTop: 2 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 10,
  },
  startBtnText: { fontFamily: F.semiBold, fontSize: 14 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  infoText: { fontFamily: F.regular, fontSize: 12, lineHeight: 18, flex: 1 },
});
