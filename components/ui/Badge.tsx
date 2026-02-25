import { View, Text, type ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  /** Explicit background color (e.g. difficulty or PRO badge). When omitted, uses primary-faint. */
  color?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const sizePx:   Record<string, string> = { sm: 'px-2 py-1', md: 'px-3 py-1.5' };
const sizeText: Record<string, string> = { sm: 'text-xs', md: 'text-sm' };

export function Badge({ label, color, size = 'sm', style }: BadgeProps) {
  if (color) {
    // Dynamic color — cannot be a Tailwind class, keep minimal inline style
    return (
      <View
        style={[{ backgroundColor: color, paddingHorizontal: size === 'sm' ? 8 : 12, paddingVertical: size === 'sm' ? 4 : 6, borderRadius: 20, alignSelf: 'flex-start' }, style]}
      >
        <Text style={{ color: '#FFFFFF', fontSize: size === 'sm' ? 12 : 14, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`bg-app-primary-faint dark:bg-app-primary-faint-dark rounded-full self-start ${sizePx[size]}`}
      style={style}
    >
      <Text className={`text-app-primary font-semibold ${sizeText[size]}`}>{label}</Text>
    </View>
  );
}
