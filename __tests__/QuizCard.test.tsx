/**
 * QuizCard component — unit tests
 * Covers: rendering, press handler, difficulty badge, premium indicator, metadata display.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuizCard } from '@/components/quiz/QuizCard';
import type { Quiz } from '@/types';

function makeQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id:            'test-quiz-1',
    title:         'Bedrock Fundamentals',
    description:   'Learn the basics of Amazon Bedrock',
    category:      'bedrock',
    difficulty:    'beginner',
    questionCount: 10,
    duration:      15,
    isPremium:     false,
    icon:          'cloud',
    ...overrides,
  };
}

describe('QuizCard', () => {
  it('renders without crashing', () => {
    expect(() => render(<QuizCard quiz={makeQuiz()} onPress={jest.fn()} />)).not.toThrow();
  });

  it('displays quiz title', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz()} onPress={jest.fn()} />);
    expect(getByText('Bedrock Fundamentals')).toBeTruthy();
  });

  it('displays quiz description', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz()} onPress={jest.fn()} />);
    expect(getByText('Learn the basics of Amazon Bedrock')).toBeTruthy();
  });

  it('displays question count', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ questionCount: 10 })} onPress={jest.fn()} />);
    expect(getByText('10q')).toBeTruthy();
  });

  it('displays duration', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ duration: 15 })} onPress={jest.fn()} />);
    expect(getByText('15m')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<QuizCard quiz={makeQuiz()} onPress={onPress} />);
    fireEvent.press(getByText('Bedrock Fundamentals'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows difficulty badge for beginner', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ difficulty: 'beginner' })} onPress={jest.fn()} />);
    expect(getByText('Beginner')).toBeTruthy();
  });

  it('shows difficulty badge for intermediate', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ difficulty: 'intermediate' })} onPress={jest.fn()} />);
    expect(getByText('Intermediate')).toBeTruthy();
  });

  it('shows difficulty badge for advanced', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ difficulty: 'advanced' })} onPress={jest.fn()} />);
    expect(getByText('Advanced')).toBeTruthy();
  });

  it('shows premium indicator when quiz is premium', () => {
    const { getByText } = render(<QuizCard quiz={makeQuiz({ isPremium: true })} onPress={jest.fn()} />);
    expect(getByText('Premium')).toBeTruthy();
  });

  it('does NOT show premium indicator when quiz is free', () => {
    const { queryByText } = render(<QuizCard quiz={makeQuiz({ isPremium: false })} onPress={jest.fn()} />);
    expect(queryByText('Premium')).toBeNull();
  });

  it('has accessible role "button"', () => {
    const { getByRole } = render(<QuizCard quiz={makeQuiz()} onPress={jest.fn()} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('has accessible label containing quiz title', () => {
    const { getByLabelText } = render(<QuizCard quiz={makeQuiz()} onPress={jest.fn()} />);
    expect(getByLabelText('Start Bedrock Fundamentals quiz')).toBeTruthy();
  });
});
