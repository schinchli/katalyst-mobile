// Jest setup for Expo monorepo
// Mocks Expo winter runtime globals that aren't available in Node/Jest

// Mock react-native-worklets (reanimated v4 dep) — native runtime not available in Jest
jest.mock('react-native-worklets', () => {
  const noop = () => {};
  const identity = (v: unknown) => v;
  return {
    isWorklet:                   () => false,
    makeShareable:               identity,
    makeShareableCloneRecursive: identity,
    makeShareableCloneOnUIRecursive: identity,
    shareableMappingCache:       { set: noop, has: () => false, get: () => null },
    createSerializable:          identity,
    isSerializableRef:           () => false,
    serializableMappingCache:    { set: noop, has: () => false, get: () => null },
    isSynchronizable:            () => false,
    createSynchronizable:        identity,
    runOnUI:                     (fn: unknown) => fn,
    runOnJS:                     (fn: unknown) => fn,
    executeOnUIRuntimeSync:      (fn: unknown) => fn,
    callMicrotasks:              noop,
    getStaticFeatureFlag:        () => false,
    setDynamicFeatureFlag:       noop,
    RuntimeKind:                 { UI: 'UI', JS: 'JS' },
    getRuntimeKind:              () => 'JS',
    createWorkletRuntime:        noop,
    runOnRuntime:                noop,
    isShareableRef:              () => false,
  };
});

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
    ocean:   { primary: '#0EA5E9', primaryLight: '#E0F7FF', label: 'Ocean Glass',   emoji: '🌊' },
    aurora:  { primary: '#0EA5E9', primaryLight: '#E6F4FF', label: 'Neon Aurora',   emoji: '🌈' },
    forest:  { primary: '#10B981', primaryLight: '#DCFCE7', label: 'Forest Mint',   emoji: '🌿' },
    sunset:  { primary: '#F97316', primaryLight: '#FFEDD5', label: 'Sunset Coral',  emoji: '🌇' },
    midnight:{ primary: '#22D3EE', primaryLight: '#123043', label: 'Midnight Focus',emoji: '🌌' },
    sand:    { primary: '#0EA5E9', primaryLight: '#E6F8FF', label: 'Sandstone Calm',emoji: '🏜️' },
    slate:   { primary: '#475569', primaryLight: '#F1F5F9', label: 'Slate Minimal', emoji: '🪨' },
    emerald: { primary: '#28C76F', primaryLight: '#D1F7E2', label: 'Emerald',      emoji: '🟢' },
    amber:   { primary: '#F59E0B', primaryLight: '#FEF3C7', label: 'Amber',        emoji: '🟡' },
    rose:    { primary: '#EF4444', primaryLight: '#FCEAEA', label: 'Rose Quartz',  emoji: '🌸' },
    indigo:  { primary: '#4B5EFA', primaryLight: '#E8EAFF', label: 'Deep Indigo',  emoji: '🔵' },
  };
  const FONT_SCALE = { small: 0.875, medium: 1, large: 1.125 };
  const state = {
    accent: 'indigo',
    darkMode: false,
    usePlatform: true,
    animationsEnabled: true,
    fontSizePreset: 'medium',
    setAccent: jest.fn(),
    toggleDark: jest.fn(),
    setDarkMode: jest.fn(),
    setUsePlatform: jest.fn(),
    setAnimationsEnabled: jest.fn(),
    setFontSizePreset: jest.fn(),
  };
  return {
    ACCENT_PRESETS,
    FONT_SCALE,
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
