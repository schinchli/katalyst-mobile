import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

const FEATURES = [
  { icon: 'file-text',   text: 'Mega Practice Exam — 20 questions, all categories' },
  { icon: 'zap',         text: 'Unlimited quizzes with no ads' },
  { icon: 'bar-chart-2', text: 'Advanced analytics & weak-area insights' },
  { icon: 'download',    text: 'Offline access to all quiz content' },
  { icon: 'award',       text: 'Exclusive premium badges' },
];

interface PremiumGateModalProps {
  visible: boolean;
  quizTitle: string;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function PremiumGateModal({ visible, quizTitle, onClose, onUpgrade }: PremiumGateModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Close */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Feather name="x" size={22} color={colors.textSecondary} />
          </Pressable>

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: '#FFF3E8' }]}>
            <Feather name="lock" size={32} color={colors.warning} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Premium Content</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            "{quizTitle}" requires a Pro subscription.
          </Text>

          {/* Feature list */}
          <View style={[styles.featureBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={f.icon as any} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Upgrade CTA */}
          <Pressable
            onPress={onUpgrade ?? onClose}
            style={({ pressed }) => [
              styles.upgradeBtn,
              { backgroundColor: colors.warning, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Feather name="star" size={16} color="#fff" />
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          </Pressable>

          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[styles.maybeLater, { color: colors.textSecondary }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 43, 61, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featureBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontFamily: F.regular,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  upgradeBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeBtnText: {
    fontFamily: F.semiBold,
    color: '#fff',
    fontSize: 16,
  },
  maybeLater: {
    fontFamily: F.medium,
    fontSize: 13,
    paddingVertical: 4,
  },
});
