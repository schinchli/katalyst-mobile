import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useWebLayout } from '@/hooks/useWebLayout';
import { F } from '@/constants/Typography';

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDesktop } = useWebLayout();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');

    // TODO: Replace with Amplify Auth.signIn(email, password)
    setTimeout(() => {
      setUser({
        id: '1',
        email,
        name: email.split('@')[0],
        subscription: 'free',
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isDesktop && styles.scrollDesktop,
          ]}
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
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Welcome back</Text>
            <Text style={styles.formSubheading}>Sign in to continue</Text>

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

            {error ? (
              <View style={styles.errorWrap}>
                <Feather name="alert-circle" size={14} color="#FF4C51" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" style={styles.signInBtn} />

            <View style={styles.signUpRow}>
              <Text style={styles.signUpPrompt}>Don't have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Separator ───────────────────────────────── */}
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>or</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* ── Guest skip ──────────────────────────────── */}
          <Pressable
            onPress={() => {
              setUser({
                id: 'demo',
                email: 'demo@awslearn.app',
                name: 'Demo User',
                subscription: 'free',
                createdAt: new Date().toISOString(),
              });
              router.replace('/(tabs)');
            }}
            style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.guestText}>Skip — Continue as Guest</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8F7FA' },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DBDADE',
    shadowColor: '#2F2B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeading: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#2F2B3D',
    marginBottom: 2,
  },
  formSubheading: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#A5A3AE',
    marginBottom: 20,
  },
  fields: {
    gap: 14,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#FF4C511A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#FF4C51',
    flex: 1,
  },
  signInBtn: {
    marginTop: 20,
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  signUpPrompt: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#A5A3AE',
  },
  signUpLink: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: '#7367F0',
  },

  /* ── Separator ── */
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DBDADE',
  },
  separatorText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#A5A3AE',
  },

  /* ── Guest ── */
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: '#A5A3AE',
  },
});
