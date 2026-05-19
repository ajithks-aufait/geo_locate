package com.geolocate.app;

import android.webkit.JavascriptInterface;

/** Exposes window.Android.getImei() for legacy WebView bridge callers. */
public class AndroidImeiBridge {

    private final DeviceImeiPlugin.Host host;

    public interface Host {
        String getImei();
    }

    public AndroidImeiBridge(Host host) {
        this.host = host;
    }

    @JavascriptInterface
    public String getImei() {
        return host.getImei();
    }

    @JavascriptInterface
    public String getDeviceImei() {
        return getImei();
    }
}
