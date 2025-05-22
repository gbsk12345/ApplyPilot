// frontend/src/App.tsx
'use client'
import { useState, useEffect } from 'react'
import FancyBackground from '@/components/FancyBackground'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation';
import { useRef } from 'react';


export default function App() {
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const loggedIn = Boolean(session);
  const userEmail = session?.user?.email ?? '';
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  function toggleVisibility(ref: React.RefObject<HTMLInputElement | null>) {
    if (ref.current) {
      ref.current.type = ref.current.type === 'password' ? 'text' : 'password'
    }
  }



  useEffect(() => {
    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }

    getInitialSession();


    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {

    if (session) {
      console.log("User is logged in, redirecting to dashboard from App.tsx");
      router.push('/dashboard/overview');
    }
  }, [session, router]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
      return false;
    }
    return true;
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
      return false;
    }
    return true;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      router.push('/'); // Or any other desired route after logout
    }
  }

  /* ───────────── modal state ───────────── */
  const [showModal, setShowModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit() {
    setErrorMsg(null)
    console.log(errorMsg);
    if (!email || !password) return setErrorMsg('Both fields are required')
    if (isSignUp && password !== confirmPassword) {
      return setErrorMsg('Passwords do not match')
    }
    let success = false;
    if (isSignUp) {
      success = await signUp(email, password);
    } else {
      success = await signIn(email, password);
    }

    if (success) {
      setEmail('');
      setPassword('');
      setShowModal(false);
      if (isSignUp) {
        router.push('/onboarding'); // Redirect to onboarding page after login/signup (should be in if statement but commented out for testing)
      }
      else {
        router.push('/dashboard/overview'); // Redirect to dashboard after login
      }
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white">
      {/* ─────────── TOP BAR ─────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-black">
        <div className="text-2xl font-bold">ApplyPilot</div>

        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="hover:text-gray-400">Features</a>
          <a href="#pricing" className="hover:text-gray-400">Pricing</a>
          <a href="#contact" className="hover:text-gray-400">Contact</a>
        </nav>

        {/* Right-hand action */}
        {!loggedIn ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300 hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
            >
              Log&nbsp;out
            </button>
          </div>
        )}
      </header>

      {/* ─────────── HERO ─────────── */}
      <main className="relative flex flex-1 items-center min-h-screen justify-center px-4 py-20 text-center">
        <FancyBackground />

        <div>
          <h1 className="text-6xl text-purple-600 font-bold">
            Apply to Jobs&nbsp;Intelligently
          </h1>
          <p className="font-calsans mt-4 text-xl text-gray-300 max-w-xl mx-auto">
            Automate every application, get AI-driven insights, and land your
            dream job faster than ever.
          </p>
        </div>
      </main>

      {/* ─────────── SECTIONS (unchanged) ─────────── */}
      <section id="features" className="px-8 py-16 bg-gray-900">
        <h2 className="text-3xl font-bold mb-4">Features</h2>
        <p className="max-w-2xl mx-auto">
          Everything you need—from AI resume scans to interview practice—all in
          one place.
        </p>
      </section>

      <section id="pricing" className="px-8 py-16 bg-black">
        <h2 className="text-3xl font-bold mb-4 text-purple-500">Pricing</h2>
        <p className="max-w-2xl mx-auto">
          Free forever for students. Pro plan for professionals at $9/mo.
        </p>
      </section>

      <section id="contact" className="px-8 py-16 bg-gray-900">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="max-w-2xl mx-auto">
          Questions? Email us at&nbsp;
          <a href="mailto:support@applypilot.com" className="underline">
            support@applypilot.com
          </a>
          .
        </p>
      </section>  
      {/* ─────────── AUTH MODAL ─────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90">
          <div className="w-80 rounded-lg bg-gray-900 p-8">
            <h2 className="mb-4 text-2xl font-bold">
              {isSignUp ? 'Create account' : 'Login'}
            </h2>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
            />
            <div className="relative mb-3">
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded bg-gray-800 p-2 pr-10 text-white"
            />
            <button
              type="button"
              onClick={() => toggleVisibility(passwordRef)}
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              👁️
            </button>
          </div>

                  {isSignUp && (
          <div className="relative mb-3">
            <input
              ref={confirmPasswordRef}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full rounded bg-gray-800 p-2 pr-10 text-white"
            />
            <button
              type="button"
              onClick={() => toggleVisibility(confirmPasswordRef)}
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              👁️
            </button>
          </div>
        )}


            <button
              onClick={handleSubmit}
              className="w-full rounded bg-purple-600 py-2 font-semibold hover:bg-purple-700"
            >
              {isSignUp ? 'Sign up' : 'Login'}
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="mt-3 w-full text-center underline text-gray-400"
            >
              Cancel
            </button>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-2 w-full text-center text-sm text-gray-500 hover:text-gray-300"
            >
              {isSignUp
                ? 'Already have an account? Log in'
                : "New here? Create an account"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}