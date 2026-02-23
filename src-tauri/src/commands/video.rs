use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tokio::fs;

const VIDEO_EXTENSIONS: &[&str] = &["mp4", "avi", "mkv", "mov", "wmv"];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoFileInfo {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
}

fn path_to_string(path: &Path) -> String {
    let as_string = path.to_string_lossy().to_string();
    #[cfg(target_os = "windows")]
    {
        return as_string.replace('/', "\\");
    }
    #[cfg(not(target_os = "windows"))]
    {
        as_string
    }
}

fn has_supported_video_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            VIDEO_EXTENSIONS
                .iter()
                .any(|supported| ext.eq_ignore_ascii_case(supported))
        })
        .unwrap_or(false)
}

fn validate_video_path(path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("Selected file does not exist: {}", path.display()));
    }

    if !path.is_file() {
        return Err(format!("Selected path is not a file: {}", path.display()));
    }

    if !has_supported_video_extension(path) {
        return Err(
            "Unsupported video format. Please choose one of: .mp4, .avi, .mkv, .mov, .wmv"
                .to_string(),
        );
    }

    Ok(())
}

#[tauri::command]
pub fn select_video_file(app: AppHandle) -> Result<Option<String>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Select video file")
        .add_filter("Video files", VIDEO_EXTENSIONS)
        .blocking_pick_file();

    let Some(selected) = selected else {
        return Ok(None);
    };

    let path = selected
        .into_path()
        .map_err(|error| format!("Failed to resolve selected file path: {error}"))?;

    validate_video_path(&path)?;
    Ok(Some(path_to_string(&path)))
}

#[tauri::command]
pub async fn validate_video_file(path: String) -> Result<VideoFileInfo, String> {
    let path = PathBuf::from(path);
    validate_video_path(&path)?;

    let metadata = fs::metadata(&path)
        .await
        .map_err(|error| format!("Failed to read video file metadata: {error}"))?;

    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Unable to determine video file name.".to_string())?
        .to_string();

    Ok(VideoFileInfo {
        path: path_to_string(&path),
        file_name,
        size_bytes: metadata.len(),
    })
}

#[tauri::command]
pub fn select_output_folder(app: AppHandle) -> Result<Option<String>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Select output folder")
        .blocking_pick_folder();

    let Some(selected) = selected else {
        return Ok(None);
    };

    let path = selected
        .into_path()
        .map_err(|error| format!("Failed to resolve selected folder path: {error}"))?;

    if !path.exists() {
        return Err(format!(
            "Selected output folder does not exist: {}",
            path.display()
        ));
    }

    if !path.is_dir() {
        return Err(format!(
            "Selected output location is not a folder: {}",
            path.display()
        ));
    }

    Ok(Some(path_to_string(&path)))
}
