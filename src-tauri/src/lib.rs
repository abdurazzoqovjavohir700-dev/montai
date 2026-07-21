use tauri::Manager;

const APP_URL: &str = "https://montai-plum.vercel.app";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // Explicitly navigate to the live Montai web app
            if let Ok(url) = APP_URL.parse::<url::Url>() {
                let _ = window.navigate(url);
            }

            #[cfg(debug_assertions)]
            window.open_devtools();

            Ok(())
        })
        .on_window_event(|window, event| {
            // Close the app properly (not hide)
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.close().unwrap_or_default();
            }
        })
        .invoke_handler(tauri::generate_handler![get_platform])
        .run(tauri::generate_context!())
        .expect("error while running Montai");
}

#[tauri::command]
fn get_platform() -> &'static str {
    "windows"
}
