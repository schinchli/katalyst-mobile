import { Modal, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Quiz } from '@/types';
import { EXPERIENCE_COPY } from '@/config/experience';
import { COMPANY_TONES } from '@/config/themePresets';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';
import { AppConfig } from '@/config/appConfig';

interface PremiumGateModalProps {
  visible: boolean;
  quiz: Quiz;
  onClose: () => void;
  onUpgrade?: (type: 'subscription' | 'course') => Promise<void>;
}

export function PremiumGateModal({ visible, quiz, onClose }: PremiumGateModalProps) {
  const colors = useThemeColors();
  const platformConfig = usePlatformConfigStore((s) => s.config);
  const playableQuestionCount = getPlayableQuestionCount(quiz);

  const webUrl = (AppConfig.web.baseUrl ?? '').replace(/\/$/, '') || 'https://lms-amber-two.vercel.app';

  const openWebStore = () => {
    void Linking.openURL(`${webUrl}/dashboard/store`);
  };

  const courseFeatures = [
    `${playableQuestionCount} questions in ${quiz.title}`,
    'Instant feedback with detailed explanations',
    'Unlimited retries and saved results',
    'Premium practice experience on all devices',
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

          {/* Web payment card */}
          <LinearGradient
            colors={[colors.surfaceElevated, colors.surface]}
            style={[styles.webCard, { borderColor: colors.primary }]}
          >
            <View style={styles.webCardIcon}>
              <Feather name="globe" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.webCardTitle, { color: colors.text }]}>Subscribe or unlock on the web</Text>
            <Text style={[styles.webCardBody, { color: colors.textSecondary }]}>
              Payments are processed securely on our website via Razorpay or Stripe.{'\n'}
              Log in at <Text style={{ color: colors.primary }}>katalyst.app</Text> and subscribe from your account.
            </Text>
            <Pressable onPress={openWebStore} style={[styles.webBtn, { backgroundColor: colors.primary }]}>
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={styles.webBtnText}>Open Web App to Subscribe</Text>
            </Pressable>
          </LinearGradient>

          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Already subscribed? Pull down to refresh or sign out and back in to sync your access.
          </Text>

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
  webCard: { borderRadius: 20, borderWidth: 1.5, padding: 22, marginTop: 24, gap: 12, alignItems: 'center' },
  webCardIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(115,103,240,0.12)' },
  webCardTitle: { fontFamily: F.bold, fontSize: 20, textAlign: 'center' },
  webCardBody: { fontFamily: F.regular, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  webBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18, marginTop: 4 },
  webBtnText: { color: '#fff', fontFamily: F.bold, fontSize: 16 },
  noteText: { fontFamily: F.regular, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
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
