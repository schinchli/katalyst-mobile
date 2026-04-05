import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

interface BadgeProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, color, size = 'sm', style }: BadgeProps) {
  const colors = useThemeColors();
  const bg    = color ?? colors.primaryLight;
  const fg    = color ? colors.surface : colors.primary;
  const px    = size === 'sm' ? 8  : 12;
  const py    = size === 'sm' ? 4  : 6;
  const fs    = size === 'sm' ? 12 : 14;

  return (
    <View style={[s.base, { backgroundColor: bg, paddingHorizontal: px, paddingVertical: py }, style]}>
      <Text style={[s.label, { color: fg, fontSize: fs }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  base:  { borderRadius: 20, alignSelf: 'flex-start' },
  label: { fontFamily: F.semiBold },
});
