import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Legacy search tab is consolidated into the Quizzes screen.
 * Redirect here to keep deep links stable without rendering UI.
 */
export default function SearchRedirect() {
  useEffect(() => {
    router.replace('/quizzes');
  }, []);
  return null;
}
