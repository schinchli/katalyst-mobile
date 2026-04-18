import { View, Text, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { F } from '@/constants/Typography';

interface ForceUpdateScreenProps {
  /** Minimum version string to display in the message */
  minimumVersion: string;
  appStoreUrl: string;
  playStoreUrl: string;
}

export function ForceUpdateScreen({ minimumVersion, appStoreUrl, playStoreUrl }: ForceUpdateScreenProps) {
  const colors = useThemeColors();
  const t = useTypography();

  const handleUpdate = () => {
    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Feather name="download" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontSize: t.screenTitle }]}>
          Update Required
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontSize: t.body }]}>
          This version of LearnKloud.Today is no longer supported. Please update to version {minimumVersion} or later to continue.
        </Text>
        <Pressable
          onPress={handleUpdate}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Feather name="arrow-up-circle" size={16} color={colors.surface} />
          <Text style={[styles.buttonText, { color: colors.surface, fontSize: t.body }]}>Update Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: 20, paddingHorizontal: 32, maxWidth: 360 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.bold, textAlign: 'center' },
  message: { fontFamily: F.regular, textAlign: 'center', lineHeight: 24 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  buttonText: { fontFamily: F.bold },
});
