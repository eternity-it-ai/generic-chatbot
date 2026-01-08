use tauri::async_runtime::Mutex;
use tauri::{State};

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
  use tauri::Manager;

  let dir = app
    .path()
    .config_dir()
    .map_err(|e| e.to_string())?;

  let path = dir.join("eternity-ai").join("branding.json");

  if !path.exists() {
    let parent = path.parent().ok_or("Invalid path")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;

    let default_json = serde_json::json!({
      "companyName": "Champion Motors",
      "companyDomain": "https://www.championmotors.co.il/"
    });
    let text = serde_json::to_string_pretty(&default_json).map_err(|e| e.to_string())?;
    fs::write(&path, &text).map_err(|e| e.to_string())?;

    return Ok(Some(default_json));
  }

  let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
  let json: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
  Ok(Some(json))
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
    .invoke_handler(tauri::generate_handler![backend_call, get_branding])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
