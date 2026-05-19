import { useEffect, useState } from 'react'
import { login } from '../utils/auth.js'
import {
  captureDeviceImeiAsync,
  formatDeviceId,
  getDeviceId,
  isNativeImeiBridgeAvailable,
} from '../utils/device.js'
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

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [imei, setImei] = useState('')
  const [imeiFromDevice, setImeiFromDevice] = useState(false)
  const [imeiLoading, setImeiLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDeviceImei() {
      setImeiLoading(true)
      const captured = await captureDeviceImeiAsync()
      if (cancelled) return

      if (captured.ok) {
        setImei(captured.imei)
        setImeiFromDevice(captured.source === 'native' || isNativeImeiBridgeAvailable())
        setError('')
      } else if (isNativeImeiBridgeAvailable()) {
        setError('Device IMEI could not be read from this phone. Check app permissions.')
      }

      setImeiLoading(false)
    }

    loadDeviceImei()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    const freshImei = await captureDeviceImeiAsync(imei)
    if (!freshImei.ok) {
      setLoading(false)
      setError(
        freshImei.error ||
          'Device IMEI could not be read. Open the app on the registered Android phone.',
      )
      return
    }

    const result = await login({
      email,
      password,
      remember,
      imei: freshImei.imei,
    })
    setLoading(false)

    if (!result.ok || !result.deviceId) {
      setError(
        result.error ||
          'Device IMEI could not be verified. You will stay on the login screen.',
      )
      return
    }

    if (result.firstBind) {
      setInfo(
        `Device IMEI verified (${formatDeviceId(result.deviceId ?? getDeviceId())}). Opening app…`,
      )
      window.setTimeout(() => onSuccess(), 1200)
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
        <p className="login__subtitle">
          Device IMEI is read automatically from this phone and checked against the
          registered device before you can open the app.
        </p>
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

        <div className="login__field login__field--device">
          <span className="login__label">Device IMEI</span>
          {imeiLoading ? (
            <p className="login__device-status" role="status">
              Reading device IMEI…
            </p>
          ) : imei ? (
            <p className="login__device-status login__device-status--ok" role="status">
              <span className="login__device-status-icon" aria-hidden="true">
                <PhoneIcon />
              </span>
              <span>
                {imeiFromDevice ? 'Detected on this phone: ' : 'Using saved IMEI: '}
                <strong>{formatDeviceId(imei)}</strong>
              </span>
            </p>
          ) : (
            <p className="login__device-status login__device-status--warn" role="status">
              IMEI not available. Install the Android app on the registered phone, or
              enter it below for testing.
            </p>
          )}
          {!imeiFromDevice && !imeiLoading ? (
            <span className="login__input-wrap">
              <span className="login__input-icon">
                <PhoneIcon />
              </span>
              <input
                type="text"
                name="imei"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Enter device IMEI (testing only)"
                value={imei}
                onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
              />
            </span>
          ) : null}
        </div>

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

        <button
          type="submit"
          className="login__submit"
          disabled={loading || imeiLoading}
        >
          {loading ? 'Signing in…' : imeiLoading ? 'Reading device…' : 'Sign in'}
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
