import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

export default function SignupScreen() {
  const colors       = useThemeColors();
  const signUpUser   = useAuthStore((s) => s.signUpUser);
  const setGuestUser = useAuthStore((s) => s.setGuestUser);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpUser(name.trim(), email.trim().toLowerCase(), password);
      // After signUp, step becomes 'confirm_signup' → navigate to verify screen
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Logo / Header card ──────────────────────── */}
          <View style={styles.logoCard}>
            <View style={styles.iconWrap}>
              <Feather name="cloud" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.logoTitle}>Katalyst</Text>
            <Text style={styles.logoSubtitle}>
              Start your GenAI certification journey
            </Text>
          </View>

          {/* ── Form card ───────────────────────────────── */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.formHeading, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>Join thousands of AWS learners</Text>

            <View style={styles.fields}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
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
                placeholder="Minimum 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color="#EA5455" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Password hint */}
            <View style={styles.hintRow}>
              <Feather name="info" size={12} color="#A3A0B3" />
              <Text style={styles.hintText}>
                Min 8 characters · uppercase · lowercase · digit
              </Text>
            </View>

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              size="lg"
              style={styles.createBtn}
            />

            <View style={styles.signInRow}>
              <Text style={[styles.signInPrompt, { color: colors.textSecondary }]}>Already have an account?</Text>
              <Pressable onPress={() => router.back()}>
                <Text style={[styles.signInLink, { color: colors.primary }]}>Sign In</Text>
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
  logoTitle: { fontFamily: F.bold, fontSize: 28, color: '#FFFFFF', letterSpacing: 0.3 },
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
  formHeading:    { fontFamily: F.bold,    fontSize: 20, marginBottom: 2 },
  formSubheading: { fontFamily: F.regular, fontSize: 14, marginBottom: 20 },
  fields: { gap: 14 },
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
  hintRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  hintText:  { fontFamily: F.regular, fontSize: 12, color: '#A3A0B3' },
  createBtn: { marginTop: 20 },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  signInPrompt: { fontFamily: F.regular,  fontSize: 14 },
  signInLink:   { fontFamily: F.semiBold, fontSize: 14 },

  /* ── Separator ── */
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 10 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontFamily: F.medium, fontSize: 13 },

  /* ── Guest ── */
  guestBtn:  { alignItems: 'center', paddingVertical: 12 },
  guestText: { fontFamily: F.medium, fontSize: 14 },
});
