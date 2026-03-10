import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

export default function LoginScreen() {
  const colors          = useThemeColors();
  const signInUser      = useAuthStore((s) => s.signInUser);
  const signInWithGoogle= useAuthStore((s) => s.signInWithGoogle);
  const setGuestUser    = useAuthStore((s) => s.setGuestUser);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const { isDesktop } = useWebLayout();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInUser(email.trim().toLowerCase(), password);
      // AuthGuard in _layout.tsx handles the redirect once isAuthenticated flips
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      // If user needs to verify email, navigate to verify screen
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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Logo / Header card ──────────────────────── */}
          <View style={styles.logoCard}>
            <View style={styles.iconWrap}>
              <Feather name="cloud" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.logoTitle}>Katalyst</Text>
            <Text style={styles.logoSubtitle}>
              AWS Certified GenAI Developer — Professional
            </Text>
          </View>

          {/* ── Form ────────────────────────────────────── */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.formHeading, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>Sign in to continue</Text>

            <View style={styles.fields}>
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
            </View>

            {/* Forgot password */}
            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotRow}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </Pressable>

            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color="#EA5455" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={styles.signInBtn} />
            <Pressable
              onPress={signInWithGoogle}
              style={({ pressed }) => [
                styles.oauthBtn,
                { borderColor: colors.surfaceBorder, backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="globe" size={18} color={colors.text} />
              <Text style={[styles.oauthText, { color: colors.text }]}>Continue with Google</Text>
            </Pressable>

            <View style={styles.signUpRow}>
              <Text style={[styles.signUpPrompt, { color: colors.textSecondary }]}>Don't have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Separator ───────────────────────────────── */}
          <View style={styles.separatorRow}>
            <View style={[styles.separatorLine, { backgroundColor: colors.surfaceBorder }]} />
            <Text style={[styles.separatorText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.separatorLine, { backgroundColor: colors.surfaceBorder }]} />
          </View>

          {/* ── Guest skip ──────────────────────────────── */}
          <Pressable
            onPress={() => setGuestUser()}
            style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.guestText, { color: colors.textSecondary }]}>Skip — Continue as Guest</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  flex:   { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  scrollDesktop: {
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },

  /* ── Logo card ── */
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
  logoTitle: {
    fontFamily: F.bold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  logoSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },

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
  formHeading: {
    fontFamily: F.bold,
    fontSize: 20,
    marginBottom: 2,
  },
  formSubheading: {
    fontFamily: F.regular,
    fontSize: 14,
    marginBottom: 20,
  },
  fields: {
    gap: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    fontFamily: F.medium,
    fontSize: 13,
  },
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
  errorText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#EA5455',
    flex: 1,
  },
  signInBtn: { marginTop: 12 },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  signUpPrompt: { fontFamily: F.regular, fontSize: 14 },
  signUpLink:   { fontFamily: F.semiBold, fontSize: 14 },
  oauthBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  oauthText: { fontFamily: F.semiBold, fontSize: 14 },

  /* ── Separator ── */
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontFamily: F.medium, fontSize: 13 },

  /* ── Guest ── */
  guestBtn: { alignItems: 'center', paddingVertical: 12 },
  guestText: { fontFamily: F.medium, fontSize: 14 },
});
