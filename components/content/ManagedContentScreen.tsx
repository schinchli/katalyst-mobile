import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { fetchManagedAppContent } from '@/services/appContentService';
import type { AppContentConfig } from '@/config/appContent';

type ContentKey = 'privacyPolicy' | 'termsAndConditions' | 'aboutUs' | 'instructions';

const TITLES: Record<ContentKey, string> = {
  privacyPolicy: 'Privacy Policy',
  termsAndConditions: 'Terms & Conditions',
  aboutUs: 'About Us',
  instructions: 'How To Play',
};

export function ManagedContentScreen({ contentKey }: { contentKey: ContentKey }) {
  const colors = useThemeColors();
  const [content, setContent] = useState<AppContentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagedAppContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button title="Back" variant="outline" onPress={() => router.back()} />
          <Text style={[styles.title, { color: colors.text }]}>{TITLES[contentKey]}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Shared from admin-managed platform content.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {loading ? (
            <View style={styles.loading}>
              <Feather name="loader" size={18} color={colors.textSecondary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading content…</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.appName, { color: colors.primary }]}>{content?.appName ?? 'LearnKloud LMS'}</Text>
              <Text style={[styles.body, { color: colors.text }]}>
                {content?.[contentKey] ?? ''}
              </Text>
              <Text style={[styles.support, { color: colors.textSecondary }]}>
                Support: {content?.supportEmail ?? 'support@example.com'}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  header: { gap: 10 },
  title: { fontFamily: F.bold, fontSize: 28, lineHeight: 34 },
  subtitle: { fontFamily: F.medium, fontSize: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontFamily: F.medium, fontSize: 14 },
  appName: { fontFamily: F.bold, fontSize: 16 },
  body: { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
  support: { fontFamily: F.medium, fontSize: 13 },
});
