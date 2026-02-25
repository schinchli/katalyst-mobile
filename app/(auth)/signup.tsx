import { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';

export default function SignupScreen() {
  const colors = useThemeColors();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    // TODO: Replace with Amplify Auth.signUp
    setTimeout(() => {
      setUser({
        id: '1',
        email,
        name,
        subscription: 'free',
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Feather name="cloud" size={36} color="#FFF" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
              Start your GenAI certification journey
            </Text>
          </View>

          <View style={{ gap: 16 }}>
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

            {error ? (
              <Text style={{ color: colors.error, fontSize: 14, textAlign: 'center' }}>
                {error}
              </Text>
            ) : null}

            <Button title="Create Account" onPress={handleSignup} loading={loading} size="lg" />

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
                Already have an account?
              </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
