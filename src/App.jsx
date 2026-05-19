import { useEffect, useState } from 'react'
import SplashScreen from './utils/SplashScreen.jsx'
import { useHandsetOrTablet } from './utils/useHandsetOrTablet.js'
import { isAuthenticated } from './utils/auth.js'
import { hasValidDeviceId, prefetchDeviceImeiInBackground } from './utils/device.js'
import LoginScreen from './screens/LoginScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import PwaStatusBar from './components/PwaStatusBar.jsx'
import './App.css'

function App() {
  const isHandsetOrTablet = useHandsetOrTablet()
  const [splashDone, setSplashDone] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated())

  useEffect(() => {
    if (isHandsetOrTablet) prefetchDeviceImeiInBackground()
  }, [isHandsetOrTablet])

  if (!isHandsetOrTablet) {
    return (
      <div className="desktop-placeholder" role="presentation">
        <span className="visually-hidden">
          Geo Locate is only available on phones and tablets. Open this page on
          a smaller screen or resize the window.
        </span>
      </div>
    )
  }

  return (
    <>
      <PwaStatusBar />
      {!splashDone ? (
        <SplashScreen onComplete={() => setSplashDone(true)} />
      ) : null}

      {splashDone && (!isLoggedIn || !hasValidDeviceId()) ? (
        <LoginScreen onSuccess={() => setIsLoggedIn(true)} />
      ) : null}

      {splashDone && isLoggedIn && hasValidDeviceId() ? <HomeScreen /> : null}
    </>
  )
}

export default App
