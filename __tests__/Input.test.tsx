/**
 * Input component — unit tests
 * Covers: basic render, label, error state, onChangeText, placeholder.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders without crashing', () => {
    expect(() => render(<Input />)).not.toThrow();
  });

  it('renders with a label', () => {
    const { getByText } = render(<Input label="Email Address" />);
    expect(getByText('Email Address')).toBeTruthy();
  });

  it('renders without a label when label prop is omitted', () => {
    const { queryByText } = render(<Input placeholder="Type here..." />);
    // Confirm no unexpected label text
    expect(queryByText('Email Address')).toBeNull();
  });

  it('renders an error message when error prop is provided', () => {
    const { getByText } = render(<Input error="Invalid email" />);
    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('does not render an error message when error prop is omitted', () => {
    const { queryByText } = render(<Input label="Email" />);
    expect(queryByText('Invalid email')).toBeNull();
  });

  it('calls onChangeText with the new value', () => {
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <Input value="" onChangeText={onChange} testID="my-input" />
    );
    fireEvent.changeText(
      // RNTL finds TextInput by testID when value is empty string
      render(<Input value="" onChangeText={onChange} testID="my-input" />).getByTestId('my-input'),
      'hello@test.com'
    );
    expect(onChange).toHaveBeenCalledWith('hello@test.com');
  });

  it('renders a placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Enter your email" />);
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  it('renders with label AND error simultaneously', () => {
    const { getByText } = render(<Input label="Password" error="Too short" />);
    expect(getByText('Password')).toBeTruthy();
    expect(getByText('Too short')).toBeTruthy();
  });

  it('renders secureTextEntry without crashing', () => {
    expect(() => render(<Input secureTextEntry label="Password" />)).not.toThrow();
  });
});
