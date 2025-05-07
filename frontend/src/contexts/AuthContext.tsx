// frontend/src/contexts/AuthContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode
  } from 'react'
  import { supabase } from '../lib/supabaseClient'
  import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
  
  interface AuthCtx {
    session: Session | null
    signIn: (email: string, password: string) => Promise<any>
    signOut: () => Promise<any>
  }
  
  const AuthContext = createContext<AuthCtx | null>(null)
  
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
  
    useEffect(() => {
      // 1️⃣ Fetch the existing session (if any)
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => setSession(session))
  
      // 2️⃣ Subscribe to future auth changes
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(
        (_event: AuthChangeEvent, newSession) => {
          setSession(newSession)
        }
      )
  
      // 3️⃣ Cleanup on unmount
      return () => {
        subscription.unsubscribe()
      }
    }, [])
  
    const signIn = (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password })
  
    const signOut = () => supabase.auth.signOut()
  
    return (
      <AuthContext.Provider value={{ session, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    )
  }
  
  export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be inside AuthProvider')
    return ctx
  }
  