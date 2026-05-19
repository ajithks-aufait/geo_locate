import { useState } from 'react'
import { login } from '../utils/auth.js'
import './LoginScreen.css'

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m5 8 7 5.5L19 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8.5a4 4 0 1 1 8 0V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12s3.5-6 9-6c2.2 0 4.1.9 5.5 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M21 12s-3.5 6-9 6c-2.2 0-4.1-.9-5.5-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const result = await login({ email, password, remember })
    setLoading(false)

    if (!result.ok || !result.deviceId) {
      setError(result.error || 'Sign-in failed. Please try again.')
      return
    }

    if (result.firstBind) {
      setInfo('Device verified. Opening app…')
      window.setTimeout(() => onSuccess(), 800)
      return
    }

    onSuccess()
  }

  return (
    <div className="login login--enter" aria-labelledby="login-title">
      <div className="login__brand">
        <div className="login__logo" aria-hidden="true">
          <span className="login__logo-ring" />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
              fill="#fff"
              opacity="0.95"
            />
            <circle cx="12" cy="11" r="2.5" fill="#863bff" />
          </svg>
        </div>
        <h1 id="login-title" className="login__title">
          Welcome back
        </h1>
        <p className="login__subtitle">Sign in with your email and password.</p>
      </div>

      <form className="login__form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="login__error" role="alert">
            {error}
          </p>
        ) : null}

        {info ? (
          <p className="login__info" role="status">
            {info}
          </p>
        ) : null}

        <label className="login__field">
          <span className="login__label">Email</span>
          <span className="login__input-wrap">
            <span className="login__input-icon">
              <MailIcon />
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </span>
        </label>

        <label className="login__field">
          <span className="login__label">Password</span>
          <span className="login__input-wrap">
            <span className="login__input-icon">
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="login__toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={loading}
            >
              <EyeIcon open={showPassword} />
            </button>
          </span>
        </label>

        <div className="login__row">
          <label className="login__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me</span>
          </label>
          <button type="button" className="login__link" disabled={loading}>
            Forgot password?
          </button>
        </div>

        <button type="submit" className="login__submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="login__footer">
        Don&apos;t have an account?{' '}
        <button type="button" className="login__link login__link--bold" disabled={loading}>
          Sign up
        </button>
      </p>
    </div>
  )
}