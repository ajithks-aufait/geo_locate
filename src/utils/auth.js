import { captureDeviceId } from './device.js'
import { isDeviceAllowedForSession, verifyAndBindDevice } from './deviceBinding.js'

const AUTH_KEY = 'geo_loc_session'
const SESSION_EMAIL_KEY = 'geo_loc_session_email'
const AUTH_SESSION_KEY = 'geo_loc_session_tab'

function storage(persistent) {
  return persistent ? localStorage : sessionStorage
}

export function getSessionEmail() {
  try {
    return (
      localStorage.getItem(SESSION_EMAIL_KEY) ||
      sessionStorage.getItem(SESSION_EMAIL_KEY) ||
      ''
    )
  } catch {
    return ''
  }
}

export function isAuthenticated() {
  try {
    if (!captureDeviceId(null).ok) {
      clearSession()
      return false
    }
    const hasSession =
      localStorage.getItem(AUTH_KEY) === '1' ||
      sessionStorage.getItem(AUTH_SESSION_KEY) === '1'
    if (!hasSession) return false
    const email = getSessionEmail()
    if (!email || !isDeviceAllowedForSession(email)) {
      clearSession()
      return false
    }
    return true
  } catch {
    return false
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(SESSION_EMAIL_KEY)
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    sessionStorage.removeItem(SESSION_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

function setAuthenticated(value, email = '', remember = true) {
  clearSession()
  if (!value) return
  const store = storage(remember)
  const normalized = email.trim().toLowerCase()
  store.setItem(remember ? AUTH_KEY : AUTH_SESSION_KEY, '1')
  if (normalized) store.setItem(SESSION_EMAIL_KEY, normalized)
}

/**
 * Demo login + device binding (IMEI is not available in PWA; uses install device ID).
 */
export async function login({ email, password, remember, imei }) {
  const trimmed = email.trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' }
  }

  const binding = await verifyAndBindDevice(trimmed, imei)
  if (!binding.ok) {
    if (binding.code === 'IMEI_MISMATCH') {
      return {
        ok: false,
        error:
          binding.error ||
          'Device IMEI does not match. Sign-in is only allowed on the registered device.',
        code: 'IMEI_MISMATCH',
      }
    }
    if (
      binding.code === 'DEVICE_CAPTURE_FAILED' ||
      binding.code === 'IMEI_CAPTURE_FAILED'
    ) {
      return {
        ok: false,
        error:
          binding.error ||
          'Device IMEI could not be captured. You cannot continue to the app.',
        code: binding.code,
      }
    }
    if (binding.code === 'DEVICE_MISMATCH') {
      return {
        ok: false,
        error:
          'This account is already registered on another device. Sign in is only allowed on that device.',
        code: 'DEVICE_MISMATCH',
      }
    }
    return { ok: false, error: 'Could not verify this device. Try again.' }
  }

  if (!binding.deviceId || !captureDeviceId(imei).ok) {
    return {
      ok: false,
      error: 'Device IMEI could not be verified. You cannot continue to the app.',
      code: 'IMEI_CAPTURE_FAILED',
    }
  }

  setAuthenticated(true, trimmed, remember)

  return {
    ok: true,
    firstBind: binding.firstBind,
    deviceId: binding.deviceId,
  }
}

export function signOut() {
  clearSession()
}
