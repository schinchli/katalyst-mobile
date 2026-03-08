// Jest setup for Expo monorepo
// Mocks Expo winter runtime globals that aren't available in Node/Jest

// Mock the import.meta registry
if (typeof (globalThis as Record<string, unknown>).__ExpoImportMetaRegistry === 'undefined') {
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

// Mock themeStore to avoid Zustand/AsyncStorage initialization issues in tests
jest.mock('@/stores/themeStore', () => {
  const ACCENT_PRESETS = {
    purple:  { primary: '#7367F0', primaryLight: '#EBE9FD', label: 'Vuexy Purple', emoji: '🟣' },
    teal:    { primary: '#00BAD1', primaryLight: '#E0F9FC', label: 'Ocean Teal',   emoji: '🩵' },
    emerald: { primary: '#28C76F', primaryLight: '#D1F7E2', label: 'Emerald',      emoji: '🟢' },
    amber:   { primary: '#FF9F43', primaryLight: '#FFF3E8', label: 'Amber',        emoji: '🟡' },
    rose:    { primary: '#EA5455', primaryLight: '#FFE0E0', label: 'Rose',         emoji: '🔴' },
    indigo:  { primary: '#4B5EFA', primaryLight: '#E8EAFF', label: 'Deep Indigo', emoji: '🔵' },
  };
  const state = { accent: 'purple', darkMode: false, setAccent: jest.fn(), toggleDark: jest.fn(), setDarkMode: jest.fn() };
  return {
    ACCENT_PRESETS,
    useThemeStore: (selector: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

// Mock @/config/supabase to avoid "supabaseUrl is required" errors in Node/Jest
// (NEXT_PUBLIC_SUPABASE_URL is not available in the test environment)
jest.mock('@/config/supabase', () => {
  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser:    jest.fn().mockResolvedValue({ data: { user: null },    error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp:     jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut:    jest.fn().mockResolvedValue({ error: null }),
    verifyOtp:  jest.fn().mockResolvedValue({ data: {}, error: null }),
    resend:     jest.fn().mockResolvedValue({ data: {}, error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  };
  const makeChain = () => {
    const chain: Record<string, jest.Mock> = {};
    const resolved = { data: [], error: null };
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockReturnValue(chain);
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    chain.upsert = jest.fn().mockResolvedValue({ error: null });
    chain.insert = jest.fn().mockResolvedValue({ error: null });
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.order  = jest.fn().mockResolvedValue(resolved);
    chain.then   = jest.fn((resolve: (v: typeof resolved) => unknown) => Promise.resolve(resolved).then(resolve));
    return chain;
  };
  return {
    supabase: {
      auth: mockAuth,
      from: jest.fn().mockImplementation(() => makeChain()),
      rpc:  jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

// Mock @/config/db to avoid Supabase calls in store tests
jest.mock('@/config/db', () => ({
  saveSubscription:    jest.fn().mockResolvedValue(undefined),
  getUnlockedCourses:  jest.fn().mockResolvedValue([]),
  recordPurchase:      jest.fn().mockResolvedValue(undefined),
}));

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
