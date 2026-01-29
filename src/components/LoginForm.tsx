'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/ralph-quotes'

export default function LoginForm() {
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
      }
    } catch (err: any) {
      setError(err.message || getRandomQuote('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 login-gradient">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-50" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-50" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            🍾 BSH Inventory
          </h2>
          <p className="text-center text-gray-500 mb-4">
            I'm helping with the bottles!
          </p>
          
          {/* Ralph Quote */}
          <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-xl p-3 mb-6 text-center">
            <p className="text-sm text-gray-600 italic">"{quote}"</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                📧 Your Email Thingy
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Type with your fingers!"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                🔐 Secret Password (Shhh!)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="I won't tell nobody!"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none transition-colors"
                required
              />
            </div>

            {error && (
              <div className={`p-3 rounded-xl text-sm ${error.includes('Check your email') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {error.includes('Check your email') ? '✅' : '🙈'} {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? '🔄 Loading...' : isSignUp ? '🎉 Sign Me Up!' : '🚀 I\'m Logging In!'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
            >
              {isSignUp ? 'Already have an account? Log in!' : "Don't have an account? Sign up!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
