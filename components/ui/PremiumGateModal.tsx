import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { PLANS } from '@/services/razorpayService';
import type { Quiz } from '@/types';
import { EXPERIENCE_COPY } from '@/config/experience';
import { COMPANY_TONES } from '@/config/themePresets';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';

type Tab = 'course' | 'pro';

interface PremiumGateModalProps {
  visible: boolean;
  quiz: Quiz;
  onClose: () => void;
  onUpgrade?: (type: 'subscription' | 'course') => Promise<void>;
}

export function PremiumGateModal({ visible, quiz, onClose, onUpgrade }: PremiumGateModalProps) {
  const colors = useThemeColors();
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const [tab, setTab] = useState<Tab>('pro');
  const [loading, setLoading] = useState(false);
  const playableQuestionCount = getPlayableQuestionCount(quiz);

  const handleAction = async (type: 'subscription' | 'course') => {
    if (!onUpgrade) return onClose();
    setLoading(true);
    try {
      await onUpgrade(type);
    } finally {
      setLoading(false);
    }
  };

  const courseFeatures = [
    `${playableQuestionCount} questions in ${quiz.title}`,
    'Instant feedback with detailed explanations',
    'Unlimited retries and saved results',
    'Premium practice experience on mobile',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" presentationStyle="overFullScreen" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={22} color={colors.text} />
          </Pressable>

          <Text style={[styles.headline, { color: colors.text }]}>{platformConfig.copy.premiumHeadline}</Text>
          <Text style={[styles.subheadline, { color: platformConfig.colors.premiumAccent }]}>{platformConfig.copy.premiumSubheadline}</Text>

          <View style={styles.featureList}>
            {EXPERIENCE_COPY.premium.features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Feather name="check-circle" size={18} color={colors.error} />
                <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.planRow}>
            <Pressable onPress={() => setTab('course')} style={[styles.planCard, { backgroundColor: colors.surface, borderColor: tab === 'course' ? colors.gradientAccent : colors.surfaceBorder }]}>
              <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>₹ {quiz.price ?? 249}.00</Text>
              <Text style={[styles.planMeta, { color: colors.textSecondary }]}>Billed once</Text>
              <Pressable onPress={() => handleAction('course')} style={[styles.planButton, { borderColor: colors.gradientAccent }]}>
                {loading && tab === 'course' ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={[styles.planButtonText, { color: colors.text }]}>Unlock Quiz</Text>}
              </Pressable>
            </Pressable>

            <LinearGradient colors={[colors.surfaceElevated, colors.surface]} style={[styles.planCard, { borderColor: tab === 'pro' ? colors.primary : colors.surfaceBorder }]}>
              {platformConfig.widgets.showDiscountBanner && (
                <View style={[styles.saveBadge, { backgroundColor: platformConfig.colors.premiumAccent }]}>
                  <Text style={styles.saveBadgeText}>Save 50%</Text>
                </View>
              )}
              <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
              <Text style={[styles.strikePrice, { color: colors.textSecondary }]}>₹10,999.00</Text>
              <Text style={[styles.planPrice, { color: colors.text }]}>₹ {PLANS.annual.price}.00</Text>
              <Text style={[styles.planMeta, { color: colors.textSecondary }]}>₹533.33 / month billed yearly</Text>
              <Pressable onPress={() => { setTab('pro'); handleAction('subscription'); }} style={[styles.planButtonSolid, { backgroundColor: colors.primary }]}>
                {loading && tab === 'pro' ? <ActivityIndicator size="small" color="#04111F" /> : <Text style={styles.planButtonSolidText}>Subscribe</Text>}
              </Pressable>
            </LinearGradient>
          </View>

          <Text style={[styles.renewText, { color: colors.textSecondary }]}>Subscriptions automatically renew. Cancel anytime.</Text>

          <View style={styles.ratingWrap}>
            <Feather name="star" size={34} color="#F8E84A" />
            <Text style={[styles.ratingValue, { color: colors.text }]}>{EXPERIENCE_COPY.premium.testimonial.rating}</Text>
          </View>
          <Text style={[styles.ratingMeta, { color: colors.text }]}>{EXPERIENCE_COPY.premium.testimonial.reviews}</Text>

          <View style={[styles.testimonialCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.testimonialStars, { color: '#F8E84A' }]}>5.0 ★★★★★</Text>
            <Text style={[styles.testimonialTitle, { color: colors.text }]}>{EXPERIENCE_COPY.premium.testimonial.title}</Text>
            <Text style={[styles.testimonialBody, { color: colors.textSecondary }]}>{EXPERIENCE_COPY.premium.testimonial.body}</Text>
          </View>

          <Text style={[styles.companyTitle, { color: colors.text }]}>{EXPERIENCE_COPY.premium.companiesTitle}</Text>
          <View style={styles.companyGrid}>
            {COMPANY_TONES.map((company) => (
              <View key={company.name} style={[styles.companyCard, { backgroundColor: company.tone }]}>
                <Text style={styles.companyText}>{company.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(3,8,20,0.75)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34, maxHeight: '94%' },
  closeButton: { alignSelf: 'flex-end', padding: 4 },
  headline: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
  subheadline: { fontFamily: F.bold, fontSize: 18, marginTop: 8 },
  featureList: { gap: 14, marginTop: 24 },
  featureRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  featureText: { fontFamily: F.semiBold, fontSize: 16, lineHeight: 26, flex: 1 },
  planRow: { flexDirection: 'row', gap: 14, marginTop: 24 },
  planCard: { flex: 1, borderRadius: 24, borderWidth: 1, padding: 18, gap: 10, overflow: 'hidden' },
  saveBadge: { position: 'absolute', right: 12, top: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  saveBadgeText: { color: '#fff', fontFamily: F.bold, fontSize: 12 },
  planName: { fontFamily: F.medium, fontSize: 18 },
  strikePrice: { fontFamily: F.medium, fontSize: 14, textDecorationLine: 'line-through' },
  planPrice: { fontFamily: F.bold, fontSize: 24, lineHeight: 30 },
  planMeta: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },
  planButton: { minHeight: 50, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  planButtonText: { fontFamily: F.bold, fontSize: 16 },
  planButtonSolid: { minHeight: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  planButtonSolidText: { color: '#04111F', fontFamily: F.bold, fontSize: 16 },
  renewText: { fontFamily: F.regular, fontSize: 14, lineHeight: 22, marginTop: 16 },
  ratingWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 30 },
  ratingValue: { fontFamily: F.bold, fontSize: 40 },
  ratingMeta: { fontFamily: F.medium, fontSize: 20, textAlign: 'center', marginTop: 4 },
  testimonialCard: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 10, marginTop: 20 },
  testimonialStars: { fontFamily: F.bold, fontSize: 18 },
  testimonialTitle: { fontFamily: F.bold, fontSize: 22 },
  testimonialBody: { fontFamily: F.regular, fontSize: 15, lineHeight: 24 },
  companyTitle: { fontFamily: F.bold, fontSize: 18, textAlign: 'center', marginTop: 24, marginBottom: 14 },
  companyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  companyCard: { width: '48%', borderRadius: 18, minHeight: 74, alignItems: 'center', justifyContent: 'center' },
  companyText: { color: '#fff', fontFamily: F.bold, fontSize: 18, textAlign: 'center' },
});
