/**
 * Centralized App Configuration
 * ──────────────────────────────
 * Before shipping: copy .env.example → .env and fill in real values.
 * All EXPO_PUBLIC_* vars are embedded at build time (client-visible).
 * Private keys (EAS token, store creds, Razorpay secret) → GitHub Secrets only.
 *
 * Developer config panel: Profile → Developer Settings (visible in __DEV__ only)
 */

export const AppConfig = {
  env: (process.env.EXPO_PUBLIC_ENV ?? 'development') as 'development' | 'staging' | 'production',
  version: '1.0.0',

  // ── Supabase ────────────────────────────────────────────────────────────────
  supabase: {
    url:          process.env.EXPO_PUBLIC_SUPABASE_URL          ?? '',
    anonKey:      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY     ?? '',
    functionsUrl: process.env.EXPO_PUBLIC_API_URL               ?? '',
  },

  // ── AdMob ──────────────────────────────────────────────────────────────────
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
  web: {
    baseUrl: process.env.EXPO_PUBLIC_WEB_URL ?? '',
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
  { section: 'App',         label: 'EAS Project ID',        value: AppConfig.eas.projectId,           required: true,  envKey: 'EXPO_PUBLIC_EAS_PROJECT_ID' },
  // Supabase
  { section: 'Supabase',    label: 'Supabase URL',           value: AppConfig.supabase.url,            required: true,  envKey: 'EXPO_PUBLIC_SUPABASE_URL' },
  { section: 'Supabase',    label: 'Supabase Anon Key',      value: AppConfig.supabase.anonKey,        required: true,  envKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY' },
  { section: 'Supabase',    label: 'Functions URL',          value: AppConfig.supabase.functionsUrl,   required: false, envKey: 'EXPO_PUBLIC_API_URL' },
  // AdMob iOS
  { section: 'AdMob · iOS', label: 'Banner Unit ID',         value: AppConfig.admob.ios.bannerId,      required: true,  envKey: 'EXPO_PUBLIC_ADMOB_IOS_BANNER' },
  { section: 'AdMob · iOS', label: 'Interstitial Unit ID',   value: AppConfig.admob.ios.interstitialId, required: true, envKey: 'EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL' },
  // AdMob Android
  { section: 'AdMob · Android', label: 'Banner Unit ID',     value: AppConfig.admob.android.bannerId,      required: true, envKey: 'EXPO_PUBLIC_ADMOB_ANDROID_BANNER' },
  { section: 'AdMob · Android', label: 'Interstitial Unit ID', value: AppConfig.admob.android.interstitialId, required: true, envKey: 'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL' },
];

export const getMissingCount = () =>
  CONFIG_CHECKLIST.filter((c) => c.required && !isSet(c.value)).length;
