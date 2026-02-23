mod commands;
mod models;

#[cfg(target_os = "windows")]
use std::process::Command;

fn load_env() {
    #[cfg(debug_assertions)]
    {
        if dotenv::dotenv().is_ok() {
            println!("Loaded environment variables from .env");
        }
    }
}

fn log_ffmpeg_version() {
    #[cfg(target_os = "windows")]
    {
        let exe = "src-tauri/binaries/ffmpeg-x86_64-pc-windows-msvc.exe";
        let output = Command::new(exe).arg("-version").output();

        match output {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some(first_line) = stdout.lines().next() {
                    println!("FFmpeg detected: {first_line}");
                }
            }
            Ok(output) => {
                let stderr = String::from_utf8_lossy(&output.stderr);
                println!("FFmpeg check failed (status {}): {}", output.status, stderr);
            }
            Err(error) => {
                println!("FFmpeg binary not available at startup: {error}");
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    load_env();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_| {
            log_ffmpeg_version();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::language::get_supported_languages,
            commands::video::select_video_file,
            commands::video::validate_video_file,
            commands::video::select_output_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
