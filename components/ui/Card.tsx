import { View, Pressable, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';

interface CardProps extends ViewProps {
  onPress?: () => void;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, onPress, style, padding = 16, ...props }: CardProps) {
  const colors = useThemeColors();

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, style, pressed && s.pressed]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[base, style]} {...props}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  pressed: { opacity: 0.9 },
});
