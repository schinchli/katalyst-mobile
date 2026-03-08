import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const HEIGHT:    Record<string, number> = { sm: 40, md: 48, lg: 52 };
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

  const containerStyle = (() => {
    switch (variant) {
      case 'secondary': return { backgroundColor: colors.primaryLight };
      case 'outline':   return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primaryText };
      default:          return {
        backgroundColor: colors.primary,
        shadowColor: '#5E50EE', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
      };
    }
  })();

  const textColor = variant === 'primary' ? '#fff' : colors.primaryText;

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
      {loading && (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primaryText} size="small" />
      )}
      <Text style={[s.label, { fontSize: FONT_SIZE[size], color: textColor }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: F.semiBold,
    letterSpacing: 0.1,
  },
  disabled: { opacity: 0.5 },
  pressed:  { opacity: 0.88 },
});
