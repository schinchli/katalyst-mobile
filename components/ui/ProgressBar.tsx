import { View } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColor';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 8, color }: ProgressBarProps) {
  const colors = useThemeColors();
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: colors.surfaceBorder,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          borderRadius: height / 2,
          backgroundColor: color ?? colors.primary,
        }}
      />
    </View>
  );
}
