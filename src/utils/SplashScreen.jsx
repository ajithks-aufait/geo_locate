import { useCallback, useEffect, useRef, useState } from 'react'
import splashGif from '../assets/splash-screen.gif'
import { parseGifDurationMs } from './gifDuration.js'
import './SplashScreen.css'

const MIN_VISIBLE_MS = 900
const MAX_VISIBLE_MS = 4500
const SPLASH_DURATION_CAP_MS = 60_000

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  /** null = still parsing, -1 = unknown / invalid, >0 = one GIF cycle in ms */
  const [cycleDurationMs, setCycleDurationMs] = useState(null)
  const splashImgLoadAtRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    document.documentElement.classList.add('splash-active')
    return () => document.documentElement.classList.remove('splash-active')
  }, [])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    window.setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 380)
  }, [onComplete])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(splashGif)
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const ms = parseGifDurationMs(buf)
        setCycleDurationMs(ms != null && ms > 0 ? ms : -1)
      } catch {
        if (!cancelled) setCycleDurationMs(-1)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!imageReady || cycleDurationMs === null) return

    let hideTimer
    let maxTimer
    let minTimer

    const clearAll = () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(maxTimer)
      window.clearTimeout(minTimer)
    }

    const goFinish = () => {
      clearAll()
      finish()
    }

    if (cycleDurationMs > 0) {
      const cap = Math.min(cycleDurationMs, SPLASH_DURATION_CAP_MS)
      const loadedAt = splashImgLoadAtRef.current ?? performance.now()
      const elapsed = Math.max(0, performance.now() - loadedAt)
      const wait = Math.max(0, cap - elapsed)
      hideTimer = window.setTimeout(goFinish, wait)
      return clearAll
    }

    // Fallback: min visible time after load, plus a max guard.
    const started = performance.now()
    const afterMin = () => {
      const elapsed = performance.now() - started
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)
      minTimer = window.setTimeout(goFinish, remaining)
    }

    const onWinLoad = () => {
      window.removeEventListener('load', onWinLoad)
      window.clearTimeout(maxTimer)
      afterMin()
    }

    if (document.readyState === 'complete') {
      afterMin()
    } else {
      window.addEventListener('load', onWinLoad)
      maxTimer = window.setTimeout(() => {
        window.removeEventListener('load', onWinLoad)
        afterMin()
      }, MAX_VISIBLE_MS)
    }

    return clearAll
  }, [imageReady, cycleDurationMs, finish])

  if (!visible) return null

  return (
    <div
      className={`splash-screen${exiting ? ' splash-screen--exit' : ''}`}
      role="presentation"
      aria-label="Loading"
    >
      <img
        className="splash-screen__gif"
        src={splashGif}
        alt=""
        decoding="async"
        fetchPriority="high"
        onLoad={() => {
          splashImgLoadAtRef.current = performance.now()
          setImageReady(true)
        }}
        onError={() => {
          splashImgLoadAtRef.current = performance.now()
          setImageReady(true)
        }}
      />
    </div>
  )
}
