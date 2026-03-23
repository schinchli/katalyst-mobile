import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Platform, Share, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppConfig, CONFIG_CHECKLIST, ConfigItem, getMissingCount, isSet, maskValue } from '@/config/appConfig';

const COLORS = {
  background: '#0B1020',
  surface: '#121A2B',
  border: '#273046',
  text: '#E8ECF4',
  muted: '#9EA7B8',
  primary: '#7367F0',
  primaryTint: 'rgba(115,103,240,0.12)',
  success: '#28C76F',
  successTint: 'rgba(40,199,111,0.14)',
  error: '#EA5455',
  errorTint: 'rgba(234,84,85,0.14)',
  warning: '#FF9F43',
  white: '#FFFFFF',
};

function statusIcon(item: ConfigItem) {
  if (!item.required) return null;
  return isSet(item.value) ? 'check-circle' : 'alert-circle';
}

function statusColor(item: ConfigItem) {
  if (!item.required) return COLORS.muted;
  return isSet(item.value) ? COLORS.success : COLORS.error;
}

function displayValue(item: ConfigItem) {
  if (!item.value || item.value.length === 0) {
    return item.required ? 'NOT SET' : 'using default';
  }
  return maskValue(item.value);
}

const SECTIONS = ['App', 'Supabase', 'AdMob · iOS', 'AdMob · Android'];

const STORE_KEYS = [
  { label: 'EXPO_TOKEN', note: 'EAS authentication -> GitHub Secret' },
  { label: 'APPLE_ID', note: 'Apple Developer account -> GitHub Secret' },
  { label: 'APPLE_APP_SPECIFIC_PASSWORD', note: 'App-specific password -> GitHub Secret' },
  { label: 'GOOGLE_SERVICE_ACCOUNT_KEY', note: 'JSON key file -> GitHub Secret' },
];

const ENV_TEMPLATE = `# Copy to .env and fill in real values
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_ADMOB_IOS_BANNER=
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=`;

function SectionHeader({ title, items }: { title: string; items: ConfigItem[] }) {
  const missing = items.filter((item) => item.required && !isSet(item.value)).length;

  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {missing > 0 ? (
        <View style={styles.missingBadge}>
          <Text style={styles.missingBadgeText}>{missing} missing</Text>
        </View>
      ) : null}
    </View>
  );
}

function ConfigRow({ item }: { item: ConfigItem }) {
  const icon = statusIcon(item);
  const color = statusColor(item);
  const value = displayValue(item);
  const unset = item.required && !isSet(item.value);

  const handleCopyKey = async () => {
    await Share.share({ message: item.envKey });
  };

  return (
    <Pressable onPress={handleCopyKey} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.iconSlot}>
        {icon ? (
          <Feather name={icon as any} size={16} color={color} />
        ) : (
          <View style={styles.optionalDot} />
        )}
      </View>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={[styles.rowValue, unset && styles.rowValueError]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function DevConfigScreen() {
  useEffect(() => {
    if (!__DEV__) {
      router.replace('/(tabs)');
    }
  }, []);

  if (!__DEV__) return null;

  const missing = getMissingCount();

  const handleCopyTemplate = async () => {
    await Share.share({
      message: ENV_TEMPLATE,
      title: '.env Template',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.closeButton, pressed && styles.rowPressed]}>
          <Feather name="x" size={22} color={COLORS.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Developer Config</Text>
          <Text style={styles.headerSubtitle}>Tap any row to copy its .env key name</Text>
        </View>
        <View style={[styles.statusBadge, missing === 0 ? styles.statusBadgeReady : styles.statusBadgeMissing]}>
          <Text style={[styles.statusBadgeText, missing === 0 ? styles.statusReadyText : styles.statusMissingText]}>
            {missing === 0 ? 'Ready' : `${missing} missing`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.runtimeCard}>
          <View>
            <Text style={styles.runtimeLabel}>Env</Text>
            <Text style={[styles.runtimeValue, styles.primaryText]}>{AppConfig.env}</Text>
          </View>
          <View>
            <Text style={styles.runtimeLabel}>Version</Text>
            <Text style={styles.runtimeValue}>{AppConfig.version}</Text>
          </View>
          <View>
            <Text style={styles.runtimeLabel}>Platform</Text>
            <Text style={styles.runtimeValue}>{Platform.OS}</Text>
          </View>
          <View>
            <Text style={styles.runtimeLabel}>Mode</Text>
            <Text style={[styles.runtimeValue, styles.warningText]}>{__DEV__ ? 'DEV' : 'PROD'}</Text>
          </View>
        </View>

        {SECTIONS.map((section) => {
          const items = CONFIG_CHECKLIST.filter((item) => item.section === section);
          return (
            <View key={section}>
              <SectionHeader title={section} items={items} />
              <View style={styles.card}>
                {items.map((item, index) => (
                  <View key={item.envKey}>
                    <ConfigRow item={item} />
                    {index < items.length - 1 ? <Divider /> : null}
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.sectionHeaderStandalone}>
          <Text style={styles.sectionTitle}>Store Submission</Text>
        </View>
        <View style={[styles.card, styles.storeCard]}>
          {STORE_KEYS.map((item) => (
            <View key={item.label} style={styles.storeRow}>
              <Feather name="lock" size={14} color={COLORS.muted} style={styles.storeIcon} />
              <View style={styles.storeTextWrap}>
                <Text style={styles.storeKey}>{item.label}</Text>
                <Text style={styles.storeNote}>{item.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to configure</Text>
          <Text style={styles.infoBody}>
            1. Copy <Text style={styles.code}>.env.example</Text> {'->'} <Text style={styles.code}>.env</Text>{'\n'}
            2. Fill in real values for each missing key{'\n'}
            3. Rebuild the app (<Text style={styles.code}>npx expo start</Text>){'\n'}
            4. For production: set values in EAS {'->'} Secrets
          </Text>
          <Pressable onPress={handleCopyTemplate} style={({ pressed }) => [styles.primaryButton, pressed && styles.rowPressed]}>
            <Text style={styles.primaryButtonText}>Copy .env Template</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeReady: {
    backgroundColor: COLORS.successTint,
  },
  statusBadgeMissing: {
    backgroundColor: COLORS.errorTint,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusReadyText: {
    color: COLORS.success,
  },
  statusMissingText: {
    color: COLORS.error,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  runtimeCard: {
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  runtimeLabel: {
    color: COLORS.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  runtimeValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryText: {
    color: COLORS.primary,
  },
  warningText: {
    color: COLORS.warning,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderStandalone: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missingBadge: {
    borderRadius: 999,
    backgroundColor: COLORS.errorTint,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  missingBadgeText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.72,
  },
  iconSlot: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  optionalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  rowLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  rowValue: {
    maxWidth: '48%',
    marginLeft: 8,
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  rowValueError: {
    color: COLORS.error,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  storeCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  storeIcon: {
    marginTop: 2,
  },
  storeTextWrap: {
    flex: 1,
  },
  storeKey: {
    color: COLORS.text,
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  storeNote: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryTint,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoBody: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
  code: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  primaryButton: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
