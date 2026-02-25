import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Quiz } from '@/types';

const DIFF_COLOR: Record<string, string> = {
  beginner:     '#28C76F',
  intermediate: '#FF9F43',
  advanced:     '#FF4C51',
};
const DIFF_BG: Record<string, string> = {
  beginner:     '#E8FAF0',
  intermediate: '#FFF3E8',
  advanced:     '#FFE5E6',
};

interface QuizCardProps {
  quiz: Quiz;
  onPress: () => void;
}

export function QuizCard({ quiz, onPress }: QuizCardProps) {
  const colors  = useThemeColors();
  const accent  = DIFF_COLOR[quiz.difficulty] ?? colors.primary;
  const badgeBg = DIFF_BG[quiz.difficulty]   ?? colors.primaryLight;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        pressed && s.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${quiz.title} quiz`}
    >
      {/* Difficulty accent bar */}
      <View style={[s.accentBar, { backgroundColor: accent }]} />

      {/* Icon */}
      <View style={[s.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={quiz.icon as any} size={20} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
            {quiz.title}
          </Text>
          {quiz.isPremium && <Badge label="PRO" color={colors.aws} size="sm" />}
        </View>

        <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {quiz.description}
        </Text>

        <View style={s.footer}>
          <View style={[s.diffBadge, { backgroundColor: badgeBg }]}>
            <Text style={[s.diffText, { color: accent }]}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </Text>
          </View>
          <View style={s.meta}>
            <Feather name="help-circle" size={11} color={colors.textSecondary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>
              {quiz.questionCount}q
            </Text>
          </View>
          <View style={s.meta}>
            <Feather name="clock" size={11} color={colors.textSecondary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>
              {quiz.duration}m
            </Text>
          </View>
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.textSecondary} style={s.chevron} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: { opacity: 0.9 },

  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },

  content: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  title: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },

  desc: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 7,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  diffText: {
    fontFamily: F.semiBold,
    fontSize: 11,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: F.regular,
    fontSize: 11,
  },

  chevron: {
    marginRight: 12,
    flexShrink: 0,
  },
});
