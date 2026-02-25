import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { QuizCard } from '@/components/quiz/QuizCard';
import { useThemeColors } from '@/hooks/useThemeColor';
import { quizzes } from '@/data/quizzes';
import type { QuizCategory } from '@/types';
import { useWebLayout } from '@/hooks/useWebLayout';

const categories: { key: QuizCategory | 'all'; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'bedrock',       label: 'Bedrock' },
  { key: 'rag',           label: 'RAG' },
  { key: 'agents',        label: 'Agents' },
  { key: 'guardrails',    label: 'Guardrails' },
  { key: 'prompt-eng',    label: 'Prompting' },
  { key: 'routing',       label: 'Routing' },
  { key: 'security',      label: 'Security' },
  { key: 'monitoring',    label: 'Monitoring' },
  { key: 'orchestration', label: 'Orchestration' },
  { key: 'evaluation',    label: 'Evaluation' },
];

export default function QuizzesScreen() {
  const colors = useThemeColors();
  const { isDesktop, contentContainerWeb } = useWebLayout();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | 'all'>('all');

  const filtered = selectedCategory === 'all'
    ? quizzes
    : quizzes.filter((q) => q.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-app-bg dark:bg-app-bg-dark" edges={isDesktop ? [] : ['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, ...contentContainerWeb, paddingBottom: 0 }}>
        <Text className="text-[26px] font-bold text-app-text dark:text-app-text-dark mb-1">
          Quizzes
        </Text>
        <Text className="text-sm text-app-muted dark:text-app-muted-dark mb-4">
          {quizzes.length} quizzes available
        </Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 16 }}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical:    8,
                borderRadius:      20,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth:     1,
                borderColor:     active ? colors.primary : colors.surfaceBorder,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : colors.textSecondary }}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Quiz list */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40, ...contentContainerWeb }}>
        {filtered.length === 0 ? (
          <View className="items-center pt-16">
            <Feather name="inbox" size={48} color={colors.textSecondary} />
            <Text className="text-base text-app-muted dark:text-app-muted-dark mt-3">
              No quizzes in this category yet
            </Text>
          </View>
        ) : (
          filtered.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onPress={() => router.push(`/quiz/${quiz.id}`)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
