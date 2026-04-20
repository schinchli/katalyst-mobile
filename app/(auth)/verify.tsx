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

  const { email = '' } = useLocalSearchParams<{ email: string }>();

  const [code,      setCode]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Please enter the 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      await confirmEmail(email, code.trim());
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(''); setSuccess('');
    try {
      await resendCode(email);
      setSuccess('Verification code resent. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally { setResending(false); }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Icon + heading ── */}
          <View style={s.brand}>
            <View style={[s.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Feather name="mail" size={28} color={colors.primary} />
            </View>
            <Text style={[s.heading, { color: colors.text }]}>Check your email</Text>
            <Text style={[s.subheading, { color: colors.textSecondary }]}>
              {'We sent a 6-digit code to\n'}
              <Text style={{ color: colors.text, fontFamily: F.semiBold }}>{email}</Text>
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>
            <Input
              label="Verification Code"
              placeholder="6-digit code"
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            {error ? (
              <View style={[s.banner, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={[s.bannerText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={[s.banner, { backgroundColor: colors.success + '18', borderColor: colors.success + '40' }]}>
                <Feather name="check-circle" size={15} color={colors.success} />
                <Text style={[s.bannerText, { color: colors.success }]}>{success}</Text>
              </View>
            ) : null}

            <Button title="Verify Email" onPress={handleVerify} loading={loading} size="lg" />

            <View style={s.resendRow}>
              <Text style={[s.resendPrompt, { color: colors.textSecondary }]}>Didn&apos;t receive it?</Text>
              <Pressable onPress={handleResend} disabled={resending} hitSlop={8}>
                <Text style={[s.resendLink, { color: colors.primary, opacity: resending ? 0.5 : 1 }]}>
                  {resending ? 'Sending…' : 'Resend Code'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Back link ── */}
          <Pressable onPress={() => router.replace('/(auth)/login')} style={s.backRow} hitSlop={8}>
            <Feather name="arrow-left" size={15} color={colors.textSecondary} />
            <Text style={[s.backText, { color: colors.textSecondary }]}>Back to Sign In</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32, gap: 28 },
  brand:      { alignItems: 'center', gap: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heading:    { fontFamily: F.bold, fontSize: 24, textAlign: 'center' },
  subheading: { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form:       { gap: 14 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  bannerText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  resendRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  resendPrompt: { fontFamily: F.regular,  fontSize: 14 },
  resendLink:   { fontFamily: F.semiBold, fontSize: 14 },
  backRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backText:   { fontFamily: F.medium, fontSize: 14 },
});
