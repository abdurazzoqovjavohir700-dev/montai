use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Open devtools in debug builds
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            // Register deep link handler (montai://)
            let handle = app.handle().clone();
            app.listen("deep-link://new-url", move |event| {
                let _ = handle.emit("deep-link-received", event.payload());
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // Gracefully handle close requests
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = api;
                window.hide().unwrap_or_default();
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_platform,
            open_external,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Montai");
}

#[tauri::command]
fn get_platform() -> &'static str {
    "windows"
}

#[tauri::command]
async fn open_external(url: String) -> Result<(), String> {
    // Only allow https URLs to prevent command injection
    if !url.starts_with("https://") {
        return Err("Only HTTPS URLs allowed".to_string());
    }
    open::that(url).map_err(|e| e.to_string())
}
