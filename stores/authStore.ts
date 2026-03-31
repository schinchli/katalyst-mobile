/**
 * Auth Store
 * ──────────
 * Wraps Supabase auth with a Zustand store.
 * Reads profile from user_profiles + subscriptions + unlocked_courses tables.
 * Falls back gracefully to Guest/Demo mode when Supabase is not configured.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/config/supabase';
import { saveSubscription, getUnlockedCourses, recordPurchase } from '@/config/db';
import type { User } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthStep =
  | 'idle'
  | 'confirm_signup'
  | 'forgot_password'
  | 'authenticated'
  | 'guest';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  step: AuthStep;
  pendingEmail: string;
  /** True if this user has purchased the "remove ads" entitlement */
  adsRemoved: boolean;
  /** Cleanup fn returned by onAuthStateChange — called before sign-out to prevent listener accumulation */
  _authUnsubscribe: (() => void) | null;

  initAuth: () => Promise<void>;
  signInUser: (email: string, password: string) => Promise<void>;
  signUpUser: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmNewPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  setGuestUser: () => void;
  upgradeToPremium: (plan?: string) => Promise<void>;
  unlockCourse: (courseId: string, purchaseAmount?: number) => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const GUEST_USER: User = {
  id: 'guest',
  email: 'guest@awslearn.app',
  name: 'Guest User',
  subscription: 'free',
  createdAt: new Date().toISOString(),
};

