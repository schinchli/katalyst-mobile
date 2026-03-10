/**
 * Razorpay Payment Service
 * ────────────────────────
 * Handles Razorpay checkout for Pro subscription upgrades and course unlocks.
 *
 * Architecture:
 *   1. Call Supabase Edge Function `POST /functions/v1/create-order` → Razorpay order created
 *   2. Open Razorpay hosted checkout via expo-web-browser
 *      (deep-link callback: katalyst://payment?status=success&payment_id=...)
 *   3. Call Edge Function `POST /functions/v1/verify-payment` with signature to confirm payment
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AppConfig } from '@/config/appConfig';
import { supabase } from '@/config/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RazorpayOrder {
  orderId: string;
  amount: number;       // paise (₹999 = 99900)
  currency: string;
  keyId: string;        // Razorpay key_id (public)
  purchaseType?: 'subscription' | 'course';
  courseId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  courseId?: string;
  error?: string;
}

// ── Pricing constants ──────────────────────────────────────────────────────

export const PLANS = {
  annual:  { label: 'Annual',  price: 999,  paise: 99900,  save: 'Save 44%' },
  monthly: { label: 'Monthly', price: 149,  paise: 14900,  save: null },
} as const;

export type PlanKey = keyof typeof PLANS;

// ── Helpers ────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function edgeFnUrl(fnName: string): string {
  return `${AppConfig.supabase.functionsUrl.replace(/\/$/, '')}/${fnName}`;
}

// ── Core functions ─────────────────────────────────────────────────────────

/**
 * Create a Razorpay order for a subscription via the Edge Function.
 */
export async function createOrder(plan: PlanKey = 'annual'): Promise<RazorpayOrder | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(edgeFnUrl('create-order'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purchaseType: 'subscription', plan, amount: PLANS[plan].paise, currency: 'INR' }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<RazorpayOrder>;
  } catch {
    return null;
  }
}

/**
 * Create a Razorpay order for a one-time course unlock.
 */
export async function createCourseOrder(courseId: string, amountRupees: number): Promise<RazorpayOrder | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(edgeFnUrl('create-order'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purchaseType: 'course', courseId, amount: amountRupees * 100, currency: 'INR' }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<RazorpayOrder>;
  } catch {
    return null;
  }
}

/**
 * Verify payment signature with the Edge Function.
 */
export async function verifyPayment(
  paymentId: string,
  orderId: string,
  signature: string,
  purchaseType: 'subscription' | 'course' = 'subscription',
  courseId?: string,
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(edgeFnUrl('verify-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id:   orderId,
        razorpay_signature:  signature,
        purchaseType,
        courseId,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function openRazorpaySession(
  order: RazorpayOrder,
  description: string,
): Promise<{ paymentId: string; orderId: string; signature: string } | null> {
  const successUrl = Linking.createURL('payment', { queryParams: { status: 'success' } });
  const cancelUrl  = Linking.createURL('payment', { queryParams: { status: 'cancel' } });

  const checkoutUrl =
    `https://api.razorpay.com/v1/checkout/embedded?` +
    `key_id=${encodeURIComponent(order.keyId)}` +
    `&order_id=${encodeURIComponent(order.orderId)}` +
    `&amount=${order.amount}` +
    `&currency=${order.currency}` +
    `&name=${encodeURIComponent('Katalyst')}` +
    `&description=${encodeURIComponent(description)}` +
    `&callback_url=${encodeURIComponent(successUrl)}` +
    `&cancel_url=${encodeURIComponent(cancelUrl)}`;

  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, successUrl);
  if (result.type !== 'success') return null;

  const parsed    = Linking.parse(result.url);
  const status    = parsed.queryParams?.status as string | undefined;
  const paymentId = parsed.queryParams?.razorpay_payment_id as string | undefined;
  const orderId2  = parsed.queryParams?.razorpay_order_id as string | undefined;
  const sig       = parsed.queryParams?.razorpay_signature as string | undefined;

  if (status !== 'success' || !paymentId || !orderId2 || !sig) return null;
  return { paymentId, orderId: orderId2, signature: sig };
}

/**
 * Open Razorpay checkout for a Pro subscription and await the payment result.
 */
export async function openCheckout(plan: PlanKey = 'annual'): Promise<PaymentResult> {
  const order = await createOrder(plan);
  if (!order) return { success: false, error: 'Could not create payment order. Please try again.' };

  const payment = await openRazorpaySession(order, `Katalyst Pro — ${PLANS[plan].label} subscription`);
  if (!payment) return { success: false, error: 'Payment was cancelled.' };

  const verified = await verifyPayment(payment.paymentId, payment.orderId, payment.signature, 'subscription');
  if (!verified) return { success: false, error: 'Payment signature verification failed. Contact support.' };

  return { success: true, paymentId: payment.paymentId, orderId: payment.orderId, signature: payment.signature };
}

/**
 * Open Razorpay checkout for a one-time course unlock.
 */
export async function openCourseUnlock(courseId: string, amountRupees: number): Promise<PaymentResult> {
  const order = await createCourseOrder(courseId, amountRupees);
  if (!order) return { success: false, error: 'Could not create payment order. Please try again.' };

  const payment = await openRazorpaySession(order, `Katalyst — Unlock quiz`);
  if (!payment) return { success: false, error: 'Payment was cancelled.' };

  const verified = await verifyPayment(payment.paymentId, payment.orderId, payment.signature, 'course', courseId);
  if (!verified) return { success: false, error: 'Payment signature verification failed. Contact support.' };

  return { success: true, paymentId: payment.paymentId, orderId: payment.orderId, signature: payment.signature, courseId };
}
