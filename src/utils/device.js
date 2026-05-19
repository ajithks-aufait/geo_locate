import { Capacitor } from '@capacitor/core'
import { DeviceImei } from '../plugins/deviceImei.js'

/** Allowed device IMEI for this app (must match on login). */
export const DEFAULT_DEVICE_IMEI = '865780069245455'

export const DEVICE_NOT_BOUND_MESSAGE =
  'This device is not bind. Sign-in is only allowed on the registered phone.'

const DEVICE_IMEI_KEY = 'geo_loc_device_imei'
const NATIVE_IMEI_POLL_MS = 200
const NATIVE_IMEI_MAX_ATTEMPTS = 20

let cachedNativeImei = null
let backgroundPrefetchPromise = null

function canUsePersistentStorage() {
  try {
    const probe = '__geo_loc_storage_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function normalizeImei(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** True when running inside the Capacitor Android APK (not Chrome browser PWA). */
export function isRunningInNativeApp() {
  return Capacitor.isNativePlatform()
}

export function isNativeImeiBridgeAvailable() {
  if (typeof window === 'undefined') return false
  const w = window
  return (
    isRunningInNativeApp() ||
    typeof w.Android?.getImei === 'function' ||
    typeof w.Android?.getDeviceImei === 'function' ||
    Boolean(w.__DEVICE_IMEI__)
  )
}

export function getDeviceImeiEnvironmentMessage() {
  if (isRunningInNativeApp()) {
    return 'Could not read device IMEI. Allow Phone permission in app settings and try again.'
  }
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_DEVICE_IMEI) {
    return 'Using dev IMEI from VITE_DEV_DEVICE_IMEI (browser testing only).'
  }
  return (
    'IMEI cannot be read in the browser. Install the Geo Locate Android app from your ' +
    'build (npm run cap:android) — a normal PWA in Chrome cannot access IMEI.'
  )
}

function readDevFallbackImei() {
  if (!import.meta.env.DEV) return null
  const dev = import.meta.env.VITE_DEV_DEVICE_IMEI
  if (!dev) return null
  const imei = normalizeImei(dev)
  return imei.length >= 14 ? imei : null
}

async function readCapacitorImei() {
  if (!isRunningInNativeApp()) return null
  try {
    const result = await DeviceImei.getImei()
    const imei = normalizeImei(result?.imei)
    if (imei.length >= 14) {
      if (typeof window !== 'undefined') {
        window.__DEVICE_IMEI__ = imei
      }
      return imei
    }
  } catch (err) {
    console.warn('[device] Capacitor DeviceImei.getImei failed:', err)
  }
  return null
}

function readNativeImei() {
  if (typeof window === 'undefined') return null
  const w = window
  try {
    if (typeof w.Android?.getImei === 'function') return w.Android.getImei()
    if (typeof w.Android?.getDeviceImei === 'function') return w.Android.getDeviceImei()
  } catch {
    /* WebView bridge may throw if permission denied */
  }
  if (w.__DEVICE_IMEI__) return String(w.__DEVICE_IMEI__)
  return readDevFallbackImei()
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Polls Capacitor plugin + Android WebView bridge — IMEI may appear after permission grant.
 */
export async function fetchNativeImeiAsync({
  maxAttempts = NATIVE_IMEI_MAX_ATTEMPTS,
  intervalMs = NATIVE_IMEI_POLL_MS,
} = {}) {
  const fromCapacitor = await readCapacitorImei()
  if (fromCapacitor) {
    return { ok: true, imei: fromCapacitor, source: 'native' }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const imei = normalizeImei(readNativeImei())
    if (imei.length >= 14) {
      return { ok: true, imei, source: 'native' }
    }
    if (attempt < maxAttempts - 1) {
      await delay(intervalMs)
    }
  }

  const devImei = readDevFallbackImei()
  if (devImei) {
    return { ok: true, imei: devImei, source: 'dev' }
  }

  return { ok: false }
}

/** Starts IMEI read in the background (no UI). Safe to call multiple times. */
export function prefetchDeviceImeiInBackground() {
  if (backgroundPrefetchPromise) return backgroundPrefetchPromise

  backgroundPrefetchPromise = (async () => {
    const native = await fetchNativeImeiAsync()
    if (native.ok) {
      cachedNativeImei = native.imei
      return
    }
    const stored = captureDeviceImei(null)
    if (stored.ok) cachedNativeImei = stored.imei
  })()

  return backgroundPrefetchPromise
}

/**
 * Reads IMEI from native bridge or storage (no manual entry).
 */
export async function captureDeviceImeiAsync() {
  await prefetchDeviceImeiInBackground()

  const native = await fetchNativeImeiAsync()
  if (native.ok) {
    cachedNativeImei = native.imei
    return native
  }

  return captureDeviceImei(null)
}

/**
 * Reads IMEI from native bridge or storage.
 */
export function captureDeviceImei(manualImei) {
  const sources = [readNativeImei(), cachedNativeImei, manualImei, readDevFallbackImei()]
  if (canUsePersistentStorage()) {
    try {
      sources.push(localStorage.getItem(DEVICE_IMEI_KEY))
    } catch {
      /* ignore */
    }
  }

  for (const raw of sources) {
    const imei = normalizeImei(raw)
    if (imei.length >= 14) {
      return { ok: true, imei }
    }
  }

  return {
    ok: false,
    error: getDeviceImeiEnvironmentMessage(),
  }
}

/** Login is allowed only when device IMEI equals DEFAULT_DEVICE_IMEI. */
export function validateImeiMatchesDefault(imei) {
  const current = normalizeImei(imei)
  const expected = normalizeImei(DEFAULT_DEVICE_IMEI)

  if (!current) {
    return {
      ok: false,
      code: 'IMEI_CAPTURE_FAILED',
      error: getDeviceImeiEnvironmentMessage(),
    }
  }

  if (current !== expected) {
    return {
      ok: false,
      code: 'IMEI_MISMATCH',
      error: DEVICE_NOT_BOUND_MESSAGE,
    }
  }

  return { ok: true, imei: current }
}

/** Capture + compare IMEI to registered device (call on sign-in). */
export async function captureDeviceIdAsync() {
  const captured = await captureDeviceImeiAsync()
  if (!captured.ok) {
    return { ok: false, code: 'IMEI_CAPTURE_FAILED', error: captured.error }
  }

  const validated = validateImeiMatchesDefault(captured.imei)
  if (!validated.ok) {
    return {
      ok: false,
      code: validated.code,
      error: validated.error,
    }
  }

  if (canUsePersistentStorage()) {
    try {
      localStorage.setItem(DEVICE_IMEI_KEY, validated.imei)
      const verify = localStorage.getItem(DEVICE_IMEI_KEY)
      if (verify !== validated.imei) {
        return {
          ok: false,
          code: 'IMEI_CAPTURE_FAILED',
          error: 'Device IMEI could not be saved on this device.',
        }
      }
    } catch {
      return {
        ok: false,
        code: 'IMEI_CAPTURE_FAILED',
        error: 'Device storage is blocked. Allow storage to save device IMEI.',
      }
    }
  }

  return { ok: true, deviceId: validated.imei }
}

export function captureDeviceId() {
  const captured = captureDeviceImei(null)
  if (!captured.ok) {
    return { ok: false, code: 'IMEI_CAPTURE_FAILED', error: captured.error }
  }

  const validated = validateImeiMatchesDefault(captured.imei)
  if (!validated.ok) {
    return {
      ok: false,
      code: validated.code,
      error: validated.error,
    }
  }

  if (canUsePersistentStorage()) {
    try {
      localStorage.setItem(DEVICE_IMEI_KEY, validated.imei)
      const verify = localStorage.getItem(DEVICE_IMEI_KEY)
      if (verify !== validated.imei) {
        return {
          ok: false,
          code: 'IMEI_CAPTURE_FAILED',
          error: 'Device IMEI could not be saved on this device.',
        }
      }
    } catch {
      return {
        ok: false,
        code: 'IMEI_CAPTURE_FAILED',
        error: 'Device storage is blocked. Allow storage to save device IMEI.',
      }
    }
  }

  return { ok: true, deviceId: validated.imei }
}

export function hasValidDeviceId() {
  const captured = captureDeviceId()
  return captured.ok
}

export function getDeviceId() {
  const captured = captureDeviceId()
  return captured.ok ? captured.deviceId : null
}

export function formatDeviceId(id) {
  if (!id) return '—'
  const digits = normalizeImei(id)
  if (digits.length <= 16) return digits
  return `${digits.slice(0, 8)}…${digits.slice(-4)}`
}
