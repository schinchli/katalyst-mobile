import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
      <View style={[styles.overlay, { backgroundColor: colors.background + 'CC' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>

          {/* Close */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>

          <Text style={[styles.headline, { color: colors.text }]}>
            You reached today's free practice limit.
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Take a break and return tomorrow, or unlock unlimited practice when you are ready.
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
          <Pressable onPress={onUpgrade} style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={[styles.ctaText, { color: colors.surface }]}>Unlock Unlimited Practice</Text>
            <Feather name="arrow-right" size={18} color={colors.surface} />
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  headline: { fontFamily: F.bold, fontSize: 24, lineHeight: 32, letterSpacing: 0, textAlign: 'center' },
  sub: { fontFamily: F.regular, fontSize: 15, lineHeight: 24, textAlign: 'center', marginTop: 12 },
  divider: { height: 1, marginVertical: 22 },
  perks: { gap: 14, marginBottom: 28 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontFamily: F.semiBold, fontSize: 15, flex: 1, lineHeight: 22 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12 },
  ctaText: { fontFamily: F.bold, fontSize: 17 },
  dismissBtn: { alignItems: 'center', marginTop: 18 },
  dismissText: { fontFamily: F.medium, fontSize: 14 },
});
