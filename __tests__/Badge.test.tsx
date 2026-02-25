import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders label text', () => {
    const { getByText } = render(<Badge label="PRO" />);
    expect(getByText('PRO')).toBeTruthy();
  });

  it('renders with custom color without crashing', () => {
    expect(() => render(<Badge label="Premium" color="#FF9900" />)).not.toThrow();
  });

  it('renders sm and md sizes without crashing', () => {
    expect(() => render(<Badge label="sm" size="sm" />)).not.toThrow();
    expect(() => render(<Badge label="md" size="md" />)).not.toThrow();
  });
});
