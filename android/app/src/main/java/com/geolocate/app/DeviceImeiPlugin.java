package com.geolocate.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Build;
import android.telephony.TelephonyManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "DeviceImei",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_PHONE_STATE }, alias = DeviceImeiPlugin.PHONE_ALIAS)
    }
)
public class DeviceImeiPlugin extends Plugin {

    static final String PHONE_ALIAS = "phone";

    @PluginMethod
    public void getImei(PluginCall call) {
        if (getPermissionState(PHONE_ALIAS) != PermissionState.GRANTED) {
            requestPermissionForAlias(PHONE_ALIAS, call, "phonePermsCallback");
            return;
        }
        resolveImei(call);
    }

    @PermissionCallback
    private void phonePermsCallback(PluginCall call) {
        if (getPermissionState(PHONE_ALIAS) != PermissionState.GRANTED) {
            call.reject("Phone permission is required to read device IMEI.");
            return;
        }
        resolveImei(call);
    }

    @SuppressLint("HardwareIds")
    private void resolveImei(PluginCall call) {
        String imei = readImei(getContext());
        JSObject ret = new JSObject();
        ret.put("imei", imei != null ? imei : "");
        call.resolve(ret);
    }

    @SuppressLint("HardwareIds")
    static String readImei(Context context) {
        if (context == null) return "";
        TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
        if (tm == null) return "";
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                String value = tm.getImei();
                return value != null ? value : "";
            }
            @SuppressWarnings("deprecation")
            String legacy = tm.getDeviceId();
            return legacy != null ? legacy : "";
        } catch (SecurityException e) {
            return "";
        }
    }
}
