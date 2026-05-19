import { registerPlugin } from '@capacitor/core'

/**
 * Native Android plugin — reads IMEI via TelephonyManager (not available in browser PWA).
 */
export const DeviceImei = registerPlugin('DeviceImei')
