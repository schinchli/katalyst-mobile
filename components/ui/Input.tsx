import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colors = useThemeColors();

  const inputBorder = error
    ? 'border-app-error'
    : 'border-app-border dark:border-app-border-dark';

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-app-muted dark:text-app-muted-dark text-sm font-medium">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.tabIconDefault}
        className={`bg-app-surface dark:bg-app-surface-dark border-[1.5px] ${inputBorder} rounded-xl p-3.5 text-base text-app-text dark:text-app-text-dark`}
        style={style}
        {...props}
      />
      {error && (
        <Text className="text-app-error text-[13px]">{error}</Text>
      )}
    </View>
  );
}
