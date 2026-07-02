'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/admin/upload')
      router.refresh()
    }
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-6 font-bold text-white">Admin login</h1>
      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-white/10 rounded bg-[#16181D] text-gray-200 placeholder-gray-600 outline-none focus:border-[#C9A961]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-white/10 rounded bg-[#16181D] text-gray-200 placeholder-gray-600 outline-none focus:border-[#C9A961]"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#C9A961] text-[#0A0A0C] p-2 rounded hover:bg-[#a58943] disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </main>
  )
}
