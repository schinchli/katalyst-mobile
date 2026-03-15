import { supabase } from '@/config/supabase';
import { applyManagedQuizContent, MANAGED_QUIZ_CONTENT_KEY } from '@/config/managedQuizContent';

export async function syncManagedQuizContentFromSupabase(): Promise<void> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MANAGED_QUIZ_CONTENT_KEY)
    .maybeSingle();

  applyManagedQuizContent(data?.value);
}
