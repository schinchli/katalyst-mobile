import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

export default function ForgotPasswordScreen() {
  const colors             = useThemeColors();
  const forgotPassword     = useAuthStore((s) => s.forgotPassword);
  const confirmNewPassword = useAuthStore((s) => s.confirmNewPassword);

  const [stage, setStage]           = useState<'request' | 'reset'>('request');
  const [email, setEmail]           = useState('');
  const [code, setCode]             = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleRequest = async () => {
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStage('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code || !newPassword) { setError('Please fill in all fields'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await confirmNewPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Header ── */}
          <View style={styles.logoCard}>
            <View style={styles.iconWrap}>
              <Feather name={stage === 'request' ? 'lock' : 'key'} size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.logoTitle}>
              {stage === 'request' ? 'Forgot Password?' : 'Reset Password'}
            </Text>
            <Text style={styles.logoSubtitle}>
              {stage === 'request'
                ? 'Enter your email and we\'ll send a reset code'
                : `Enter the code sent to ${email}`}
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>

            {stage === 'request' ? (
              <>
                <Text style={[styles.formHeading, { color: colors.text }]}>Reset Password</Text>
                <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>
                  We'll send a 6-digit code to your inbox
                </Text>
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                {error ? <ErrorBox msg={error} /> : null}
                <Button title="Send Reset Code" onPress={handleRequest} loading={loading} size="lg" style={styles.btn} />
              </>
            ) : (
              <>
                <Text style={[styles.formHeading, { color: colors.text }]}>Enter New Password</Text>
                <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>
                  Check your email for the 6-digit code
                </Text>
                <View style={styles.fields}>
                  <Input
                    label="Verification Code"
                    placeholder="123456"
                    value={code}
                    onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                  />
                  <Input
                    label="New Password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoComplete="new-password"
                  />
                </View>
                {error ? <ErrorBox msg={error} /> : null}
                <Button title="Reset Password" onPress={handleReset} loading={loading} size="lg" style={styles.btn} />
              </>
            )}

            <View style={styles.backRow}>
              <Pressable onPress={() => router.back()}>
                <Text style={[styles.backLink, { color: colors.primary }]}>
                  {stage === 'request' ? '← Back to Sign In' : '← Back'}
                </Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <View style={styles.errorWrap}>
      <Feather name="alert-circle" size={14} color="#EA5455" />
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  flex:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
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
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoTitle:     { fontFamily: F.bold, fontSize: 24, color: '#FFFFFF', letterSpacing: 0.3 },
  logoSubtitle:  { fontFamily: F.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center', lineHeight: 20 },
  formCard: {
    borderRadius: 20, padding: 24, borderWidth: 1,
    shadowColor: '#4B465C', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  formHeading:    { fontFamily: F.bold,    fontSize: 20, marginBottom: 2 },
  formSubheading: { fontFamily: F.regular, fontSize: 14, marginBottom: 20 },
  fields: { gap: 14 },
  btn:    { marginTop: 20 },
  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: '#EA545520', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  errorText: { fontFamily: F.regular, fontSize: 13, color: '#EA5455', flex: 1 },
  backRow:   { marginTop: 16, alignItems: 'center' },
  backLink:  { fontFamily: F.medium, fontSize: 14 },
});
