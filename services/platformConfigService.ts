import { supabase } from '@/config/supabase';
import { AppConfig } from '@/config/appConfig';
import { MOBILE_PLATFORM_CONFIG_KEY, normalizeMobilePlatformConfig, type MobilePlatformConfig } from '@/config/platformExperience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';
import { useThemeStore } from '@/stores/themeStore';

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function syncPlatformConfigFromSupabase(): Promise<void> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MOBILE_PLATFORM_CONFIG_KEY)
    .maybeSingle();

  const nextConfig = normalizeMobilePlatformConfig(data?.value);
  usePlatformConfigStore.getState().setConfig(nextConfig);

  if (error) return;

  const theme = useThemeStore.getState();
  if (theme.usePlatform && theme.accent !== nextConfig.theme.platformAccent) {
    theme.setAccent(nextConfig.theme.platformAccent);
  }
}

export async function savePlatformConfigAsAdmin(config: MobilePlatformConfig): Promise<void> {
  if (!AppConfig.web.baseUrl) throw new Error('EXPO_PUBLIC_WEB_URL is not configured');
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthorized');

  const res = await fetch(`${AppConfig.web.baseUrl.replace(/\/$/, '')}/api/admin/mobile-config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || 'Failed to save mobile config');
  }

  usePlatformConfigStore.getState().setConfig(config);
}
