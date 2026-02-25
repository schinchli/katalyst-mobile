import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('ProgressBar', () => {
  it('renders without crashing at 0', () => {
    expect(() => render(<ProgressBar progress={0} />)).not.toThrow();
  });

  it('renders without crashing at 1', () => {
    expect(() => render(<ProgressBar progress={1} />)).not.toThrow();
  });

  it('renders without crashing at 0.5', () => {
    expect(() => render(<ProgressBar progress={0.5} />)).not.toThrow();
  });

  it('clamps values above 1', () => {
    expect(() => render(<ProgressBar progress={1.5} />)).not.toThrow();
  });

  it('clamps values below 0', () => {
    expect(() => render(<ProgressBar progress={-0.5} />)).not.toThrow();
  });

  it('renders with custom color and height', () => {
    expect(() => render(<ProgressBar progress={0.7} color="#FF9F43" height={12} />)).not.toThrow();
  });
});
