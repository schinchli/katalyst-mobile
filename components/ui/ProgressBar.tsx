import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  /** Height in pixels. Passed as inline style (truly dynamic). */
  height?: number;
  /** Override fill color. When omitted, uses app-primary via className. */
  color?: string;
}

export function ProgressBar({ progress, height = 8, color }: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View
      className="bg-app-border dark:bg-app-border-dark overflow-hidden w-full"
      style={{ height, borderRadius: height / 2 }}
    >
      <View
        className={color ? '' : 'bg-app-primary'}
        style={{
          height: '100%',
          width: `${clampedProgress * 100}%`,
          borderRadius: height / 2,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </View>
  );
}
