/**
 * Centralized App Configuration
 * ──────────────────────────────
 * Before shipping: copy .env.example → .env and fill in real values.
 * All EXPO_PUBLIC_* vars are embedded at build time (client-visible).
 * Private keys (EAS token, store creds, AWS secret keys) → GitHub Secrets only.
 *
 * Developer config panel: Profile → Developer Settings (visible in __DEV__ only)
 */

export const AppConfig = {
  env: (process.env.EXPO_PUBLIC_ENV ?? 'development') as 'development' | 'staging' | 'production',
  version: '1.0.0',

  // ── AWS ────────────────────────────────────────────────────────────────────
  aws: {
    region:        process.env.EXPO_PUBLIC_AWS_REGION        ?? 'us-east-1',
    apiUrl:        process.env.EXPO_PUBLIC_API_URL           ?? 'https://dev.api.awslearn.app',
    cloudfrontUrl: process.env.EXPO_PUBLIC_CLOUDFRONT_URL    ?? 'https://dev.cdn.awslearn.app',
    cognito: {
      userPoolId:  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ?? '',
      clientId:    process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID    ?? '',
    },
  },

  // ── AdMob ──────────────────────────────────────────────────────────────────
  // Note: app.json plugin IDs are the Google test IDs (ca-app-pub-3940...)
  // The ad unit IDs below are for individual banner/interstitial placements.
  admob: {
    ios: {
      bannerId:        process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER         ?? '',
      interstitialId:  process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL   ?? '',
    },
    android: {
      bannerId:        process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER         ?? '',
      interstitialId:  process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL   ?? '',
    },
  },

  // ── EAS / CI-CD ────────────────────────────────────────────────────────────
  eas: {
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** True if the string has been set to a real value (non-empty, no placeholder markers) */
export const isSet = (v: string) =>
  v.length > 0 && !v.includes('XXXXXXX') && !v.startsWith('TODO');

/** Mask a value for display: shows first 8 + last 4 chars for long secrets */
export const maskValue = (v: string): string => {
  if (!v) return '';
  if (v.length <= 14) return v;
  return `${v.slice(0, 8)}…${v.slice(-4)}`;
};

// ── Required config checklist ─────────────────────────────────────────────────

export interface ConfigItem {
  section: string;
  label: string;
  value: string;
  required: boolean;
  envKey: string;
}

export const CONFIG_CHECKLIST: ConfigItem[] = [
  // App
  { section: 'App',          label: 'EAS Project ID',          value: AppConfig.eas.projectId,                     required: true,  envKey: 'EXPO_PUBLIC_EAS_PROJECT_ID' },
  // AWS
  { section: 'AWS / Cognito', label: 'API URL',                value: AppConfig.aws.apiUrl,                        required: false, envKey: 'EXPO_PUBLIC_API_URL' },
  { section: 'AWS / Cognito', label: 'CloudFront URL',         value: AppConfig.aws.cloudfrontUrl,                 required: false, envKey: 'EXPO_PUBLIC_CLOUDFRONT_URL' },
  { section: 'AWS / Cognito', label: 'Cognito User Pool ID',   value: AppConfig.aws.cognito.userPoolId,            required: true,  envKey: 'EXPO_PUBLIC_COGNITO_USER_POOL_ID' },
  { section: 'AWS / Cognito', label: 'Cognito Client ID',      value: AppConfig.aws.cognito.clientId,              required: true,  envKey: 'EXPO_PUBLIC_COGNITO_CLIENT_ID' },
  // AdMob iOS
  { section: 'AdMob · iOS',  label: 'Banner Unit ID',          value: AppConfig.admob.ios.bannerId,                required: true,  envKey: 'EXPO_PUBLIC_ADMOB_IOS_BANNER' },
  { section: 'AdMob · iOS',  label: 'Interstitial Unit ID',    value: AppConfig.admob.ios.interstitialId,          required: true,  envKey: 'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL' },
  // AdMob Android
  { section: 'AdMob · Android', label: 'Banner Unit ID',       value: AppConfig.admob.android.bannerId,            required: true,  envKey: 'EXPO_PUBLIC_ADMOB_ANDROID_BANNER' },
  { section: 'AdMob · Android', label: 'Interstitial Unit ID', value: AppConfig.admob.android.interstitialId,      required: true,  envKey: 'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL' },
];

export const getMissingCount = () =>
  CONFIG_CHECKLIST.filter((c) => c.required && !isSet(c.value)).length;
