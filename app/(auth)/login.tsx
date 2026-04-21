import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

/** Google G badge — correct brand colour, no globe */
function GoogleG() {
  return (
    <View style={g.wrap}>
      <Text style={g.letter}>G</Text>
    </View>
  );
}
const g = StyleSheet.create({
  wrap:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: F.bold, fontSize: 13, color: '#fff', lineHeight: 22 },
});

export default function LoginScreen() {
  const colors           = useThemeColors();
  const signInUser       = useAuthStore((s) => s.signInUser);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const setGuestUser     = useAuthStore((s) => s.setGuestUser);
  const { isDesktop }    = useWebLayout();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await signInUser(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('confirm')) {
        router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const inputBg  = colors.backgroundAlt;
  const iconCol  = colors.textSecondary;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
        <ScrollView
          contentContainerStyle={[s.scroll, isDesktop && s.scrollDesktop]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Brand ── */}
          <View style={s.brand}>
            <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.logoBox}>
              <Feather name="activity" size={26} color="#fff" />
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>LearnKloud.Today</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>AWS &amp; GenAI certification prep</Text>
          </View>

          {/* ── Inputs ── */}
          <View style={s.form}>

            {/* Email */}
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

            {/* Password */}
            <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
              <Feather name="lock" size={17} color={iconCol} style={s.inputIcon} />
              <TextInput
                style={[s.textInput, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoComplete="password"
              />
              <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10} style={s.eyeBtn}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={iconCol} />
              </Pressable>
            </View>

            {/* Forgot */}
            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotRow}>
              <Text style={[s.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </Pressable>

            {/* Error */}
            {error ? (
              <View style={[s.errorWrap, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* CTA */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [s.ctaWrap, { opacity: pressed || loading ? 0.88 : 1 }]}
            >
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <Feather name="loader" size={18} color="#fff" />
                  : <Text style={s.ctaText}>Sign In</Text>}
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Divider ── */}
          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
            <Text style={[s.dividerText, { color: colors.textSecondary }]}>or continue with</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          {/* ── Google ── */}
          <Pressable
            onPress={signInWithGoogle}
            style={({ pressed }) => [s.googleBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <GoogleG />
            <Text style={[s.googleBtnText, { color: colors.text }]}>Google</Text>
          </Pressable>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <View style={s.footerRow}>
              <Text style={[s.footerPrompt, { color: colors.textSecondary }]}>New here?</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={[s.footerLink, { color: colors.primary }]}>Create account</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setGuestUser()} hitSlop={8}>
              <Text style={[s.guestText, { color: colors.textSecondary }]}>Continue as guest</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 36, gap: 24 },
  scrollDesktop:{ maxWidth: 420, width: '100%', alignSelf: 'center' },

  // Brand
  brand:   { alignItems: 'center', gap: 10 },
  logoBox: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: F.bold,    fontSize: 24, marginTop: 2 },
  tagline: { fontFamily: F.regular, fontSize: 14 },

  // Form
  form:      { gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, minHeight: 54, paddingHorizontal: 14, gap: 10 },
  inputIcon: { opacity: 0.7 },
  textInput: { flex: 1, fontFamily: F.regular, fontSize: 15, paddingVertical: 0 },
  eyeBtn:    { padding: 4 },
  forgotRow: { alignSelf: 'flex-end', marginTop: -2 },
  forgotText:{ fontFamily: F.medium, fontSize: 13 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: F.medium, fontSize: 13, flex: 1 },

  // CTA
  ctaWrap:    { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaGradient:{ minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { fontFamily: F.bold, fontSize: 16, color: '#fff', letterSpacing: 0.2 },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: F.regular, fontSize: 13 },

  // Google
  googleBtn:     { minHeight: 52, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleBtnText: { fontFamily: F.semiBold, fontSize: 15 },

  // Footer
  footer:       { alignItems: 'center', gap: 12 },
  footerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerPrompt: { fontFamily: F.regular,  fontSize: 14 },
  footerLink:   { fontFamily: F.semiBold, fontSize: 14 },
  guestText:    { fontFamily: F.medium,   fontSize: 14 },
});
