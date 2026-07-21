package com.montai.app

import android.os.Build
import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(com.capacitorjs.plugins.camera.CameraPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.clipboard.ClipboardPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.filesystem.FilesystemPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.haptics.HapticsPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.share.SharePlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.statusbar.StatusBarPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.splashscreen.SplashScreenPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.keyboard.KeyboardPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.browser.BrowserPlugin::class.java)

        super.onCreate(savedInstanceState)

        // Edge-to-edge: modern API (API 30+), no deprecated systemUiVisibility
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsControllerCompat(window, window.decorView).also { ctrl ->
                ctrl.isAppearanceLightStatusBars = false
                ctrl.isAppearanceLightNavigationBars = false
            }
        }
    }
}
