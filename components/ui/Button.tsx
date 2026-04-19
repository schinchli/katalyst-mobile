import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const HEIGHT:    Record<string, number> = { sm: 42, md: 50, lg: 54 };
const FONT_SIZE: Record<string, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  title,
  onPress,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const solidTextColor = colors.surface;

  const containerStyle = (() => {
    switch (variant) {
      case 'secondary': return { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.surfaceBorder };
      case 'outline':   return { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary + '66' };
      case 'success':   return { backgroundColor: colors.success };
      default:          return { backgroundColor: colors.primary };
    }
  })();

  const textColor = (variant === 'primary' || variant === 'success') ? solidTextColor : colors.primaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.base,
        { height: HEIGHT[size] },
        containerStyle,
        disabled && s.disabled,
        pressed && s.pressed,
        style,
      ]}
    >
      {loading && <ActivityIndicator color={variant === 'primary' || variant === 'success' ? solidTextColor : colors.primaryText} size="small" />}
      <Text style={[s.label, { fontSize: FONT_SIZE[size], color: textColor }]} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
  },
  label: {
    fontFamily: F.semiBold,
    letterSpacing: 0.1,
  },
  disabled: { opacity: 0.5 },
  pressed:  { opacity: 0.92 },
});
