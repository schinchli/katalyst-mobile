import { supabase } from '@/config/supabase';
import { applyQuizCatalogOverrides, QUIZ_CATALOG_OVERRIDES_KEY } from '@/config/quizCatalog';

export async function syncQuizCatalogOverridesFromSupabase(): Promise<void> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', QUIZ_CATALOG_OVERRIDES_KEY)
    .maybeSingle();

  applyQuizCatalogOverrides(data?.value);
}
