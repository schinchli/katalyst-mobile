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
import { F } from '@/constants/Typography';

export default function SignupScreen() {
  const colors      = useThemeColors();
  const signUpUser  = useAuthStore((s) => s.signUpUser);
  const setGuestUser = useAuthStore((s) => s.setGuestUser);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8)          { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password))      { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(password))      { setError('Password must contain at least one number'); return; }
    setLoading(true);
    setError('');
    try {
      await signUpUser(name.trim(), email.trim().toLowerCase(), password);
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Brand ── */}
          <View style={s.brand}>
            <LinearGradient colors={[colors.primary, colors.gradientAccent]} style={s.logoBox}>
              <Feather name="activity" size={24} color="#fff" />
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>Create your account</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>
              Track XP, streaks &amp; quiz history across devices
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>
            <Input label="Full Name" placeholder="Jane Smith" value={name} onChangeText={setName} autoComplete="name" />
            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input label="Password" placeholder="Min 8 chars, 1 uppercase, 1 number" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />

            {error ? (
              <View style={[s.errorWrap, { backgroundColor: colors.error + '18', borderColor: colors.error + '40' }]}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Button title="Get Started" onPress={handleSignup} loading={loading} size="lg" />
          </View>

          {/* ── Footer links ── */}
          <View style={s.footer}>
            <View style={s.footerRow}>
              <Text style={[s.footerPrompt, { color: colors.textSecondary }]}>Already have an account?</Text>
              <Pressable onPress={() => router.back()}>
                <Text style={[s.footerLink, { color: colors.primary }]}>Log In</Text>
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
  scroll:       { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32, gap: 24 },
  brand:        { alignItems: 'center', gap: 12 },
  logoBox:      { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  appName:      { fontFamily: F.bold, fontSize: 22 },
  tagline:      { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form:         { gap: 14 },
  errorWrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  errorText:    { fontFamily: F.medium, fontSize: 13, flex: 1 },
  footer:       { alignItems: 'center', gap: 14 },
  footerRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerPrompt: { fontFamily: F.regular, fontSize: 14 },
  footerLink:   { fontFamily: F.semiBold, fontSize: 14 },
  guestText:    { fontFamily: F.medium, fontSize: 14 },
});
