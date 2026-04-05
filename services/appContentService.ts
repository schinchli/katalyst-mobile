import { supabase } from '@/config/supabase';
import { APP_CONTENT_KEY, DEFAULT_APP_CONTENT, normalizeAppContent, type AppContentConfig } from '@/config/appContent';

export async function fetchManagedAppContent(): Promise<AppContentConfig> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', APP_CONTENT_KEY)
    .maybeSingle();

  if (error) return DEFAULT_APP_CONTENT;
  return normalizeAppContent(data?.value);
}
