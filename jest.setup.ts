// Jest setup for Expo monorepo
// Mocks Expo winter runtime globals that aren't available in Node/Jest

// Mock the import.meta registry
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    get: () => ({ url: 'http://localhost' }),
    configurable: true,
  });
}

// Mock expo-font to avoid native module loading
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock @expo/vector-icons to avoid font loading in tests
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = ({ name, ...props }: any) => React.createElement(Text, props, name ?? '');
  return { Feather: MockIcon };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
  Link: ({ children }: any) => children,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Override Pressable with a plain View to avoid animated hook issues caused by
// multiple React instances in the monorepo Jest setup.
// react-native/index.js loads Pressable via `.default`, so mock must export { default }.
// When disabled, use a no-op function (not undefined) so RNTL stops traversal at this View
// and does not climb to the parent composite component's onPress prop.
jest.mock('react-native/Libraries/Components/Pressable/Pressable', () => {
  const React = require('react');
  const noop = () => {};
  const MockPressable = ({ children, onPress, disabled, style, ...props }: any) => {
    const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
    return React.createElement(
      'View',
      { onPress: disabled ? noop : onPress, style: resolvedStyle, accessible: true, ...props },
      children
    );
  };
  return { default: MockPressable };
});
