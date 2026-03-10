import { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useProgressStore } from '@/stores/progressStore';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Badge } from '@/types';

function SingleBadgeModal({ badge, onDismiss }: { badge: Badge; onDismiss: () => void }) {
  const colors = useThemeColors();
  const scale   = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: withDelay(150, withTiming(opacity.value, { duration: 250 })),
    transform: [{ translateY: withDelay(100, withSpring(opacity.value === 1 ? 0 : 16, { damping: 14 })) }],
  }));

  return (
    // Tap outside the sheet to dismiss
    <Pressable style={styles.overlay} onPress={onDismiss}>
      {/* Inner Pressable absorbs touches so tapping the card doesn't close */}
      <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>

        {/* X close button */}
        <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={12}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* Stars decoration */}
        <View style={styles.starsRow}>
          {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
            <Text key={i} style={[styles.star, { color: colors.warning, opacity: 0.6 + i * 0.1 }]}>{s}</Text>
          ))}
        </View>

        {/* Badge icon */}
        <Animated.View style={[styles.badgeCircle, { backgroundColor: colors.primaryLight }, iconStyle]}>
          <Feather name={badge.icon as any} size={40} color={colors.primary} />
        </Animated.View>

        <Animated.View style={contentStyle}>
          <Text style={[styles.earnedLabel, { color: colors.primary }]}>Badge Earned!</Text>
          <Text style={[styles.badgeName, { color: colors.text }]}>{badge.name}</Text>
          <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>{badge.description}</Text>
        </Animated.View>

        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.dismissBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={styles.dismissText}>Awesome!</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

export function BadgeCelebrationModal({ enabled = true }: { enabled?: boolean }) {
  const pendingBadges = useProgressStore((s) => s.pendingBadges);
  const clearPending  = useProgressStore((s) => s.clearPendingBadges);

  const currentBadge = pendingBadges[0] ?? null;

  return (
    <Modal
      visible={!!currentBadge && enabled}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={clearPending}
    >
      {currentBadge && (
        <SingleBadgeModal badge={currentBadge} onDismiss={clearPending} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 43, 61, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  star: {
    fontSize: 18,
  },
  badgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  earnedLabel: {
    fontFamily: F.semiBold,
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  badgeName: {
    fontFamily: F.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeDesc: {
    fontFamily: F.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  dismissBtn: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5E50EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dismissText: {
    fontFamily: F.semiBold,
    color: '#fff',
    fontSize: 15,
  },
});
