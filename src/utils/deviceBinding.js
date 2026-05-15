import { captureDeviceId } from './device.js'

const LOCAL_BINDINGS_KEY = 'geo_loc_device_bindings'

function readLocalBindings() {
  try {
    const raw = localStorage.getItem(LOCAL_BINDINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeLocalBindings(map) {
  try {
    localStorage.setItem(LOCAL_BINDINGS_KEY, JSON.stringify(map))
  } catch {
    throw new Error('DEVICE_STORAGE_FAILED')
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

async function apiRequest(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }
  return { ok: res.ok, status: res.status, data }
}

async function fetchRemoteBinding(email) {
  const q = encodeURIComponent(normalizeEmail(email))
  const { ok, status, data } = await apiRequest(`/api/device-binding?email=${q}`)
  if (status === 404) return null
  if (!ok) throw new Error(data?.message || 'Could not verify device.')
  return data
}

async function registerRemoteBinding(email, deviceId) {
  const { ok, status, data } = await apiRequest('/api/device-binding', {
    method: 'POST',
    body: JSON.stringify({
      email: normalizeEmail(email),
      deviceId,
    }),
  })
  if (ok) return { ok: true, deviceId: data.deviceId ?? deviceId }
  if (status === 409) {
    return {
      ok: false,
      code: 'DEVICE_MISMATCH',
      boundDeviceId: data?.deviceId,
    }
  }
  throw new Error(data?.message || 'Could not register this device.')
}

function getLocalBinding(email) {
  const map = readLocalBindings()
  return map[normalizeEmail(email)] ?? null
}

function setLocalBinding(email, deviceId) {
  const map = readLocalBindings()
  map[normalizeEmail(email)] = {
    deviceId,
    boundAt: new Date().toISOString(),
  }
  writeLocalBindings(map)
}

export async function verifyAndBindDevice(email, manualImei) {
  const captured = captureDeviceId(manualImei)
  if (!captured.ok) {
    return {
      ok: false,
      code: captured.code || 'DEVICE_CAPTURE_FAILED',
      error: captured.error,
    }
  }

  const deviceId = captured.deviceId

  try {
    const remote = await fetchRemoteBinding(email)
    if (remote?.deviceId) {
      if (remote.deviceId !== deviceId) {
        return {
          ok: false,
          code: 'DEVICE_MISMATCH',
          deviceId,
          boundDeviceId: remote.deviceId,
        }
      }
      setLocalBinding(email, deviceId)
      return { ok: true, deviceId, firstBind: false, source: 'remote' }
    }

    const registered = await registerRemoteBinding(email, deviceId)
    if (!registered.ok) {
      return {
        ok: false,
        code: registered.code,
        deviceId,
        boundDeviceId: registered.boundDeviceId,
      }
    }
    setLocalBinding(email, deviceId)
    return { ok: true, deviceId, firstBind: true, source: 'remote' }
  } catch (err) {
    if (err.message === 'DEVICE_STORAGE_FAILED') {
      return {
        ok: false,
        code: 'DEVICE_CAPTURE_FAILED',
        error: 'Device ID (EMI) could not be stored on this device.',
      }
    }
    /* API unavailable — on-device registry */
  }

  try {
    const local = getLocalBinding(email)
    if (local?.deviceId) {
      if (local.deviceId !== deviceId) {
        return {
          ok: false,
          code: 'DEVICE_MISMATCH',
          deviceId,
          boundDeviceId: local.deviceId,
        }
      }
      return { ok: true, deviceId, firstBind: false, source: 'local' }
    }

    setLocalBinding(email, deviceId)
    return { ok: true, deviceId, firstBind: true, source: 'local' }
  } catch {
    return {
      ok: false,
      code: 'DEVICE_CAPTURE_FAILED',
      error: 'Device ID (EMI) could not be stored on this device.',
    }
  }
}

export function isDeviceAllowedForSession(email) {
  const captured = captureDeviceId(null)
  if (!captured.ok) return false

  const local = getLocalBinding(email)
  if (!local?.deviceId) return false
  return local.deviceId === captured.deviceId
}
