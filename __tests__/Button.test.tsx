import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Loading..." onPress={onPress} loading />);
    fireEvent.press(getByText('Loading...'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders all variants without crashing', () => {
    expect(() => render(<Button title="Primary"   onPress={() => {}} variant="primary" />)).not.toThrow();
    expect(() => render(<Button title="Secondary" onPress={() => {}} variant="secondary" />)).not.toThrow();
    expect(() => render(<Button title="Outline"   onPress={() => {}} variant="outline" />)).not.toThrow();
  });

  it('renders all sizes without crashing', () => {
    expect(() => render(<Button title="SM" onPress={() => {}} size="sm" />)).not.toThrow();
    expect(() => render(<Button title="MD" onPress={() => {}} size="md" />)).not.toThrow();
    expect(() => render(<Button title="LG" onPress={() => {}} size="lg" />)).not.toThrow();
  });
});