async function buildUserFromSession(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const sbUser = session.user;

  // Fetch profile name + ads_removed from user_profiles
  // DB migration required:
  // ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ads_removed boolean DEFAULT false;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name, role, ads_removed')
    .eq('id', sbUser.id)
    .single();

  // Fetch subscription tier from subscriptions table
  const { data: subRow } = await supabase
    .from('subscriptions')
    .select('tier, plan')
    .eq('user_id', sbUser.id)
    .single();

  // Check local SecureStore override (optimistic update before DB sync)
  const localSub = await SecureStore.getItemAsync('auth_subscription').catch(() => null);
  const subscription: User['subscription'] =
    localSub === 'premium'
      ? 'premium'
      : (subRow?.tier as User['subscription']) ?? 'free';

  // Fetch unlocked courses from unlocked_courses table
  let unlockedCourses = await getUnlockedCourses(sbUser.id).catch(() => [] as string[]);
  if (unlockedCourses.length === 0) {
    try {
      const local = await SecureStore.getItemAsync('auth_unlocked_courses');
      if (local) unlockedCourses = JSON.parse(local) as string[];
    } catch {
      // non-fatal
    }
  }

  return {
    id:              sbUser.id,
    email:           sbUser.email ?? '',
    name:            profile?.name ?? sbUser.user_metadata?.name ?? sbUser.email?.split('@')[0] ?? 'User',
    role:            profile?.role ?? 'Student',
    subscription,
    unlockedCourses,
    createdAt:       sbUser.created_at ?? new Date().toISOString(),
  };
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  step: 'idle',
  pendingEmail: '',
  adsRemoved: false,
  _authUnsubscribe: null,

  initAuth: async () => {
    // Unsubscribe any existing listener before registering a new one,
    // preventing duplicate callbacks if initAuth is ever called more than once.
    get()._authUnsubscribe?.();

    set({ isLoading: true });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await buildUserFromSession();
        if (user) {
          const { data: pRow } = await supabase.from('user_profiles').select('ads_removed').eq('id', session.user.id).maybeSingle();
          const adsRemoved = (pRow as { ads_removed?: boolean } | null)?.ads_removed ?? false;
          set({ user, isAuthenticated: true, step: 'authenticated', isLoading: false, adsRemoved });
        }
      } else {
        const guest = await SecureStore.getItemAsync('auth_guest').catch(() => null);
        if (guest === 'true') {
          set({ user: GUEST_USER, isAuthenticated: true, step: 'guest', isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, step: 'idle', isLoading: false });
        }
      }
    });

    set({ _authUnsubscribe: () => subscription.unsubscribe() });

    try {
      const user = await buildUserFromSession();
      if (user) {
        set({ user, isAuthenticated: true, step: 'authenticated', isLoading: false });
      } else {
        const guest = await SecureStore.getItemAsync('auth_guest').catch(() => null);
        if (guest === 'true') {
          set({ user: GUEST_USER, isAuthenticated: true, step: 'guest', isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signInUser: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.user) {
      const user = await buildUserFromSession();
      if (user) set({ user, isAuthenticated: true, step: 'authenticated' });
    }
  },

  signUpUser: async (name, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    set({ step: 'confirm_signup', pendingEmail: email });
  },

  signInWithGoogle: async () => {
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw new Error(error.message);
    // For mobile, Supabase handles redirect; session listener in initAuth will pick up user.
    if (!data) throw new Error('Redirect to Google failed');
  },

  confirmEmail: async (email, code) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw new Error(error.message);
    set({ step: 'idle', pendingEmail: '' });
  },

  resendCode: async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(error.message);
  },

  forgotPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
    set({ step: 'forgot_password', pendingEmail: email });
  },

  confirmNewPassword: async (_email, _code, newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    set({ step: 'idle', pendingEmail: '' });
  },

  signOutUser: async () => {
    get()._authUnsubscribe?.();
    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync('auth_guest');
      await SecureStore.deleteItemAsync('auth_subscription');
      await SecureStore.deleteItemAsync('auth_unlocked_courses');
    } catch {
      // best-effort cleanup
    }
    set({ user: null, isAuthenticated: false, step: 'idle', _authUnsubscribe: null });
  },

  setGuestUser: () => {
    SecureStore.setItemAsync('auth_guest', 'true').catch(() => {});
    set({ user: GUEST_USER, isAuthenticated: true, step: 'guest' });
  },

  upgradeToPremium: async (plan?: string) => {
    const current = get().user;
    if (!current) return;
    const previousSubscription = current.subscription;
    // Optimistic update
    set({ user: { ...current, subscription: 'premium' } });
    await SecureStore.setItemAsync('auth_subscription', 'premium').catch(() => {});
    try {
      // Write to subscriptions table (critical — rollback on failure)
      await saveSubscription(current.id, 'premium', plan);
      // Record purchase audit (non-critical — swallow errors)
      if (plan) {
        await recordPurchase(current.id, {
          purchaseType: 'subscription',
          plan,
          amount: plan === 'annual' ? 999 : 149,
          date: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch {
      // DB write failed — rollback optimistic state
      set({ user: { ...get().user!, subscription: previousSubscription } });
      await SecureStore.deleteItemAsync('auth_subscription').catch(() => {});
      throw new Error('Failed to activate subscription. Please try again.');
    }
  },

  unlockCourse: async (courseId: string, purchaseAmount = 0) => {
    const current = get().user;
    if (!current) return;
    const existing = current.unlockedCourses ?? [];
    if (existing.includes(courseId)) return;
    const updated = [...existing, courseId];
    set({ user: { ...current, unlockedCourses: updated } });
    await SecureStore.setItemAsync('auth_unlocked_courses', JSON.stringify(updated)).catch(() => {});
    // Write to both unlocked_courses table and profiles (via RPC for array sync)
    await supabase.rpc('append_unlocked_course', { user_id: current.id, course_id: courseId }).then(undefined, () => {});
    // Record purchase audit if there was a cost
    if (purchaseAmount > 0) {
      await recordPurchase(current.id, {
        purchaseType: 'course',
        courseId,
        amount: purchaseAmount,
        date: new Date().toISOString(),
      }).catch(() => {});
    }
  },

  setUser:    (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  // Optimistic logout: clear state immediately for instant UX, then clean up async resources
  signOut: () => {
    get()._authUnsubscribe?.();
    set({ user: null, isAuthenticated: false, step: 'idle', isLoading: false, _authUnsubscribe: null });
    Promise.all([
      supabase.auth.signOut(),
      SecureStore.deleteItemAsync('auth_guest').catch(() => {}),
      SecureStore.deleteItemAsync('auth_subscription').catch(() => {}),
      SecureStore.deleteItemAsync('auth_unlocked_courses').catch(() => {}),
    ]).catch(() => { /* best-effort cleanup */ });
  },
}));
