import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { F } from '@/constants/Typography';
import type { Quiz } from '@/types';
import { getPlayableQuestionCount } from '@/utils/quizMetadata';

interface QuizCardProps {
  quiz: Quiz;
  onPress: () => void;
}

export function QuizCard({ quiz, onPress }: QuizCardProps) {
  const colors  = useThemeColors();
  const accent =
    quiz.difficulty === 'beginner' ? colors.success
    : quiz.difficulty === 'intermediate' ? colors.warning
    : quiz.difficulty === 'advanced' ? colors.error
    : colors.primary;
  const badgeBg = accent + '18';
  const iconBg  = accent + '22';
  const playableQuestionCount = getPlayableQuestionCount(quiz);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        { backgroundColor: colors.surface },
        pressed && s.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${quiz.title} quiz`}
    >
      {/* Left difficulty accent bar */}
      <View style={[s.accentBar, { backgroundColor: accent }]} />

      {/* Category icon */}
      <View style={[s.iconWrap, { backgroundColor: iconBg }]}>
        <Feather name={quiz.icon as any} size={22} color={accent} />
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>
            {quiz.title}
          </Text>
        </View>

        <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {quiz.description}
        </Text>

        <View style={s.footer}>
          <View style={[s.diffBadge, { backgroundColor: badgeBg }]}>
            <View style={[s.diffDot, { backgroundColor: accent }]} />
            <Text style={[s.diffText, { color: accent }]}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </Text>
          </View>
          <View style={s.meta}>
            <Feather name="help-circle" size={12} color={colors.textSecondary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>
              {playableQuestionCount}q
            </Text>
          </View>
          <View style={s.meta}>
            <Feather name="clock" size={12} color={colors.textSecondary} />
            <Text style={[s.metaText, { color: colors.textSecondary }]}>
              {quiz.duration}m
            </Text>
          </View>
          {quiz.isPremium ? (
            <View style={s.meta}>
              <Feather name="lock" size={12} color={colors.textSecondary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]}>Premium</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[s.chevronWrap, { backgroundColor: accent + '14' }]}>
        <Feather name="chevron-right" size={16} color={accent} />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#4B465C',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },

  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
    flexShrink: 0,
  },

  content: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 14,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  title: {
    flex: 1,
    fontFamily: F.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },

  desc: {
    fontFamily: F.regular,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 9,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
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

  chevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    flexShrink: 0,
  },
});
