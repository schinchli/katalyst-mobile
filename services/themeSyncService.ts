import { supabase } from '@/config/supabase';
import { useThemeStore, type AccentPreset } from '@/stores/themeStore';

const PLATFORM_THEME_KEY = 'platform_theme';
const USER_THEME_DEFAULT = { usePlatform: true, accent: 'aurora' as AccentPreset };

interface PlatformThemeConfig {
  presetId?: string;
}

interface UserThemePref {
  usePlatform?: boolean;
  accent?: string;
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
  const { accent, usePlatform, setAccent } = useThemeStore.getState();
  if (!usePlatform) return;
  if (accent !== nextAccent) setAccent(nextAccent);
}

export async function syncUserThemeFromSupabase(userId: string) {
  if (!userId) return;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('theme_pref')
    .eq('id', userId)
    .maybeSingle();
  if (error) return;
  const pref = (data?.theme_pref as UserThemePref | null) ?? USER_THEME_DEFAULT;
  const { setUsePlatform, setAccent, usePlatform, accent } = useThemeStore.getState();
  if (typeof pref.usePlatform === 'boolean') setUsePlatform(pref.usePlatform);
  if (pref.accent && Object.values(PRESET_TO_ACCENT).includes(pref.accent as AccentPreset)) {
    if (pref.accent !== accent) setAccent(pref.accent as AccentPreset);
  }
}

export async function saveUserThemeToSupabase(userId: string) {
  if (!userId) return;
  const { usePlatform, accent } = useThemeStore.getState();
  await supabase
    .from('user_profiles')
    .update({ theme_pref: { usePlatform, accent } })
    .eq('id', userId);
}
