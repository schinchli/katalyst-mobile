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
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

export default function SignupScreen() {
  const colors = useThemeColors();
  const signUpUser = useAuthStore((s) => s.signUpUser);
  const setGuestUser = useAuthStore((s) => s.setGuestUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const platformConfig = usePlatformConfigStore((s) => s.config);

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
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[colors.surface, colors.backgroundAlt, colors.background]} style={[styles.hero, { borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>{EXPERIENCE_COPY.auth.eyebrow}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{EXPERIENCE_COPY.auth.signupTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{platformConfig.copy.authSubheadline}</Text>
            <View style={styles.featureGrid}>
              {['Daily streak tracking', 'Premium course gates', 'Rich flashcard practice'].map((item) => (
                <View key={item} style={[styles.featureCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
                  <Feather name="check-circle" size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} autoComplete="name" />
            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Input label="Password" placeholder="Minimum 8 characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />

            {error ? (
              <View style={[styles.errorWrap, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Text style={[styles.hintText, { color: colors.textSecondary }]}>Min 8 characters. Use a secure password.</Text>
            <Button title="Get Started" onPress={handleSignup} loading={loading} size="lg" />

            <View style={styles.footerRow}>
              <Text style={[styles.footerPrompt, { color: colors.textSecondary }]}>Already have an account?</Text>
              <Pressable onPress={() => router.back()}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Log In</Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => setGuestUser()} style={styles.guestBtn}>
            <Text style={[styles.guestText, { color: colors.textSecondary }]}>Continue as guest</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 24, gap: 18 },
  hero: { borderRadius: 28, borderWidth: 1, padding: 24, gap: 12 },
  eyebrow: { fontFamily: F.bold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
  subtitle: { fontFamily: F.regular, fontSize: 15, lineHeight: 24 },
  featureGrid: { gap: 10, marginTop: 6 },
  featureCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontFamily: F.medium, fontSize: 14, flex: 1 },
  formCard: { borderRadius: 28, borderWidth: 1, padding: 22, gap: 12 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  hintText: { fontFamily: F.regular, fontSize: 13, lineHeight: 20 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  footerPrompt: { fontFamily: F.regular, fontSize: 14 },
  footerLink: { fontFamily: F.semiBold, fontSize: 14 },
  guestBtn: { alignItems: 'center' },
  guestText: { fontFamily: F.medium, fontSize: 14 },
});
