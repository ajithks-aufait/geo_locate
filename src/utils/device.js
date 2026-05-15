/** Allowed device IMEI for this app (must match on login). */
export const DEFAULT_DEVICE_IMEI = '865780069245455'

const DEVICE_IMEI_KEY = 'geo_loc_device_imei'

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

function readNativeImei() {
  if (typeof window === 'undefined') return null
  const w = window
  if (typeof w.Android?.getImei === 'function') return w.Android.getImei()
  if (typeof w.Android?.getDeviceImei === 'function') return w.Android.getDeviceImei()
  if (w.__DEVICE_IMEI__) return String(w.__DEVICE_IMEI__)
  return null
}

/**
 * Reads IMEI from native bridge, storage, or manual entry (PWA cannot read IMEI in normal browsers).
 */
export function captureDeviceImei(manualImei) {
  const sources = [readNativeImei(), manualImei]
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
    error:
      'Device IMEI could not be read. Enter your device IMEI or open the installed app on the registered phone.',
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
      error: 'Device IMEI is missing. Sign-in is not allowed.',
    }
  }

  if (current !== expected) {
    return {
      ok: false,
      code: 'IMEI_MISMATCH',
      error:
        'Device IMEI does not match the registered device. Sign-in is only allowed on the authorized phone.',
    }
  }

  return { ok: true, imei: current }
}

/**
 * Capture IMEI and verify it matches the default allowed IMEI.
 * Used before redirecting to the home screen.
 */
export function captureDeviceId(manualImei) {
  const captured = captureDeviceImei(manualImei)
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
