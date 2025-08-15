import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import debounce from 'lodash.debounce'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import '../assets/auth-style.css'

export default function Auth({ setShowNav }) {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const params = new URLSearchParams(window.location.search)
  const next = params.get('next') || '/'

  useEffect(() => setShowNav(false), [])
  useEffect(() => {
    if (view === 'register' && username.trim().length >= 3) {
      checkUsernameDebounced(username.toLowerCase())
    } else {
      setUsernameAvailable(null)
    }
  }, [username])

  const checkUsernameAvailability = async (name) => {
    setCheckingUsername(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', name)
      .maybeSingle()
    setUsernameAvailable(!data)
    setCheckingUsername(false)
  }

  const checkUsernameDebounced = debounce(checkUsernameAvailability, 400)

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')
    try {

if (view === 'login') {
  const res = await fetch('https://hvhkumhlapuaxhpqrnzu.supabase.co/functions/v1/login-with-identifier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password })
  })

  const result = await res.json()

  if (!res.ok) {
    throw new Error(result.error || 'Login failed')
  }

  const { session } = result

  if (!session) {
    throw new Error('No session returned from login')
  }

  const { access_token, refresh_token } = session

  await supabase.auth.setSession({
    access_token,
    refresh_token
  })

  setMessage('Redirecting…')
  window.location.href = next
}


 else if (view === 'register') {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
          throw new Error('Username must be 3–20 letters/numbers/underscores.')
        if (!usernameAvailable) throw new Error('Username is taken.')

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.toLowerCase() } },
        })
        if (error) throw error
        setMessage('Check your email to confirm.')

      } else if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setMessage('Reset link sent to your email.')
      }
    } catch (err) {
      setMessage(err.message)
    }
    setLoading(false)
  }


  const title = {
    login: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset your password',
  }[view]

  return (
    <div className="auth-container" onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit()
}}>
      <div className="auth-blob"></div>
      
      <div className="auth-glass relative">
          <div className="auth-card-base"></div>
        <div className="auth-header">
          <h1 className="auth-title">Loopfeed</h1>
          <p className="auth-subtitle">{title}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="auth-fields"
          >
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {view === 'register' && (
              <div>
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="loopmaster"
                />
                <p className={`auth-hint ${
                  checkingUsername
                    ? 'hint-loading'
                    : usernameAvailable
                    ? 'hint-available'
                    : 'hint-taken'
                }`}>
                  {checkingUsername
                    ? 'Checking availability…'
                    : usernameAvailable
                    ? 'Username is available!'
                    : username
                    ? 'Username is taken.'
                    : ''}
                </p>
              </div>
            )}

            {view !== 'forgot' && (
              <div>
                <label>Password</label>
                <input
                  type="password"
                  value={password}

                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || (view === 'register' && (!usernameAvailable || checkingUsername))}
              className="auth-button bg-blue-500"
            >
              {loading ? (
                <span className="loading">
                  <Loader2 className="icon-spin" /> Processing…
                </span>
              ) : view === 'login' ? (
                'Sign In'
              ) : view === 'register' ? (
                'Create Account'
              ) : (
                'Send Reset Link'
              )}
            </button>

            {message && <div className="auth-message">{message}</div>}
          </motion.div>
        </AnimatePresence>

        <div className="auth-footer">
          {view === 'login' && (
            <>
              <p>
                Don’t have an account?{' '}
                <button onClick={() => setView('register')}>Sign up</button>
              </p>
              <p>
                <button onClick={() => setView('forgot')}>Forgot password?</button>
              </p>
            </>
          )}
          {view === 'register' && (
            <p>
              Already have an account?{' '}
              <button onClick={() => setView('login')}>Sign in</button>
            </p>
          )}
          {view === 'forgot' && (
            <p>
              Back to{' '}
              <button onClick={() => setView('login')}>login</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
