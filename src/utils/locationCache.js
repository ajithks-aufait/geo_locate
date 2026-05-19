const LAST_LOCATION_KEY = 'geo_loc_last_position'

export function saveLastLocation(coords) {
  try {
    localStorage.setItem(
      LAST_LOCATION_KEY,
      JSON.stringify({
        ...coords,
        savedAt: new Date().toISOString(),
      }),
    )
  } catch {
    /* storage full or blocked */
  }
}

export function loadLastLocation() {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return null
    return data
  } catch {
    return null
  }
}
