/**
 * Amplify v6 configuration
 * ────────────────────────
 * Call `configureAmplify()` once at app startup (before any auth call).
 * Values come from EXPO_PUBLIC_* env vars → AppConfig.
 * If Cognito IDs are not yet set (pre-deploy), auth calls will throw
 * and the app falls back to Guest/Demo mode gracefully.
 */

import { Amplify } from 'aws-amplify';
import { AppConfig } from './appConfig';

let configured = false;

export function configureAmplify(): void {
  if (configured) return;
  configured = true;

  const { userPoolId, clientId } = AppConfig.aws.cognito;

  // Guard: skip if not deployed yet (dev without real AWS)
  if (!userPoolId || !clientId) {
    if (__DEV__) {
      console.warn(
        '[Amplify] Cognito IDs not set — auth disabled. ' +
        'Set EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID in .env',
      );
    }
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        loginWith: { email: true },
        signUpVerificationMethod: 'code',
      },
    },
  });
}

/** True if Cognito is configured and auth calls can succeed */
export const isAmplifyReady = (): boolean =>
  !!(AppConfig.aws.cognito.userPoolId && AppConfig.aws.cognito.clientId);
