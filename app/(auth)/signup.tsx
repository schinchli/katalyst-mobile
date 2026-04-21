import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [showPwd,  setShowPwd]  = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8)          { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(password))      { setError('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(password))      { setError('Password must contain at least one number'); return; }
    setLoading(true); setError('');
    try {
      await signUpUser(name.trim(), email.trim().toLowerCase(), password);
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally { setLoading(false); }
  };

  const inputBg = colors.backgroundAlt;
  const iconCol = colors.textSecondary;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Brand ── */}
          <View style={s.brand}>
            <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.logoBox}>
              <Feather name="activity" size={26} color="#fff" />
            </LinearGradient>
            <Text style={[s.appName, { color: colors.text }]}>Create your account</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>
              Track XP, streaks &amp; quiz history across devices
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={s.form}>

            <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
              <Feather name="user" size={17} color={iconCol} style={s.inputIcon} />
              <TextInput
                style={[s.textInput, { color: colors.text }]}
                placeholder="Full name"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            </View>

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

            <View style={[s.inputWrap, { backgroundColor: inputBg }]}>
              <Feather name="lock" size={17} color={iconCol} style={s.inputIcon} />
              <TextInput
                style={[s.textInput, { color: colors.text }]}
                placeholder="Password (min 8, 1 upper, 1 number)"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                autoComplete="new-password"
              />
              <Pressable onPress={() => setShowPwd(!showPwd)} hitSlop={10} style={s.eyeBtn}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={iconCol} />
              </Pressable>
            </View>

            {error ? (
              <View style={[s.errorWrap, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSignup}
              disabled={loading}
              style={({ pressed }) => [s.ctaWrap, { opacity: pressed || loading ? 0.88 : 1 }]}
            >
              <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <Feather name="loader" size={18} color="#fff" />
                  : <Text style={s.ctaText}>Get Started</Text>}
              </LinearGradient>
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <View style={s.footerRow}>
              <Text style={[s.footerPrompt, { color: colors.textSecondary }]}>Already have an account?</Text>
              <Pressable onPress={() => router.back()}>
                <Text style={[s.footerLink, { color: colors.primary }]}>Log In</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => { setGuestUser(); router.replace('/(tabs)'); }} hitSlop={8}>
              <Text style={[s.guestText, { color: colors.textSecondary }]}>Continue as guest</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  scroll:    { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 36, gap: 24 },
  brand:     { alignItems: 'center', gap: 10 },
  logoBox:   { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appName:   { fontFamily: F.bold,    fontSize: 22, marginTop: 2 },
  tagline:   { fontFamily: F.regular, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  form:      { gap: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, minHeight: 54, paddingHorizontal: 14, gap: 10 },
  inputIcon: { opacity: 0.7 },
  textInput: { flex: 1, fontFamily: F.regular, fontSize: 15, paddingVertical: 0 },
  eyeBtn:    { padding: 4 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  ctaWrap:    { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  ctaGradient:{ minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText:    { fontFamily: F.bold, fontSize: 16, color: '#fff', letterSpacing: 0.2 },
  footer:       { alignItems: 'center', gap: 12 },
  footerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerPrompt: { fontFamily: F.regular,  fontSize: 14 },
  footerLink:   { fontFamily: F.semiBold, fontSize: 14 },
  guestText:    { fontFamily: F.medium,   fontSize: 14 },
});
