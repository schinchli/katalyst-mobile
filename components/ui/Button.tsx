import { Pressable, Text, ActivityIndicator, type ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
}

const sizeH:   Record<string, string> = { sm: 'h-10', md: 'h-12', lg: 'h-14' };
const sizeText: Record<string, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-[18px]' };

const variantContainer: Record<string, string> = {
  primary:   'bg-app-primary border-0',
  secondary: 'bg-app-primary-faint dark:bg-app-primary-faint-dark border-0',
  outline:   'bg-transparent border-[1.5px] border-app-primary',
};

const variantText: Record<string, string> = {
  primary:   'text-white',
  secondary: 'text-app-primary',
  outline:   'text-app-primary',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  className = '',
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, style]}
      className={`rounded-xl items-center justify-center flex-row gap-2 ${sizeH[size]} ${variantContainer[variant]} ${className}`}
    >
      {loading && <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#7367F0'} size="small" />}
      <Text className={`font-semibold ${sizeText[size]} ${variantText[variant]}`}>
        {title}
      </Text>
    </Pressable>
  );
}
