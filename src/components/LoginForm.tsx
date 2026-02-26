'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/messages'

interface LoginFormProps {
  onLogin?: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [quote, setQuote] = useState('')

  useEffect(() => {
    setQuote(getRandomQuote('login'))
    const interval = setInterval(() => {
      setQuote(getRandomQuote('login'))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setError('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (onLogin) onLogin()
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200 rounded-full opacity-30" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-30" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-center mb-1">
            🍾 BSH Inventory
          </h2>
          <p className="text-center text-gray-500 mb-4">Bradshaw Social House</p>

          {/* Rotating quote */}
          <div className="text-center mb-6 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-sm text-gray-600 italic">{quote}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
              />
            </div>

            {error && (
              <div className={`p-3 rounded-xl text-sm ${
                error.includes('Check your email')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? '⏳ Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}
