/**
 * FlashCard component — unit tests
 * Uses Platform.OS='web' path (no Reanimated animations) for test simplicity.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import type { Question } from '@/types';

// Force web platform so FlashCard renders the opacity-swap branch (no Reanimated)
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS:     'web',
  select: (spec: Record<string, unknown>) => spec['web'] ?? spec['default'],
}));

// Mock Reanimated just in case the native path is triggered
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

import { FlashCard } from '@/components/quiz/FlashCard';

const MOCK_QUESTION: Question = {
  id:              'q-flash-1',
  quizId:          'bedrock-fundamentals',
  text:            'What is Amazon Bedrock primarily used for?',
  options: [
    { id: 'a', text: 'Foundation model inference' },
    { id: 'b', text: 'Running EC2 instances' },
    { id: 'c', text: 'Storing S3 objects' },
    { id: 'd', text: 'Creating VPCs' },
  ],
  correctOptionId: 'a',
  explanation:     'Bedrock provides serverless access to foundation models.',
  difficulty:      'beginner',
  category:        'bedrock',
};

const QUESTION_NO_EXPLANATION: Question = {
  ...MOCK_QUESTION,
  id:          'q-flash-2',
  explanation: undefined,
};

describe('FlashCard — question side (not flipped)', () => {
  it('renders question text', () => {
    const { getByText } = render(
      <FlashCard
        question={MOCK_QUESTION}
        isFlipped={false}
        onFlip={jest.fn()}
        cardIndex={0}
        total={5}
      />
    );
    expect(getByText('What is Amazon Bedrock primarily used for?')).toBeTruthy();
  });

  it('shows "Question" label when not flipped', () => {
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    expect(getByText('Question')).toBeTruthy();
  });

  it('shows counter "1 / 5"', () => {
    const { getAllByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    // Counter is rendered as separate Text nodes: index | "/" | total
    expect(getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('5').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Tap to reveal answer" hint when not flipped', () => {
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    expect(getByText('Tap to reveal answer')).toBeTruthy();
  });
});

describe('FlashCard — answer side (flipped)', () => {
  it('shows "Answer" label when flipped', () => {
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={true} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    expect(getByText('Answer')).toBeTruthy();
  });

  it('shows the correct option text when flipped', () => {
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={true} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    expect(getByText('Foundation model inference')).toBeTruthy();
  });

  it('shows explanation text when flipped', () => {
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={true} onFlip={jest.fn()} cardIndex={0} total={5} />
    );
    expect(getByText('Bedrock provides serverless access to foundation models.')).toBeTruthy();
  });

  it('does not crash when explanation is undefined', () => {
    expect(() =>
      render(
        <FlashCard
          question={QUESTION_NO_EXPLANATION}
          isFlipped={true}
          onFlip={jest.fn()}
          cardIndex={0}
          total={5}
        />
      )
    ).not.toThrow();
  });
});

describe('FlashCard — interaction', () => {
  it('calls onFlip when the card is pressed', () => {
    const onFlip = jest.fn();
    const { getByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={onFlip} cardIndex={0} total={5} />
    );
    fireEvent.press(getByText('What is Amazon Bedrock primarily used for?'));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });
});

describe('FlashCard — counter display', () => {
  it('shows correct counter for last card', () => {
    const { getAllByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={jest.fn()} cardIndex={9} total={10} />
    );
    // Counter rendered as separate Text nodes: "10" | "/" | "10"
    expect(getAllByText('10').length).toBeGreaterThanOrEqual(2);
  });

  it('shows correct counter for middle card', () => {
    const { getAllByText } = render(
      <FlashCard question={MOCK_QUESTION} isFlipped={false} onFlip={jest.fn()} cardIndex={4} total={12} />
    );
    // Counter rendered as separate Text nodes: "5" | "/" | "12"
    expect(getAllByText('5').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('12').length).toBeGreaterThanOrEqual(1);
  });
});
