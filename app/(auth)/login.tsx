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
import { EXPERIENCE_COPY } from '@/config/experience';
import { usePlatformConfigStore } from '@/stores/platformConfigStore';

export default function LoginScreen() {
  const colors = useThemeColors();
  const signInUser = useAuthStore((s) => s.signInUser);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const setGuestUser = useAuthStore((s) => s.setGuestUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDesktop } = useWebLayout();
  const platformConfig = usePlatformConfigStore((s) => s.config);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
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
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
        <ScrollView contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[colors.background, colors.backgroundAlt, colors.surface]} style={[styles.hero, { borderColor: colors.surfaceBorder }]}>
            <View style={[styles.languageChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
              <Feather name="globe" size={16} color={colors.primary} />
              <Text style={[styles.languageText, { color: colors.text }]}>EN</Text>
            </View>
            <View style={styles.heroBrand}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>{platformConfig.copy.authHeadline}</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{platformConfig.copy.authSubheadline}</Text>
            </View>
            <View style={styles.heroHighlights}>
              {EXPERIENCE_COPY.auth.highlights.map((item) => (
                <View key={item} style={[styles.highlightPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
                  <Feather name="check" size={13} color={colors.primary} />
                  <Text style={[styles.highlightText, { color: colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.socialProof, { color: colors.textSecondary }]}>{EXPERIENCE_COPY.auth.socialProof}</Text>
            <LinearGradient colors={[colors.primary, colors.gradientAccent, colors.error]} style={styles.wave} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
          </LinearGradient>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.formHeading, { color: colors.text }]}>{EXPERIENCE_COPY.auth.loginTitle}</Text>
            <Text style={[styles.formSubheading, { color: colors.textSecondary }]}>{EXPERIENCE_COPY.auth.loginSubtitle}</Text>

            <View style={styles.fields}>
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
              <Input label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
            </View>

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
            </Pressable>

            {error ? (
              <View style={[styles.errorWrap, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Button title="Log In" onPress={handleLogin} loading={loading} size="lg" style={styles.primaryBtn} />
            <Pressable
              onPress={signInWithGoogle}
              style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.surfaceBorder, backgroundColor: colors.backgroundAlt, opacity: pressed ? 0.9 : 1 }]}
            >
              <Feather name="globe" size={18} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Continue with Google</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={[styles.footerPrompt, { color: colors.textSecondary }]}>Don&apos;t have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
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
  scrollDesktop: { maxWidth: 460, width: '100%', alignSelf: 'center' },
  hero: { borderRadius: 16, borderWidth: 1, padding: 22, gap: 16, overflow: 'hidden' },
  languageChip: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  languageText: { fontFamily: F.bold, fontSize: 14 },
  heroBrand: { gap: 10 },
  heroTitle: { fontFamily: F.bold, fontSize: 30, lineHeight: 38, letterSpacing: 0 },
  heroSubtitle: { fontFamily: F.regular, fontSize: 15, lineHeight: 24 },
  heroHighlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  highlightPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  highlightText: { fontFamily: F.medium, fontSize: 13 },
  socialProof: { fontFamily: F.medium, fontSize: 14, lineHeight: 21 },
  wave: { height: 4, borderRadius: 999, marginTop: 2 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 14 },
  formHeading: { fontFamily: F.bold, fontSize: 24 },
  formSubheading: { fontFamily: F.regular, fontSize: 14, lineHeight: 22 },
  fields: { gap: 12 },
  forgotRow: { alignSelf: 'flex-end' },
  forgotText: { fontFamily: F.semiBold, fontSize: 13 },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontFamily: F.medium, fontSize: 13, flex: 1 },
  primaryBtn: { marginTop: 2 },
  secondaryBtn: { minHeight: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondaryBtnText: { fontFamily: F.semiBold, fontSize: 15 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  footerPrompt: { fontFamily: F.regular, fontSize: 14 },
  footerLink: { fontFamily: F.semiBold, fontSize: 14 },
  guestBtn: { alignItems: 'center', paddingVertical: 4 },
  guestText: { fontFamily: F.medium, fontSize: 14 },
});
