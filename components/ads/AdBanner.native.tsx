import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Expo Go: no ads (no native SDK). Dev Client/Release: render a lightweight house banner placeholder.
export function AdBanner(_props: { style?: object }) {
  if (isExpoGo) return null;
  return (
    <View style={s.banner}>
      <Text style={s.title}>Katalyst</Text>
      <Text style={s.subtitle}>Upgrade to Pro · Unlock all quizzes</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    height: 64,
    borderRadius: 14,
    backgroundColor: '#0EA5E9',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  subtitle: { color: '#E0F2FE', fontSize: 12, marginTop: 3 },
});
