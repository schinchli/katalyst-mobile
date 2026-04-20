import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

export default function LoginScreen() {
  const colors          = useThemeColors();
  const signInUser      = useAuthStore((s) => s.signInUser);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const setGuestUser    = useAuthStore((s) => s.setGuestUser);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { isDesktop } = useWebLayout();

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await signInUser(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('confirm')) {
        router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
            <LinearGradient colors={[colors.primary, colors.gradientAccent]} style={s.logoBox}>
              <Feather name="activity" size={24} color="#fff" />
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>LearnKloud.Today</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>
              AWS &amp; GenAI certification prep
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotRow}>
              <Text style={[s.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </Pressable>

            {error ? (
              <View style={[s.errorWrap, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Button title="Log In" onPress={handleLogin} loading={loading} size="lg" />
          </View>

          {/* ── Divider ── */}
          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
            <Text style={[s.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          {/* ── Social ── */}
          <Pressable
            onPress={signInWithGoogle}
            style={({ pressed }) => [s.googleBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <Feather name="globe" size={18} color={colors.text} />
            <Text style={[s.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
          </Pressable>

          {/* ── Footer links ── */}
          <View style={s.footer}>
            <View style={s.footerRow}>
              <Text style={[s.footerPrompt, { color: colors.textSecondary }]}>Don&apos;t have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={[s.footerLink, { color: colors.primary }]}>Sign Up</Text>
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
  root:          { flex: 1 },
  scroll:        { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32, gap: 24 },
  scrollDesktop: { maxWidth: 420, width: '100%', alignSelf: 'center' },

  // Brand
  brand:   { alignItems: 'center', gap: 12 },
  logoBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: F.bold, fontSize: 22 },
  tagline: { fontFamily: F.regular, fontSize: 14 },

  // Form
  form:       { gap: 14 },
  forgotRow:  { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontFamily: F.semiBold, fontSize: 13 },
  errorWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  errorText:  { fontFamily: F.medium, fontSize: 13, flex: 1 },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontFamily: F.medium, fontSize: 13 },

  // Google
  googleBtn:     { minHeight: 52, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  googleBtnText: { fontFamily: F.semiBold, fontSize: 15 },

  // Footer
  footer:       { alignItems: 'center', gap: 14 },
  footerRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerPrompt: { fontFamily: F.regular, fontSize: 14 },
  footerLink:   { fontFamily: F.semiBold, fontSize: 14 },
  guestText:    { fontFamily: F.medium, fontSize: 14 },
});
