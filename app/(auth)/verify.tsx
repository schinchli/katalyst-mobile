import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

export default function VerifyScreen() {
  const colors       = useThemeColors();
  const confirmEmail = useAuthStore((s) => s.confirmEmail);
  const resendCode   = useAuthStore((s) => s.resendCode);
  const signInUser   = useAuthStore((s) => s.signInUser);

  const { email = '' } = useLocalSearchParams<{ email: string }>();

  const [code, setCode]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmEmail(email, code.trim());
      // Code confirmed — navigate to login to sign in
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await resendCode(email);
      setSuccess('Verification code resent. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Header ──────────────────────────────────── */}
          <View style={styles.logoCard}>
            <View style={styles.iconWrap}>
              <Feather name="mail" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.logoTitle}>Check Your Email</Text>
            <Text style={styles.logoSubtitle}>
              We sent a 6-digit verification code to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────── */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.formHeading, { color: colors.text }]}>Enter Verification Code</Text>
            <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>
              The code expires in 10 minutes
            </Text>

            <Input
              label="6-digit code"
              placeholder="123456"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color="#EA5455" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successWrap}>
                <Feather name="check-circle" size={14} color="#28C76F" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Button
              title="Verify Email"
              onPress={handleVerify}
              loading={loading}
              size="lg"
              style={styles.verifyBtn}
            />

            <View style={styles.resendRow}>
              <Text style={[styles.resendPrompt, { color: colors.textSecondary }]}>Didn't receive it?</Text>
              <Pressable onPress={handleResend} disabled={resending}>
                <Text style={[styles.resendLink, { color: colors.primary, opacity: resending ? 0.5 : 1 }]}>
                  {resending ? 'Sending…' : 'Resend Code'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Back to login ────────────────────────────── */}
          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={14} color={colors.textSecondary} />
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back to Sign In</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  flex:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },

  /* ── Header card ── */
  logoCard: {
    backgroundColor: '#7367F0',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7367F0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoTitle:     { fontFamily: F.bold, fontSize: 24, color: '#FFFFFF', letterSpacing: 0.3 },
  logoSubtitle:  { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  emailHighlight: { fontFamily: F.semiBold, color: '#FFFFFF' },

  /* ── Form card ── */
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#4B465C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeading:    { fontFamily: F.bold,    fontSize: 20, marginBottom: 2 },
  formSubheading: { fontFamily: F.regular, fontSize: 14, marginBottom: 20 },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EA545520',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: { fontFamily: F.regular, fontSize: 13, color: '#EA5455', flex: 1 },
  successWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#28C76F20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  successText: { fontFamily: F.regular, fontSize: 13, color: '#28C76F', flex: 1 },
  verifyBtn:   { marginTop: 20 },
  resendRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 16 },
  resendPrompt: { fontFamily: F.regular,  fontSize: 14 },
  resendLink:   { fontFamily: F.semiBold, fontSize: 14 },

  /* ── Back ── */
  backBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 10 },
  backText: { fontFamily: F.medium, fontSize: 14 },
});
