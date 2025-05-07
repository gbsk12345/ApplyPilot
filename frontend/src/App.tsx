// frontend/src/App.tsx
import { useState } from 'react'
import FancyBackground from './FancyBackground'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  /* ───────────── auth helpers ───────────── */
  const { session, signIn, signUp, signOut } = useAuth()
  const loggedIn = Boolean(session)
  const userEmail = session?.user.email ?? ''

  /* ───────────── modal state ───────────── */
  const [showModal, setShowModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [welcomeText, setWelcomeText] = useState('Apply To Jobs Intelligently')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit() {
    setErrorMsg(null)
    console.log('handleSubmit', { email, password })
    console.log('isSignUp', isSignUp)
    if (!email || !password) return setErrorMsg('Both fields are required')

    /* Supabase will create the user if `isSignUp === true`,
       otherwise it attempts to sign-in. */
       const { error } = isSignUp
       ? await signUp(email, password)   // ✅ Create new user
       : await signIn(email, password)   // ✅ Log in existing user
                    // you can switch to signUp here if wanted

    if (error) {
      setErrorMsg(error.message)
    } else {
      /* success → hide modal & clear form */
      setEmail('')
      setPassword('')
      setShowModal(false)
      setWelcomeText('Welcome back!')
    }
  }

  /* ───────────── UI ───────────── */
  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white">
      {/* ─────────── TOP BAR ─────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-black">
        <div className="text-2xl font-bold">ApplyPilot</div>

        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="hover:text-gray-400">Features</a>
          <a href="#pricing"  className="hover:text-gray-400">Pricing</a>
          <a href="#contact"  className="hover:text-gray-400">Contact</a>
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
            {welcomeText}
          </h1>
          <p className="font-calsans mt-4 text-xl text-gray-300 max-w-xl mx-auto">
            {loggedIn
              ? 'Welcome back! Start applying to jobs.'
              : 'Automate every application, get AI-driven insights, and land your dream job faster than ever.'}
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
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
            />

            {errorMsg && (
              <p className="mb-3 text-sm text-red-400">{errorMsg}</p>
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
