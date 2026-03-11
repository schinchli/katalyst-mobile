import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

interface DailyLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PERKS = [
  'Unlimited daily practice — no cap, ever',
  'Full access to all 400+ exam questions',
  'Detailed explanations on every answer',
  'Progress tracking across every topic',
];

export function DailyLimitModal({ visible, onClose, onUpgrade }: DailyLimitModalProps) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>

          {/* Close */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* Emoji + headline */}
          <Text style={styles.emoji}>🔥</Text>
          <Text style={[styles.headline, { color: colors.text }]}>
            You've crushed your{'\n'}5 free sessions today.
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            That's the spirit — you're clearly serious about this exam.{'\n'}
            Unlock unlimited practice and keep that momentum going.
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Perks */}
          <View style={styles.perks}>
            {PERKS.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <View style={[styles.checkCircle, { backgroundColor: colors.success + '22', borderColor: colors.success + '44' }]}>
                  <Feather name="check" size={12} color={colors.success} />
                </View>
                <Text style={[styles.perkText, { color: colors.text }]}>{perk}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable onPress={onUpgrade} style={styles.ctaWrap}>
            <LinearGradient
              colors={[colors.gradientFrom, colors.gradientTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Unlock Unlimited Practice</Text>
              <Feather name="arrow-right" size={18} color="#04111F" />
            </LinearGradient>
          </Pressable>

          {/* Soft dismiss */}
          <Pressable onPress={onClose} style={styles.dismissBtn}>
            <Text style={[styles.dismissText, { color: colors.textMuted }]}>
              I'll wait until tomorrow
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(3,8,20,0.8)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 36 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 14 },
  headline: { fontFamily: F.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.8, textAlign: 'center' },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 12 },
  divider: { height: 1, marginVertical: 22 },
  perks: { gap: 14, marginBottom: 28 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontFamily: F.semiBold, fontSize: 15, flex: 1, lineHeight: 22 },
  ctaWrap: { borderRadius: 20, overflow: 'hidden' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, paddingHorizontal: 24 },
  ctaText: { fontFamily: F.bold, fontSize: 17, color: '#04111F' },
  dismissBtn: { alignItems: 'center', marginTop: 18 },
  dismissText: { fontFamily: F.medium, fontSize: 14 },
});
