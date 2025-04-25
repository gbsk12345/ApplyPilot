import { useState } from 'react'
import FancyBackground from './FancyBackground'


export default function App() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="relative flex flex-col min-h-screen bg-black text-white">
      
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-black">
        <div className="text-2xl font-bold">ApplyPilot</div>
        <nav className="flex space-x-6">
          <a href="#" className="hover:text-gray-400">Features</a>
          <a href="#" className="hover:text-gray-400">Pricing</a>
          <a href="#" className="hover:text-gray-400">Contact</a>
        </nav>
        <button
          onClick={() => setShowLogin(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md"
        >
          Login
        </button>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-20 text-center min-h-screen">
      <FancyBackground />
  <div>
    <h1 className=" text-6xl text-purple-600 font-bold">
     Apply to Jobs Intelligently
    </h1>
    <p className="font-calsans mt-4 text-xl text-gray-300 max-w-xl mx-auto">
      Automate every application, get AI-driven insights, and land your dream job faster than ever.
    </p>
  </div>
</main>

<section id="pricing" className="px-8 py-16 bg-black">
        <h2 className="text-3xl font-bold mb-4 text-purple-500">Pricing</h2>
        <p className="max-w-2xl mx-auto">
          Free forever for students. Pro plan for professionals at $9/mo.
        </p>
      </section>

      <section id="contact" className="px-8 py-16 bg-gray-900">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="max-w-2xl mx-auto">
          Questions? Email us at <a href="mailto:support@applypilot.com" className="underline">support@applypilot.com</a>.
        </p>
      </section>


      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="w-80 rounded-lg bg-gray-900 p-8">
            <h2 className="mb-4 text-2xl font-bold">Login</h2>
            <input
              type="email"
              placeholder="Email"
              className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
            />
            <input
              type="password"
              placeholder="Password"
              className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
            />
            <button className="w-full rounded bg-purple-600 py-2 font-semibold hover:bg-purple-700">
              Submit
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className="mt-4 w-full text-center underline text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
