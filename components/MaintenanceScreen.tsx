import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { F } from '@/constants/Typography';

interface MaintenanceScreenProps {
  message: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  const colors = useThemeColors();
  const t = useTypography();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@katalyst.app').catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Feather name="tool" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontSize: t.screenTitle }]}>
          Under Maintenance
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontSize: t.body }]}>
          {message}
        </Text>
        <Pressable
          onPress={handleContactSupport}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Feather name="mail" size={16} color="#FFFFFF" />
          <Text style={[styles.buttonText, { fontSize: t.body }]}>Check Back Later</Text>
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
  buttonText: { fontFamily: F.bold, color: '#FFFFFF' },
});
