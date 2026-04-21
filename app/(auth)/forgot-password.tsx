import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const colors             = useThemeColors();
  const forgotPassword     = useAuthStore((s) => s.forgotPassword);
  const confirmNewPassword = useAuthStore((s) => s.confirmNewPassword);

  const [stage,       setStage]       = useState<'request' | 'reset'>('request');
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showPwd,     setShowPwd]     = useState(false);

  const handleRequest = async () => {
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true); setError('');
    try {
      await forgotPassword(email.trim().toLowerCase());
      setStage('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!code || !newPassword) { setError('Please fill in all fields'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await confirmNewPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally { setLoading(false); }
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
              <Feather name={stage === 'request' ? 'lock' : 'key'} size={28} color={colors.primary} />
            </View>
            <Text style={[s.heading, { color: colors.text }]}>
              {stage === 'request' ? 'Forgot password?' : 'Reset password'}
            </Text>
            <Text style={[s.subheading, { color: colors.textSecondary }]}>
              {stage === 'request'
                ? "Enter your email and we'll send a reset code"
                : `Check your inbox for the code sent to ${email}`}
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>
            {stage === 'request' ? (
              <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
                <Feather name="mail" size={17} color={iconCol} style={s.inputIcon} />
                <TextInput
                  style={[s.textInput, { color: colors.text }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            ) : (
              <>
                <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
                  <Feather name="hash" size={17} color={iconCol} style={s.inputIcon} />
                  <TextInput
                    style={[s.textInput, { color: colors.text }]}
                    placeholder="6-digit code"
                    placeholderTextColor={colors.textSecondary}
                    value={code}
                    onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
                  <Feather name="lock" size={17} color={iconCol} style={s.inputIcon} />
                  <TextInput
                    style={[s.textInput, { color: colors.text }]}
                    placeholder="New password (min 8 characters)"
                    placeholderTextColor={colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPwd}
                    autoComplete="new-password"
                  />
                  <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10} style={s.eyeBtn}>
                    <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={iconCol} />
                  </Pressable>
                </View>
              </>
            )}

            {error ? (
              <View style={[s.errorWrap, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={stage === 'request' ? handleRequest : handleReset}
              disabled={loading}
              style={({ pressed }) => [s.ctaWrap, { opacity: pressed || loading ? 0.88 : 1 }]}
            >
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <Feather name="loader" size={18} color="#fff" />
                  : <Text style={s.ctaText}>{stage === 'request' ? 'Send Reset Code' : 'Reset Password'}</Text>}
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Back link ── */}
          <Pressable onPress={() => router.back()} style={s.backRow} hitSlop={8}>
            <Feather name="arrow-left" size={15} color={colors.textSecondary} />
            <Text style={[s.backText, { color: colors.textSecondary }]}>
              {stage === 'request' ? 'Back to Log In' : 'Back'}
            </Text>
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
  eyeBtn:     { padding: 4 },
  errorWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  errorText:  { fontFamily: F.medium, fontSize: 13, flex: 1 },
  ctaWrap:    { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaGradient:{ minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { fontFamily: F.bold, fontSize: 16, color: '#fff', letterSpacing: 0.2 },
  backRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  backText:   { fontFamily: F.medium, fontSize: 14 },
});
