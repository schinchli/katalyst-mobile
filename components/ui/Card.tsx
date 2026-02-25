import { View, Pressable, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
  /** Override default padding (16). Use sparingly — prefer className. */
  padding?: number;
  className?: string;
}

export function Card({ children, onPress, style, padding = 16, className = '', ...props }: CardProps) {
  const base = `bg-app-surface dark:bg-app-surface-dark rounded-2xl border border-app-border dark:border-app-border-dark ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ padding, opacity: pressed ? 0.9 : 1 }, style as any]}
        className={base}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[{ padding }, style]} className={base} {...props}>
      {children}
    </View>
  );
}
