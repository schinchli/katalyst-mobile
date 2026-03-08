/**
 * authStore — unit tests
 * Covers: initial state, setUser, setLoading, signOut.
 */
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const MOCK_USER: User = {
  id:           'user-1',
  email:        'alice@example.com',
  name:         'Alice',
  subscription: 'free',
  createdAt:    '2024-01-01T00:00:00Z',
};

const PREMIUM_USER: User = {
  ...MOCK_USER,
  id:           'user-2',
  subscription: 'premium',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
});

describe('initial state', () => {
  it('starts with user null', () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('starts with isLoading true', () => {
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});

describe('setUser', () => {
  it('sets the user object', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    expect(useAuthStore.getState().user).toEqual(MOCK_USER);
  });

  it('marks isAuthenticated true when user is set', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('sets isLoading to false after setUser', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('marks isAuthenticated false when null is passed', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('stores premium subscription correctly', () => {
    useAuthStore.getState().setUser(PREMIUM_USER);
    expect(useAuthStore.getState().user?.subscription).toBe('premium');
  });
});

describe('setLoading', () => {
  it('sets isLoading to false', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sets isLoading back to true', () => {
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});

describe('signOut', () => {
  it('clears the user', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets isAuthenticated to false', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('sets isLoading to false', () => {
    useAuthStore.getState().setUser(MOCK_USER);
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('is a no-op when already signed out', () => {
    useAuthStore.getState().signOut(); // already signed out
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
