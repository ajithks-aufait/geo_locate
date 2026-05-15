import { useCallback, useState } from 'react'
import { getSessionEmail, signOut } from '../utils/auth.js'
import { formatDeviceId, getDeviceId } from '../utils/device.js'
import './HomeScreen.css'

export default function HomeScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coords, setCoords] = useState(null)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setError(null)
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        setCoords(null)
        setLoading(false)
        setError(err.message || 'Could not read your location.')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }, [])

  const handleSignOut = () => {
    signOut()
    window.location.reload()
  }

  const deviceLabel = formatDeviceId(getDeviceId())
  const sessionEmail = getSessionEmail()

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <h1 className="home__title">Geo Locate</h1>
          <p className="home__sub">Your position, saved on device after install.</p>
          {sessionEmail ? (
            <p className="home__device">
              {sessionEmail} · IMEI {deviceLabel}
            </p>
          ) : null}
        </div>
        <button type="button" className="home__sign-out" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      <main className="home__main">
        <button
          type="button"
          className="home__primary"
          onClick={locate}
          disabled={loading}
        >
          {loading ? 'Getting location…' : 'Use my location'}
        </button>

        {error ? <p className="home__error">{error}</p> : null}

        {coords ? (
          <section className="home__card" aria-live="polite">
            <h2 className="home__card-title">Last fix</h2>
            <dl className="home__dl">
              <div>
                <dt>Latitude</dt>
                <dd>{coords.lat.toFixed(6)}</dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd>{coords.lng.toFixed(6)}</dd>
              </div>
              <div>
                <dt>Accuracy</dt>
                <dd>±{Math.round(coords.accuracy)} m</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </main>
    </div>
  )
}
