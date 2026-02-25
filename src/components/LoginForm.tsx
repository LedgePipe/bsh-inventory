'use client'


import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getRandomQuote } from '@/lib/messages'


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
