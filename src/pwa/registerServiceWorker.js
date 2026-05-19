import { registerSW } from 'virtual:pwa-register'

const OFFLINE_READY_EVENT = 'geo-loc:offline-ready'
const SW_UPDATE_EVENT = 'geo-loc:sw-updated'

/**
 * Registers the Workbox service worker (precache + runtime routes).
 * Dispatches window events for UI: offline-ready and update installed.
 */
export function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  const updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent(OFFLINE_READY_EVENT))
    },
    onNeedRefresh() {
      updateSW(true)
    },
    onRegistered(registration) {
      if (!registration) return
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'activated' &&
            navigator.serviceWorker.controller
          ) {
            window.dispatchEvent(new CustomEvent(SW_UPDATE_EVENT))
          }
        })
      })
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error)
    },
  })

  return updateSW
}

export { OFFLINE_READY_EVENT, SW_UPDATE_EVENT }
