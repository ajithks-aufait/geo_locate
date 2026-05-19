# Geo Locate

React + Vite PWA with device IMEI binding for sign-in.

## IMEI and the Android app

**A PWA opened in Chrome cannot read the phone IMEI** — browsers block it for privacy. IMEI works only in the **native Android app** built with Capacitor.

### Run on Android (required for IMEI)

1. Install dependencies: `npm ci`
2. Set the allowed IMEI in `src/utils/device.js` → `DEFAULT_DEVICE_IMEI`
3. Build and open Android Studio:
   ```bash
   npm run cap:android
   ```
4. In Android Studio, run the app on a **physical device**
5. When prompted, allow **Phone** permission
6. Sign in — IMEI is read in the background and compared to `DEFAULT_DEVICE_IMEI`

After web changes:

```bash
npm run cap:sync
```

### Browser development only

For local testing in Chrome, set in `.env.development`:

```
VITE_DEV_DEVICE_IMEI=your_registered_imei_here
```

Then `npm run dev`. This does **not** apply to production builds.

## Web app & offline PWA

The app uses a **Workbox service worker** (via `vite-plugin-pwa`) that:

- Precaches JS, CSS, HTML, icons, and splash assets after the first visit
- Serves the app shell offline (`index.html` fallback for navigation)
- Caches GET `/api/*` with network-first (falls back when offline; login binding also uses `localStorage`)
- Shows banners when the app is ready offline or when you lose connection

```bash
npm run dev          # service worker enabled in dev (see vite PWA devOptions)
npm run build        # generates dist/sw.js + precache manifest
npm run preview      # test production offline: build, preview, visit once online, then go offline
```

After deploy, users must open the app **once while online** so the service worker can install and cache assets.
