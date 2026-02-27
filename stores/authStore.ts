/**
 * Auth Store
 * ──────────
 * Wraps Amplify v6 Cognito auth with a Zustand store.
 * Falls back gracefully to Guest/Demo mode when Cognito is not configured.
 */

import { create } from 'zustand';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  fetchAuthSession,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  type SignInOutput,
} from 'aws-amplify/auth';
import * as SecureStore from 'expo-secure-store';
import { isAmplifyReady } from '@/config/amplify';
import type { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthStep =
  | 'idle'
  | 'confirm_signup'    // waiting for email verification code
  | 'forgot_password'   // password reset code sent
  | 'authenticated'
  | 'guest';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  step: AuthStep;
  pendingEmail: string;       // stored during sign-up → confirm flow

  // Actions
  initAuth: () => Promise<void>;
  signInUser: (email: string, password: string) => Promise<void>;
  signUpUser: (name: string, email: string, password: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmNewPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setGuestUser: () => void;
  setUser: (user: User | null) => void;   // kept for backwards compat
  setLoading: (loading: boolean) => void;
  signOut: () => void;                    // alias kept for backwards compat
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const GUEST_USER: User = {
  id: 'guest',
  email: 'guest@awslearn.app',
  name: 'Guest User',
  subscription: 'free',
  createdAt: new Date().toISOString(),
};

function parseError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  step: 'idle',
  pendingEmail: '',

  // ── Init: restore session from Cognito tokens in SecureStore ──────────────
  initAuth: async () => {
    set({ isLoading: true });
    try {
      if (!isAmplifyReady()) {
        // No Cognito configured — check if we had a guest session
        const guest = await SecureStore.getItemAsync('auth_guest');
        if (guest === 'true') {
          set({ user: GUEST_USER, isAuthenticated: true, step: 'guest', isLoading: false });
          return;
        }
        set({ isLoading: false });
        return;
      }

      const session = await fetchAuthSession();
      if (session.tokens?.idToken) {
        const attrs = await fetchUserAttributes();
        const user: User = {
          id: attrs.sub ?? 'unknown',
          email: attrs.email ?? '',
          name: attrs.name ?? attrs.email?.split('@')[0] ?? 'User',
          subscription: (attrs['custom:subscription'] as User['subscription']) ?? 'free',
          createdAt: attrs['custom:createdAt'] ?? new Date().toISOString(),
        };
        set({ user, isAuthenticated: true, step: 'authenticated', isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Sign In ───────────────────────────────────────────────────────────────
  signInUser: async (email, password) => {
    if (!isAmplifyReady()) throw new Error('AWS not configured. Use Guest mode.');

    const output: SignInOutput = await signIn({ username: email, password });

    if (output.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      set({ step: 'confirm_signup', pendingEmail: email });
      throw new Error('Please verify your email first.');
    }

    if (output.isSignedIn) {
      const attrs = await fetchUserAttributes();
      const user: User = {
        id: attrs.sub ?? 'unknown',
        email: attrs.email ?? email,
        name: attrs.name ?? email.split('@')[0],
        subscription: (attrs['custom:subscription'] as User['subscription']) ?? 'free',
        createdAt: attrs['custom:createdAt'] ?? new Date().toISOString(),
      };
      set({ user, isAuthenticated: true, step: 'authenticated' });
    }
  },

  // ── Sign Up ───────────────────────────────────────────────────────────────
  signUpUser: async (name, email, password) => {
    if (!isAmplifyReady()) throw new Error('AWS not configured. Use Guest mode.');

    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
          'custom:subscription': 'free',
          'custom:createdAt': new Date().toISOString(),
        },
      },
    });

    set({ step: 'confirm_signup', pendingEmail: email });
  },

  // ── Confirm email verification code ──────────────────────────────────────
  confirmEmail: async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code });
    set({ step: 'idle', pendingEmail: '' });
  },

  // ── Resend verification code ──────────────────────────────────────────────
  resendCode: async (email) => {
    await resendSignUpCode({ username: email });
  },

  // ── Forgot password ───────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    await resetPassword({ username: email });
    set({ step: 'forgot_password', pendingEmail: email });
  },

  confirmNewPassword: async (email, code, newPassword) => {
    await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
    set({ step: 'idle', pendingEmail: '' });
  },

  // ── Sign Out ──────────────────────────────────────────────────────────────
  signOutUser: async () => {
    try {
      if (isAmplifyReady()) await signOut();
      await SecureStore.deleteItemAsync('auth_guest');
    } catch {
      // best-effort cleanup
    }
    set({ user: null, isAuthenticated: false, step: 'idle' });
  },

  // ── Guest mode ────────────────────────────────────────────────────────────
  setGuestUser: () => {
    SecureStore.setItemAsync('auth_guest', 'true').catch(() => {});
    set({ user: GUEST_USER, isAuthenticated: true, step: 'guest' });
  },

  // ── Backwards-compat helpers ──────────────────────────────────────────────
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => {
    get().signOutUser().catch(() => {});
  },
}));
