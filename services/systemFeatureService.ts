import { supabase } from '@/config/supabase';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, SYSTEM_FEATURES_KEY, type SystemFeaturesConfig } from '@/config/systemFeatures';
import { AppConfig } from '@/config/appConfig';
import { useSystemFeatureStore } from '@/stores/systemFeatureStore';

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function syncSystemFeaturesFromSupabase(): Promise<void> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', SYSTEM_FEATURES_KEY)
    .maybeSingle();

  useSystemFeatureStore.getState().setConfig(error ? DEFAULT_SYSTEM_FEATURES : data?.value);
}

export async function saveSystemFeaturesAsAdmin(config: SystemFeaturesConfig): Promise<void> {
  if (!AppConfig.web.baseUrl) throw new Error('EXPO_PUBLIC_WEB_URL is not configured');
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const res = await fetch(`${AppConfig.web.baseUrl.replace(/\/$/, '')}/api/admin/system-features`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Failed to save system features');
  }

  useSystemFeatureStore.getState().setConfig(config);
}
