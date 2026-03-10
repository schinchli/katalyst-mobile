import { supabase } from '@/config/supabase';
import { useThemeStore, type AccentPreset } from '@/stores/themeStore';

const PLATFORM_THEME_KEY = 'platform_theme';

interface PlatformThemeConfig {
  presetId?: string;
}

const PRESET_TO_ACCENT: Record<string, AccentPreset> = {
  aurora: 'aurora',
  sandstone: 'sand',
  midnight: 'midnight',
};

export async function syncPlatformThemeFromSupabase(): Promise<void> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', PLATFORM_THEME_KEY)
    .maybeSingle();

  if (error || !data?.value) return;

  const cfg = data.value as PlatformThemeConfig;
  const nextAccent = PRESET_TO_ACCENT[cfg.presetId ?? ''] ?? 'aurora';
  const { accent, setAccent } = useThemeStore.getState();
  if (accent !== nextAccent) setAccent(nextAccent);
}

