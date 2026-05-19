import { useEffect, useState } from 'react'
import {
  OFFLINE_READY_EVENT,
  SW_UPDATE_EVENT,
} from '../pwa/registerServiceWorker.js'
import { useOnlineStatus } from '../utils/useOnlineStatus.js'
import './PwaStatusBar.css'

export default function PwaStatusBar() {
  const online = useOnlineStatus()
  const [offlineReady, setOfflineReady] = useState(false)
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    const onReady = () => setOfflineReady(true)
    const onUpdated = () => setUpdated(true)
    window.addEventListener(OFFLINE_READY_EVENT, onReady)
    window.addEventListener(SW_UPDATE_EVENT, onUpdated)
    return () => {
      window.removeEventListener(OFFLINE_READY_EVENT, onReady)
      window.removeEventListener(SW_UPDATE_EVENT, onUpdated)
    }
  }, [])

  useEffect(() => {
    if (!offlineReady && !updated) return undefined
    const timer = window.setTimeout(() => {
      setOfflineReady(false)
      setUpdated(false)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [offlineReady, updated])

  if (!online) {
    return (
      <div className="pwa-status pwa-status--offline" role="status">
        You are offline — cached app screens still work. Location needs a network
        when available.
      </div>
    )
  }

  if (updated) {
    return (
      <div className="pwa-status pwa-status--update" role="status">
        App updated. You are on the latest version.
      </div>
    )
  }

  if (offlineReady) {
    return (
      <div className="pwa-status pwa-status--ready" role="status">
        Ready for offline use — UI and sign-in data are cached on this device.
      </div>
    )
  }

  return null
}
