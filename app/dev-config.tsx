import { View, Text, ScrollView, Pressable, Alert, Platform, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppConfig, CONFIG_CHECKLIST, ConfigItem, getMissingCount, isSet, maskValue } from '@/config/appConfig';

// Guard: never render in production builds
if (!__DEV__) {
  router.replace('/(tabs)');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusIcon(item: ConfigItem) {
  if (!item.required) return null;        // optional: no status icon
  return isSet(item.value) ? 'check-circle' : 'alert-circle';
}

function statusColor(item: ConfigItem) {
  if (!item.required) return '#9EA1BA';   // muted grey for optional
  return isSet(item.value) ? '#28C76F' : '#FF4C51';
}

function displayValue(item: ConfigItem) {
  if (!item.value || item.value.length === 0) {
    return item.required ? 'NOT SET' : 'using default';
  }
  return maskValue(item.value);
}

// ── Section groups ─────────────────────────────────────────────────────────────

const SECTIONS = ['App', 'AWS / Cognito', 'AdMob · iOS', 'AdMob · Android'];

const ENV_TEMPLATE = `# Copy to .env and fill in real values
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_EAS_PROJECT_ID=
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_API_URL=https://api.awslearn.app
EXPO_PUBLIC_CLOUDFRONT_URL=https://cdn.awslearn.app
EXPO_PUBLIC_COGNITO_USER_POOL_ID=
EXPO_PUBLIC_COGNITO_CLIENT_ID=
EXPO_PUBLIC_ADMOB_IOS_BANNER=
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL=
EXPO_PUBLIC_ADMOB_ANDROID_BANNER=
EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL=`;

// ── Components ────────────────────────────────────────────────────────────────

function SectionHeader({ title, items }: { title: string; items: ConfigItem[] }) {
  const missing = items.filter((i) => i.required && !isSet(i.value)).length;
  return (
    <View className="flex-row items-center justify-between mt-5 mb-2 px-1">
      <Text className="text-[13px] font-semibold text-app-muted dark:text-app-muted-dark uppercase tracking-widest">
        {title}
      </Text>
      {missing > 0 && (
        <View className="bg-app-error-tint rounded-full px-2 py-0.5">
          <Text className="text-[11px] font-bold text-app-error">{missing} missing</Text>
        </View>
      )}
    </View>
  );
}

function ConfigRow({ item }: { item: ConfigItem }) {
  const icon   = statusIcon(item);
  const color  = statusColor(item);
  const val    = displayValue(item);
  const unset  = item.required && !isSet(item.value);

  const handleCopyKey = async () => {
    await Share.share({ message: item.envKey });
  };

  return (
    <Pressable
      onPress={handleCopyKey}
      className="flex-row items-center px-4 py-3 active:opacity-70"
    >
      {/* Status dot */}
      <View className="w-6 items-center mr-3">
        {icon ? (
          <Feather name={icon as any} size={16} color={color} />
        ) : (
          <View className="w-1.5 h-1.5 rounded-full bg-app-border dark:bg-app-border-dark" />
        )}
      </View>

      {/* Label */}
      <Text className="flex-1 text-[14px] text-app-text dark:text-app-text-dark">
        {item.label}
      </Text>

      {/* Value */}
      <Text
        className={`text-[12px] font-mono ml-2 ${
          unset
            ? 'text-app-error font-semibold'
            : 'text-app-muted dark:text-app-muted-dark'
        }`}
        numberOfLines={1}
      >
        {val}
      </Text>
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-app-border dark:bg-app-border-dark mx-4" />;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DevConfigScreen() {
  const missing = getMissingCount();

  const handleCopyTemplate = async () => {
    await Share.share({
      message: ENV_TEMPLATE,
      title: '.env Template',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark" edges={['top']}>

      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4 border-b border-app-border dark:border-app-border-dark">
        <Pressable onPress={() => router.back()} className="mr-3 p-1 active:opacity-60">
          <Feather name="x" size={22} color="#7367F0" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-[18px] font-bold text-app-text dark:text-app-text-dark">
            Developer Config
          </Text>
          <Text className="text-[12px] text-app-muted dark:text-app-muted-dark">
            Tap any row to copy its .env key name
          </Text>
        </View>
        {/* Overall badge */}
        <View className={`px-3 py-1 rounded-full ${missing === 0 ? 'bg-app-success-tint' : 'bg-app-error-tint'}`}>
          <Text className={`text-[12px] font-bold ${missing === 0 ? 'text-app-success' : 'text-app-error'}`}>
            {missing === 0 ? 'Ready' : `${missing} missing`}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>

        {/* Runtime info row */}
        <View className="bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark rounded-2xl mt-4 mb-1 px-4 py-3 flex-row gap-6">
          <View>
            <Text className="text-[11px] text-app-muted dark:text-app-muted-dark uppercase tracking-wider">Env</Text>
            <Text className="text-[14px] font-semibold text-app-primary">{AppConfig.env}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-app-muted dark:text-app-muted-dark uppercase tracking-wider">Version</Text>
            <Text className="text-[14px] font-semibold text-app-text dark:text-app-text-dark">{AppConfig.version}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-app-muted dark:text-app-muted-dark uppercase tracking-wider">Platform</Text>
            <Text className="text-[14px] font-semibold text-app-text dark:text-app-text-dark">{Platform.OS}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-app-muted dark:text-app-muted-dark uppercase tracking-wider">Mode</Text>
            <Text className="text-[14px] font-semibold text-app-warning">{__DEV__ ? 'DEV' : 'PROD'}</Text>
          </View>
        </View>

        {/* Config sections */}
        {SECTIONS.map((section) => {
          const items = CONFIG_CHECKLIST.filter((c) => c.section === section);
          return (
            <View key={section}>
              <SectionHeader title={section} items={items} />
              <View className="bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark rounded-2xl overflow-hidden">
                {items.map((item, idx) => (
                  <View key={item.envKey}>
                    <ConfigRow item={item} />
                    {idx < items.length - 1 && <Divider />}
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Store credentials note */}
        <View className="mt-5 mb-2 px-1">
          <Text className="text-[13px] font-semibold text-app-muted dark:text-app-muted-dark uppercase tracking-widest">
            Store Submission
          </Text>
        </View>
        <View className="bg-app-surface dark:bg-app-surface-dark border border-app-border dark:border-app-border-dark rounded-2xl px-4 py-4 gap-2">
          {[
            { label: 'EXPO_TOKEN',                  note: 'EAS authentication → GitHub Secret' },
            { label: 'APPLE_ID',                    note: 'Apple Developer account → GitHub Secret' },
            { label: 'APPLE_APP_SPECIFIC_PASSWORD', note: 'App-specific password → GitHub Secret' },
            { label: 'GOOGLE_SERVICE_ACCOUNT_KEY',  note: 'JSON key file → GitHub Secret' },
          ].map((s) => (
            <View key={s.label} className="flex-row items-start gap-3">
              <Feather name="lock" size={14} color="#9EA1BA" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-[13px] font-mono text-app-text dark:text-app-text-dark">{s.label}</Text>
                <Text className="text-[11px] text-app-muted dark:text-app-muted-dark">{s.note}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer / CTA */}
        <View className="mt-6 bg-app-primary-faint dark:bg-app-primary-faint-dark border border-app-primary rounded-2xl px-4 py-4">
          <Text className="text-[14px] font-semibold text-app-primary mb-1">
            How to configure
          </Text>
          <Text className="text-[13px] text-app-text dark:text-app-text-dark leading-5">
            1. Copy <Text className="font-mono">.env.example</Text> → <Text className="font-mono">.env</Text>{'\n'}
            2. Fill in real values for each missing key{'\n'}
            3. Rebuild the app (<Text className="font-mono">npx expo start</Text>){'\n'}
            4. For production: set values in EAS → Secrets
          </Text>
          <Pressable
            onPress={handleCopyTemplate}
            className="mt-3 bg-app-primary rounded-xl px-4 py-2.5 items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-[14px]">Copy .env Template</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
