import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuestionView } from '@/components/quiz/QuestionView';
import type { Question } from '@/types';

const mockQuestion: Question = {
  id: 'q1',
  quizId: 'quiz1',
  text: 'What is Amazon Bedrock?',
  options: [
    { id: 'a', text: 'A serverless inference service' },
    { id: 'b', text: 'A database service' },
    { id: 'c', text: 'A container orchestration service' },
    { id: 'd', text: 'A DNS service' },
  ],
  correctOptionId: 'a',
  explanation: 'Amazon Bedrock is a fully managed service for foundation models.',
  difficulty: 'beginner',
  category: 'bedrock',
};

describe('QuestionView', () => {
  it('renders question text', () => {
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId={undefined}
        onSelectOption={() => {}}
      />
    );
    expect(getByText('What is Amazon Bedrock?')).toBeTruthy();
  });

  it('renders all options', () => {
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId={undefined}
        onSelectOption={() => {}}
      />
    );
    expect(getByText('A serverless inference service')).toBeTruthy();
    expect(getByText('A database service')).toBeTruthy();
    expect(getByText('A container orchestration service')).toBeTruthy();
    expect(getByText('A DNS service')).toBeTruthy();
  });

  it('calls onSelectOption with the option id when tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId={undefined}
        onSelectOption={onSelect}
      />
    );
    fireEvent.press(getByText('A database service'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('does not call onSelectOption when showResult is true', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId="a"
        onSelectOption={onSelect}
        showResult
      />
    );
    fireEvent.press(getByText('A database service'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows explanation when showResult is true', () => {
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId="a"
        onSelectOption={() => {}}
        showResult
      />
    );
    expect(getByText('Amazon Bedrock is a fully managed service for foundation models.')).toBeTruthy();
  });

  it('shows fallback when showResult is true and no explanation', () => {
    const noExplQuestion: Question = { ...mockQuestion, explanation: undefined };
    const { getByText } = render(
      <QuestionView
        question={noExplQuestion}
        selectedOptionId="a"
        onSelectOption={() => {}}
        showResult
      />
    );
    expect(getByText('No explanation available.')).toBeTruthy();
  });

  it('does not call onSelectOption for hidden options', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <QuestionView
        question={mockQuestion}
        selectedOptionId={undefined}
        onSelectOption={onSelect}
        hiddenOptionIds={['b', 'c']}
      />
    );
    fireEvent.press(getByText('A database service'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
