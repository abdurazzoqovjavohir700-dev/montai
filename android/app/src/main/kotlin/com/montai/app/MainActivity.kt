package com.montai.app

import android.os.Bundle
import android.view.View
import androidx.core.view.WindowCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Enable edge-to-edge display
        registerPlugin(com.capacitorjs.plugins.camera.CameraPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.clipboard.ClipboardPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.filesystem.FilesystemPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.haptics.HapticsPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.localnotifications.LocalNotificationsPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.share.SharePlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.statusbar.StatusBarPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.splashscreen.SplashScreenPlugin::class.java)
        registerPlugin(com.capacitorjs.plugins.keyboard.KeyboardPlugin::class.java)

        super.onCreate(savedInstanceState)

        // Edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
    }
}
