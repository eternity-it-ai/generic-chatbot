use base64::{engine::general_purpose, Engine as _};
use std::fs;
use std::io::Write;
use tauri::async_runtime::Mutex;
use tauri::{Manager, State};

use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

struct BackendState {
    inner: Mutex<Option<BackendProc>>,
}

struct BackendProc {
    child: CommandChild,
    rx: tauri::async_runtime::Receiver<CommandEvent>,
}

async fn ensure_backend(app: &tauri::AppHandle, state: &BackendState) -> Result<(), String> {
    let mut guard = state.inner.lock().await;

    // Already running
    if guard.is_some() {
        return Ok(());
    }

    // Spawn sidecar named "backend"
    let (rx, child) = app
        .shell()
        .sidecar("backend")
        .map_err(|e| e.to_string())?
        .spawn()
        .map_err(|e| e.to_string())?;

    *guard = Some(BackendProc { child, rx });
    Ok(())
}

#[tauri::command]
fn get_branding(app: tauri::AppHandle) -> Result<Option<serde_json::Value>, String> {
    use std::fs;

    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let path = dir.join("branding.json");

    if !path.exists() {
        return Ok(None);
    }

    let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(Some(json))
}

#[tauri::command]
fn save_branding(app: tauri::AppHandle, branding_json: String) -> Result<(), String> {
    use std::fs;

    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join("branding.json");
    fs::write(path, branding_json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn clear_branding(app: tauri::AppHandle) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("branding.json");
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }

    // Also clear logo if it exists
    let logo_path = dir.join("app_logo.png");
    if logo_path.exists() {
        fs::remove_file(logo_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn download_logo(app: tauri::AppHandle, url: String) -> Result<String, String> {
    println!("Downloading logo from: {}", url);
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("app_logo.png");

    let response = reqwest::blocking::get(url).map_err(|e| {
        println!("Failed to download logo: {}", e);
        e.to_string()
    })?;
    let bytes = response.bytes().map_err(|e| e.to_string())?;

    let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    println!("Logo downloaded to: {:?}", path);

    // Return as data URL for robustness
    let b64 = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", b64))
}

#[tauri::command]
fn get_logo_data_url(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("app_logo.png");
    if path.exists() {
        let bytes = fs::read(path).map_err(|e| e.to_string())?;
        let b64 = general_purpose::STANDARD.encode(&bytes);
        Ok(Some(format!("data:image/png;base64,{}", b64)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
fn get_logo_path(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join("app_logo.png");
    if path.exists() {
        println!("Found local logo at: {:?}", path);
        Ok(Some(path.to_string_lossy().replace("\\", "/")))
    } else {
        println!("Local logo not found at: {:?}", path);
        Ok(None)
    }
}

#[tauri::command]
async fn backend_call(
    app: tauri::AppHandle,
    state: State<'_, BackendState>,
    msg_json: String,
) -> Result<String, String> {
    // Start backend if needed
    ensure_backend(&app, &state).await?;

    // Lock for the full request/response so calls are serialized (simple + safe)
    let mut guard = state.inner.lock().await;
    let proc = guard.as_mut().ok_or("Backend not running")?;

    // Write request line
    proc.child
        .write(msg_json.as_bytes())
        .map_err(|e| e.to_string())?;
    proc.child.write(b"\n").map_err(|e| e.to_string())?;

    // Read one stdout line
    while let Some(event) = proc.rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8(bytes).map_err(|e| e.to_string())?;
                return Ok(line);
            }
            CommandEvent::Stderr(_bytes) => {
                // Optional: you can log stderr here if desired
            }
            CommandEvent::Terminated(_payload) => {
                // Backend died; clear state so next call respawns it
                *guard = None;
                return Err("Backend terminated unexpectedly".into());
            }
            _ => {}
        }
    }

    // If rx ended, backend is gone
    *guard = None;
    Err("No response from backend".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .manage(BackendState {
            inner: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            backend_call,
            get_branding,
            save_branding,
            clear_branding,
            download_logo,
            get_logo_path,
            get_platform,
            get_logo_data_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
