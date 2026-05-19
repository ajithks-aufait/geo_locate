/**
 * Example Android WebView bridge so the PWA can read IMEI automatically.
 *
 * In your Activity, after WebView loads:
 *   webView.addJavascriptInterface(DeviceBridge(this), "Android")
 *
 * AndroidManifest.xml needs:
 *   <uses-permission android:name="android.permission.READ_PHONE_STATE" />
 *
 * On Android 10+ IMEI may be restricted unless the app is a device/profile owner
 * or holds carrier privileges. Test on a real device with the registered IMEI.
 */
package com.example.geolocate

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.telephony.TelephonyManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class DeviceBridge(private val context: Context) {

  @JavascriptInterface
  fun getImei(): String {
    return readImei()
  }

  @JavascriptInterface
  fun getDeviceImei(): String = getImei()

  @SuppressLint("HardwareIds")
  private fun readImei(): String {
    val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
      ?: return ""
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        tm.imei ?: ""
      } else {
        @Suppress("DEPRECATION")
        tm.deviceId ?: ""
      }
    } catch (_: SecurityException) {
      ""
    }
  }
}

// Optional: inject before React boots
// webView.evaluateJavascript("window.__DEVICE_IMEI__='${bridge.getImei()}';", null)
