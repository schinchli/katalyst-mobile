import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useWebLayout } from '@/hooks/useWebLayout';

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
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            justifyContent: 'center',
            ...(isDesktop && { maxWidth: 440, alignSelf: 'center', width: '100%' }),
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Header */}
          <View className="items-center mb-10">
            <View className="w-[72px] h-[72px] rounded-[20px] bg-app-primary items-center justify-center mb-4">
              <Feather name="cloud" size={36} color="#FFFFFF" />
            </View>
            <Text className="text-[28px] font-bold text-app-text dark:text-app-text-dark">
              Katalyst
            </Text>
            <Text className="text-[15px] text-app-muted dark:text-app-muted-dark mt-1">
              AWS Certified GenAI Developer — Professional
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
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

            {error ? (
              <Text className="text-app-error text-sm text-center">{error}</Text>
            ) : null}

            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" />

            <View className="flex-row justify-center gap-1 mt-2">
              <Text className="text-app-muted dark:text-app-muted-dark text-[15px]">
                Don't have an account?
              </Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text className="text-app-primary text-[15px] font-semibold">Sign Up</Text>
              </Pressable>
            </View>
          </View>

          {/* Guest skip */}
          <Pressable
            onPress={() => {
              setUser({ id: 'demo', email: 'demo@awslearn.app', name: 'Demo User', subscription: 'free', createdAt: new Date().toISOString() });
              router.replace('/(tabs)');
            }}
            className="mt-8 items-center"
          >
            <Text className="text-app-muted dark:text-app-muted-dark text-sm">
              Skip — Continue as Guest
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
