import { View, TextInput, Text, StyleSheet, type TextInputProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const colors = useThemeColors();

  return (
    <View style={s.wrapper}>
      {label && (
        <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colors.tabIconDefault}
        style={[
          s.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.surfaceBorder,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text style={[s.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: F.medium, fontSize: 14 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: F.regular,
  },
  error: { fontFamily: F.regular, fontSize: 13 },
});
