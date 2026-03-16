import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { quizzes } from '@/data/quizzes';

type BattleType = 'one_vs_one' | 'group' | 'random';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function pickRandomFreeQuiz(): string {
  const free = quizzes.filter((q) => !q.isPremium && q.enabled !== false);
  if (free.length === 0) return quizzes[0]?.id ?? '';
  return free[Math.floor(Math.random() * free.length)]?.id ?? '';
}

export default function BattleLobbyScreen() {
  const colors = useThemeColors();
  const { type } = useLocalSearchParams<{ type: BattleType }>();
  const battleType: BattleType = (type as BattleType) ?? 'random';

  const [inviteCode] = useState(() => battleType !== 'random' ? generateInviteCode() : null);
  const [quizId] = useState(() => pickRandomFreeQuiz());
  const [opponentFound, setOpponentFound] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quizTitle = quizzes.find((q) => q.id === quizId)?.title ?? quizId;

  useEffect(() => {
    // Simulate waiting for opponent timeout for random battles
    if (battleType === 'random') {
      timerRef.current = setTimeout(() => setTimedOut(true), 30_000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [battleType]);

  const handleStartQuiz = () => {
    router.push(`/quiz/${quizId}`);
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      // TODO: look up battle session by code from Supabase once migration is applied
      router.push(`/quiz/${quizId}`);
    }
  };

  const isRandom = battleType === 'random';
  const isGroup = battleType === 'group';
  const canStart = opponentFound || timedOut || isGroup;
  const statusColor = opponentFound ? colors.success : '#FF9F43';
  const statusText = opponentFound
    ? 'Opponent joined! Ready to battle.'
    : timedOut
    ? 'No opponent found. Play solo instead?'
    : isRandom
    ? 'Looking for an opponent…'
    : isGroup
    ? `Waiting for players to join with code ${inviteCode ?? ''}…`
    : `Waiting for opponent to join with code ${inviteCode ?? ''}…`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityRole="button">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Battle Lobby</Text>
      </View>

      <View style={styles.body}>
        {/* Invite code */}
        {inviteCode && (
          <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>INVITE CODE</Text>
            <Text style={[styles.codeValue, { color: colors.primary }]}>{inviteCode}</Text>
            <Text style={[styles.codeSub, { color: colors.textSecondary }]}>Share this with your opponent</Text>
          </View>
        )}

        {/* Quiz info */}
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.quizLabel, { color: colors.textSecondary }]}>Quiz</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>{quizTitle}</Text>
        </View>

        {/* Status */}
        <View style={[styles.statusRow, { backgroundColor: statusColor + '12', borderColor: statusColor + '40' }]}>
          {!opponentFound && !timedOut && isRandom && (
            <ActivityIndicator size="small" color={statusColor} />
          )}
          {!opponentFound && !timedOut && !isRandom && (
            <ActivityIndicator size="small" color={statusColor} />
          )}
          {(opponentFound || timedOut) && (
            <Feather name={opponentFound ? 'check-circle' : 'clock'} size={16} color={statusColor} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        {/* Join by code input (for joining someone else's battle) */}
        {!isRandom && !opponentFound && (
          <View style={styles.joinSection}>
            <Text style={[styles.joinLabel, { color: colors.textSecondary }]}>
              Have someone else&apos;s code? Join their battle:
            </Text>
            <View style={styles.joinRow}>
              <TextInput
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase().slice(0, 6))}
                placeholder="Enter code"
                maxLength={6}
                style={[styles.joinInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
              />
              <Pressable
                onPress={handleJoin}
                disabled={joinCode.length < 6}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.joinBtn,
                  {
                    backgroundColor: joinCode.length === 6 ? colors.primary : colors.surfaceBorder,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.joinBtnText, { color: joinCode.length === 6 ? '#fff' : colors.textSecondary }]}>
                  Join
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Start / solo button */}
        {canStart && (
          <Pressable
            onPress={handleStartQuiz}
            accessibilityRole="button"
            style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          >
            <Feather name="play" size={16} color="#fff" />
            <Text style={styles.startBtnText}>
              {timedOut && !opponentFound ? 'Play Solo Instead' : 'Start Battle!'}
            </Text>
          </Pressable>
        )}

        {/* Info */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
          <Feather name="info" size={13} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Full battle game loop is coming in a future update.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

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

  body: { flex: 1, padding: 20, gap: 16 },

  codeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: { fontFamily: F.bold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },
  codeValue: { fontFamily: F.bold, fontSize: 36, letterSpacing: 10 },
  codeSub: { fontFamily: F.regular, fontSize: 12 },

  quizCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: '12px 14px' as unknown as number,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  quizLabel: { fontFamily: F.semiBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  quizTitle: { fontFamily: F.bold, fontSize: 15 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontFamily: F.semiBold, fontSize: 13, flex: 1 },

  joinSection: { gap: 8 },
  joinLabel: { fontFamily: F.regular, fontSize: 12 },
  joinRow: { flexDirection: 'row', gap: 10 },
  joinInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: F.bold,
    fontSize: 16,
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinBtn: {
    width: 70,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: { fontFamily: F.semiBold, fontSize: 14 },

  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  startBtnText: { fontFamily: F.bold, fontSize: 16, color: '#fff' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: { fontFamily: F.regular, fontSize: 12, lineHeight: 18, flex: 1 },
});
