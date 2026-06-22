import { createContext, useContext, type ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { User } from '@auth0/auth0-react';
import posthog from 'posthog-js';

interface AuthContextType {
  user: User | null;
  profile: null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithRedirect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, loginWithRedirect, logout } = useAuth0();

  if (user) {
    posthog.identify(user.sub ?? user.email ?? 'unknown', { email: user.email });
  } else {
    posthog.reset();
  }

  const signOut = async () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const signInWithUsername = async (_u: string, _p: string) => ({ error: null });
  const signUpWithUsername = async (_u: string, _p: string) => ({ error: null });
  const refreshProfile = async () => {};

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      profile: null,
      loading: isLoading,
      signInWithUsername,
      signUpWithUsername,
      signOut,
      refreshProfile,
      loginWithRedirect,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
