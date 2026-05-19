package com.geolocate.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeviceImeiPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        attachImeiJavascriptInterface();
    }

    private void attachImeiJavascriptInterface() {
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;

        webView.addJavascriptInterface(
            new AndroidImeiBridge(() -> DeviceImeiPlugin.readImei(getApplicationContext())),
            "Android"
        );
    }
}
