import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  const containerStyle = (() => {
    switch (variant) {
      case 'secondary': return { backgroundColor: colors.primaryLight };
      case 'outline':   return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primaryText };
      case 'success':   return { backgroundColor: '#28C76F', shadowColor: '#28C76F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 };
      default:          return {
        shadowColor: '#5E50EE', shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
      };
    }
  })();

  const textColor = (variant === 'primary' || variant === 'success') ? '#04111F' : colors.primaryText;

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
      {(variant === 'primary' || variant === undefined) ? (
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]}
        />
      ) : null}
      {loading && <ActivityIndicator color={variant === 'primary' ? '#04111F' : colors.primaryText} size="small" />}
      <Text style={[s.label, { fontSize: FONT_SIZE[size], color: textColor }]} numberOfLines={1}>{title}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: 12,
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
  pressed:  { opacity: 0.88 },
});
