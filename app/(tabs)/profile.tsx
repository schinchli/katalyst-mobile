import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useProgressStore } from '@/stores/progressStore';
import { getMissingCount } from '@/config/appConfig';
import { useWebLayout } from '@/hooks/useWebLayout';

const menuItems = [
  { icon: 'bell',         label: 'Notifications',   route: null },
  { icon: 'moon',         label: 'Appearance',       route: null },
  { icon: 'download',     label: 'Downloads',        route: null },
  { icon: 'help-circle',  label: 'Help & Support',   route: null },
  { icon: 'info',         label: 'About',            route: null },
] as const;

export default function ProfileScreen() {
  const colors   = useThemeColors();
  const user     = useAuthStore((s) => s.user);
  const signOut  = useAuthStore((s) => s.signOut);
  const progress = useProgressStore((s) => s.progress);
  const { isDesktop, contentContainerWeb } = useWebLayout();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => { signOut(); router.replace('/(auth)/login'); },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark" edges={isDesktop ? [] : ['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, ...contentContainerWeb }}>

        <Text className="text-[26px] font-bold text-app-text dark:text-app-text-dark mb-6">
          Profile
        </Text>

        {/* User Card */}
        <Card style={{ marginBottom: 24, alignItems: 'center', paddingVertical: 24 }}>
          <View className="w-[72px] h-[72px] rounded-full bg-app-primary-faint dark:bg-app-primary-faint-dark items-center justify-center mb-3">
            <Text className="text-[28px] font-bold text-app-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-app-text dark:text-app-text-dark">
            {user?.name ?? 'User'}
          </Text>
          <Text className="text-sm text-app-muted dark:text-app-muted-dark mt-0.5">
            {user?.email ?? ''}
          </Text>
          <View className="mt-2">
            <Badge
              label={user?.subscription === 'premium' ? 'Premium' : 'Free Plan'}
              color={user?.subscription === 'premium' ? colors.aws : undefined}
              size="md"
            />
          </View>
        </Card>

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 items-center">
            <Text className="text-[22px] font-bold text-app-primary">{progress.completedQuizzes}</Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Quizzes</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-[22px] font-bold text-app-success">{progress.averageScore}%</Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Avg Score</Text>
          </Card>
          <Card className="flex-1 items-center">
            <Text className="text-[22px] font-bold text-app-aws">{progress.badges.length}</Text>
            <Text className="text-xs text-app-muted dark:text-app-muted-dark">Badges</Text>
          </Card>
        </View>

        {/* Menu */}
        <Card padding={0} style={{ marginBottom: 24 }}>
          {menuItems.map((item, idx) => (
            <View key={item.label}>
              <Card
                onPress={() => {}}
                padding={16}
                style={{ borderRadius: 0, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <Feather name={item.icon as any} size={20} color={colors.textSecondary} />
                <Text className="flex-1 text-[15px] text-app-text dark:text-app-text-dark">{item.label}</Text>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Card>
              {idx < menuItems.length - 1 && (
                <View className="h-px bg-app-border dark:bg-app-border-dark ml-[50px]" />
              )}
            </View>
          ))}
        </Card>

        <Button title="Sign Out" variant="outline" onPress={handleSignOut} />

        {/* Developer Settings — visible in dev builds only */}
        {__DEV__ && (
          <Pressable
            onPress={() => router.push('/dev-config' as any)}
            className="mt-4 flex-row items-center justify-center gap-2 py-3 active:opacity-60"
          >
            <Feather name="settings" size={15} color="#7367F0" />
            <Text className="text-[13px] text-app-primary font-medium">Developer Settings</Text>
            {getMissingCount() > 0 && (
              <View className="bg-app-error-tint rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-[10px] font-bold text-app-error">{getMissingCount()}</Text>
              </View>
            )}
          </Pressable>
        )}

        <Text className="text-xs text-app-muted dark:text-app-muted-dark text-center mt-3">
          Katalyst v1.0.0 · KataHQ
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
