import { useEffect, useState } from 'react'

/** CSS px: phones and tablets; wide laptop/desktop viewports excluded. */
const HANDSET_OR_TABLET_MQ = '(max-width: 1024px)'

export function useHandsetOrTablet() {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(HANDSET_OR_TABLET_MQ).matches
      : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(HANDSET_OR_TABLET_MQ)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return matches
}
