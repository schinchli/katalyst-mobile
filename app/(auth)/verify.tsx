import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  const inputBg = colors.backgroundAlt;
  const iconCol = colors.textSecondary;

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

            <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
              <Feather name="hash" size={17} color={iconCol} style={s.inputIcon} />
              <TextInput
                style={[s.textInput, { color: colors.text }]}
                placeholder="6-digit verification code"
                placeholderTextColor={colors.textSecondary}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
              />
            </View>

            {error ? (
              <View style={[s.banner, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[s.bannerText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={[s.banner, { backgroundColor: colors.success + '15', borderColor: colors.success + '35' }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[s.bannerText, { color: colors.success }]}>{success}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleVerify}
              disabled={loading}
              style={({ pressed }) => [s.ctaWrap, { opacity: pressed || loading ? 0.88 : 1 }]}
            >
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <Feather name="loader" size={18} color="#fff" />
                  : <Text style={s.ctaText}>Verify Email</Text>}
              </LinearGradient>
            </Pressable>

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
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 36, gap: 28 },
  brand:      { alignItems: 'center', gap: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heading:    { fontFamily: F.bold,    fontSize: 24, textAlign: 'center' },
  subheading: { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form:       { gap: 12 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, minHeight: 54, paddingHorizontal: 14, gap: 10 },
  inputIcon:  { opacity: 0.7 },
  textInput:  { flex: 1, fontFamily: F.regular, fontSize: 15, paddingVertical: 0 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  bannerText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  ctaWrap:    { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaGradient:{ minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { fontFamily: F.bold, fontSize: 16, color: '#fff', letterSpacing: 0.2 },
  resendRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  resendPrompt:{ fontFamily: F.regular,  fontSize: 14 },
  resendLink:  { fontFamily: F.semiBold, fontSize: 14 },
  backRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backText:   { fontFamily: F.medium, fontSize: 14 },
});
