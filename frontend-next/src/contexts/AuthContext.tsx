// src/contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { createClient } from '@/utils/supabase/client'; // Use client-side Supabase
import type { Session, User, AuthResponse, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean; // Indicates if initial auth state is being determined
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient(); // Create client instance once for the provider
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: activeSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting initial session:", error);
      }
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (loading) setLoading(false); // Ensure loading is false after first auth event
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, loading]); // Added loading to dependency array

  const signIn = useCallback(
    async (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
    [supabase]
  );

  const signOut = useCallback(async () => supabase.auth.signOut(), [supabase]);

  const signUp = useCallback(
    async (email: string, password: string) => supabase.auth.signUp({ email, password }),
    [supabase]
  );

  const value = { session, user, loading, signIn, signUp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}