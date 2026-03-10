import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { PLANS } from '@/services/razorpayService';
import type { Quiz } from '@/types';

type Tab = 'course' | 'pro';

const PRO_FEATURES = [
  { icon: 'file-text',   text: 'All 5 CLF-C02 quizzes (195 questions)' },
  { icon: 'zap',         text: 'Security, Technology & all domains' },
  { icon: 'bar-chart-2', text: 'Advanced analytics & weak-area insights' },
  { icon: 'download',    text: 'Offline access to all quiz content' },
  { icon: 'award',       text: 'Exclusive Pro badges' },
];

interface PremiumGateModalProps {
  visible: boolean;
  quiz: Quiz;
  onClose: () => void;
  onUpgrade?: (type: 'subscription' | 'course') => Promise<void>;
}

export function PremiumGateModal({ visible, quiz, onClose, onUpgrade }: PremiumGateModalProps) {
  const colors  = useThemeColors();
  const [tab,     setTab]     = useState<Tab>('course');
  const [loading, setLoading] = useState(false);

  const handleAction = async (type: 'subscription' | 'course') => {
    if (!onUpgrade) { onClose(); return; }
    setLoading(true);
    try { await onUpgrade(type); } finally { setLoading(false); }
  };

  const COURSE_FEATURES = [
    { icon: 'list',    text: `${quiz.questionCount} questions for ${quiz.title.replace('CLF-C02: ', '')}` },
    { icon: 'zap',     text: 'Instant feedback with explanations' },
    { icon: 'refresh-cw', text: 'Unlimited retries — practice until you pass' },
    { icon: 'check',   text: 'Score saved to your profile history' },
  ];

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

          <Text style={[styles.title, { color: colors.text }]}>Unlock Access</Text>

          {/* Tabs */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            {(['course', 'pro'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[
                  styles.tabBtn,
                  tab === t && [styles.tabBtnActive, { backgroundColor: colors.surface }],
                ]}
              >
                <Text style={[styles.tabLabel, { color: tab === t ? colors.primary : colors.textSecondary }]}>
                  {t === 'course' ? 'Unlock This Quiz' : 'Go Pro — All Access'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab: course unlock */}
          {tab === 'course' && (
            <>
              <View style={styles.priceCenter}>
                <Text style={[styles.priceAmount, { color: colors.text }]}>
                  ₹{quiz.price ?? 149}
                </Text>
                <Text style={[styles.priceSub, { color: colors.textSecondary }]}>
                  one-time · permanent access
                </Text>
              </View>

              <View style={[styles.featureBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                {COURSE_FEATURES.map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <Feather name={f.icon as never} size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => handleAction('course')}
                disabled={loading}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  { backgroundColor: colors.primary, opacity: (pressed || loading) ? 0.88 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="unlock" size={16} color="#fff" />
                    <Text style={styles.upgradeBtnText}>Unlock for ₹{quiz.price ?? 149}</Text>
                  </>
                )}
              </Pressable>

              <Pressable onPress={() => setTab('pro')} hitSlop={8}>
                <Text style={[styles.proLink, { color: colors.warning }]}>
                  Or Go Pro for all quizzes →
                </Text>
              </Pressable>
            </>
          )}

          {/* Tab: pro subscription */}
          {tab === 'pro' && (
            <>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Unlock all 5 CLF-C02 quizzes and upcoming certifications.
              </Text>

              {/* Pricing row */}
              <View style={styles.pricingRow}>
                <View style={[styles.planChip, styles.planChipSelected, { borderColor: colors.warning, backgroundColor: colors.warning + '14' }]}>
                  <Text style={[styles.planLabel, { color: colors.warning }]}>Annual</Text>
                  <Text style={[styles.planPrice, { color: colors.text }]}>₹999<Text style={[styles.planPer, { color: colors.textSecondary }]}>/yr</Text></Text>
                  <View style={[styles.saveBadge, { backgroundColor: colors.warning }]}>
                    <Text style={styles.saveBadgeText}>Save 44%</Text>
                  </View>
                </View>
                <View style={[styles.planChip, { borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.planLabel, { color: colors.textSecondary }]}>Monthly</Text>
                  <Text style={[styles.planPrice, { color: colors.text }]}>₹149<Text style={[styles.planPer, { color: colors.textSecondary }]}>/mo</Text></Text>
                </View>
              </View>

              {/* Feature list */}
              <View style={[styles.featureBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                {PRO_FEATURES.map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <View style={[styles.featureIconWrap, { backgroundColor: colors.primaryLight }]}>
                      <Feather name={f.icon as never} size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.text }]}>{f.text}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => handleAction('subscription')}
                disabled={loading}
                style={({ pressed }) => [
                  styles.upgradeBtn,
                  { backgroundColor: colors.warning, opacity: (pressed || loading) ? 0.88 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="star" size={16} color="#fff" />
                    <Text style={styles.upgradeBtnText}>Go Pro — ₹{PLANS.annual.price}/yr</Text>
                  </>
                )}
              </Pressable>
            </>
          )}

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
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    width: '100%',
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontFamily: F.semiBold,
    fontSize: 12,
  },
  priceCenter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  priceAmount: {
    fontFamily: F.bold,
    fontSize: 40,
  },
  priceSub: {
    fontFamily: F.regular,
    fontSize: 13,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  planChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  planChipSelected: {
    borderWidth: 2,
  },
  planLabel: {
    fontFamily: F.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planPrice: {
    fontFamily: F.bold,
    fontSize: 20,
  },
  planPer: {
    fontFamily: F.regular,
    fontSize: 12,
  },
  saveBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  saveBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 10,
    color: '#fff',
  },
  featureBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeBtnText: {
    fontFamily: F.semiBold,
    color: '#fff',
    fontSize: 16,
  },
  proLink: {
    fontFamily: F.semiBold,
    fontSize: 13,
    paddingVertical: 4,
    marginBottom: 4,
  },
  maybeLater: {
    fontFamily: F.medium,
    fontSize: 13,
    paddingVertical: 4,
  },
});
