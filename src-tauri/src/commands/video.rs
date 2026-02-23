use std::path::{Path, PathBuf};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tokio::fs;

use crate::utils::ffmpeg::execute_ffprobe_command;

const VIDEO_EXTENSIONS: &[&str] = &["mp4", "avi", "mkv", "mov", "wmv"];
const COST_RATE_PER_MINUTE_USD: f64 = 0.006;
const COST_WARNING_THRESHOLD_USD: f64 = 5.0;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoFileInfo {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChunkInfo {
    pub chunk_number: u32,
    pub start_time_seconds: f64,
    pub end_time_seconds: f64,
    pub duration_seconds: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoInfo {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub duration_seconds: f64,
    pub format_name: String,
    pub codec_name: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CostEstimate {
    pub rate_per_minute_usd: f64,
    pub duration_minutes: f64,
    pub total_cost_usd: f64,
    pub formatted_cost: String,
    pub warning_threshold_usd: f64,
    pub exceeds_warning_threshold: bool,
}

#[derive(Debug, Deserialize)]
struct FFprobeOutput {
    format: Option<FFprobeFormat>,
    streams: Option<Vec<FFprobeStream>>,
}

#[derive(Debug, Deserialize)]
struct FFprobeFormat {
    duration: Option<String>,
    format_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FFprobeStream {
    codec_type: Option<String>,
    codec_name: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
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

fn parse_duration(duration: Option<String>) -> Result<f64, String> {
    let duration = duration.ok_or_else(|| "Video duration was not found in ffprobe output.".to_string())?;
    let parsed = duration
        .parse::<f64>()
        .map_err(|_| format!("Invalid video duration returned by ffprobe: {duration}"))?;

    if !parsed.is_finite() || parsed <= 0.0 {
        return Err("Video duration is invalid or zero.".to_string());
    }

    Ok(parsed)
}

pub fn calculate_chunks_for_duration(
    duration_seconds: f64,
    chunk_duration_minutes: u32,
) -> Result<Vec<ChunkInfo>, String> {
    if !duration_seconds.is_finite() || duration_seconds <= 0.0 {
        return Err("Duration must be a positive number of seconds.".to_string());
    }

    if !(5..=60).contains(&chunk_duration_minutes) {
        return Err("Chunk duration must be between 5 and 60 minutes.".to_string());
    }

    let chunk_duration_seconds = chunk_duration_minutes as f64 * 60.0;
    let mut chunks: Vec<ChunkInfo> = Vec::new();
    let mut chunk_number: u32 = 1;
    let mut start = 0.0;

    while start < duration_seconds {
        let remaining = duration_seconds - start;
        let chunk_duration = remaining.min(chunk_duration_seconds);
        let end = (start + chunk_duration).min(duration_seconds);

        chunks.push(ChunkInfo {
            chunk_number,
            start_time_seconds: start,
            end_time_seconds: end,
            duration_seconds: chunk_duration,
        });

        chunk_number += 1;
        start = end;
    }

    Ok(chunks)
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
pub async fn get_video_info(path: String, app: AppHandle) -> Result<VideoInfo, String> {
    let path = PathBuf::from(path);
    validate_video_path(&path)?;

    let metadata = fs::metadata(&path)
        .await
        .map_err(|error| format!("Failed to read video metadata: {error}"))?;

    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| "Unable to determine video file name.".to_string())?
        .to_string();

    let input_path = path_to_string(&path);

    let output = execute_ffprobe_command(
        &app,
        &[
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            &input_path,
        ],
        Duration::from_secs(30),
    )
    .await
    .map_err(|error| format!("Failed to probe video file: {error}"))?;

    let parsed: FFprobeOutput = serde_json::from_str(&output.stdout)
        .map_err(|error| format!("Failed to parse ffprobe output: {error}"))?;

    let duration_seconds = parse_duration(parsed.format.as_ref().and_then(|f| f.duration.clone()))?;
    let format_name = parsed
        .format
        .as_ref()
        .and_then(|f| f.format_name.clone())
        .unwrap_or_else(|| "unknown".to_string());

    let mut codec_name = "unknown".to_string();
    let mut width = None;
    let mut height = None;

    if let Some(streams) = parsed.streams {
        if let Some(video_stream) = streams
            .into_iter()
            .find(|stream| stream.codec_type.as_deref() == Some("video"))
        {
            codec_name = video_stream
                .codec_name
                .unwrap_or_else(|| "unknown".to_string());
            width = video_stream.width;
            height = video_stream.height;
        }
    }

    Ok(VideoInfo {
        path: input_path,
        file_name,
        size_bytes: metadata.len(),
        duration_seconds,
        format_name,
        codec_name,
        width,
        height,
    })
}

#[tauri::command]
pub fn calculate_chunks(duration_seconds: f64, chunk_duration_minutes: u32) -> Result<Vec<ChunkInfo>, String> {
    calculate_chunks_for_duration(duration_seconds, chunk_duration_minutes)
}

#[tauri::command]
pub fn estimate_cost(duration_seconds: f64) -> Result<CostEstimate, String> {
    if !duration_seconds.is_finite() || duration_seconds <= 0.0 {
        return Err("Duration must be a positive number of seconds.".to_string());
    }

    let duration_minutes = duration_seconds / 60.0;
    let total_cost_usd = duration_minutes * COST_RATE_PER_MINUTE_USD;
    let exceeds_warning_threshold = total_cost_usd >= COST_WARNING_THRESHOLD_USD;

    Ok(CostEstimate {
        rate_per_minute_usd: COST_RATE_PER_MINUTE_USD,
        duration_minutes,
        total_cost_usd,
        formatted_cost: format!("${total_cost_usd:.2} USD"),
        warning_threshold_usd: COST_WARNING_THRESHOLD_USD,
        exceeds_warning_threshold,
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

#[cfg(test)]
mod tests {
    use super::calculate_chunks_for_duration;

    #[test]
    fn returns_single_chunk_when_video_shorter_than_chunk_duration() {
        let chunks = calculate_chunks_for_duration(125.0, 20).expect("chunk calculation should succeed");
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].chunk_number, 1);
        assert!((chunks[0].duration_seconds - 125.0).abs() < 0.001);
        assert!((chunks[0].start_time_seconds - 0.0).abs() < 0.001);
        assert!((chunks[0].end_time_seconds - 125.0).abs() < 0.001);
    }

    #[test]
    fn returns_exact_chunks_when_duration_is_divisible() {
        let chunks = calculate_chunks_for_duration(1200.0, 10).expect("chunk calculation should succeed");
        assert_eq!(chunks.len(), 2);
        assert!((chunks[0].duration_seconds - 600.0).abs() < 0.001);
        assert!((chunks[1].duration_seconds - 600.0).abs() < 0.001);
        assert!((chunks[1].start_time_seconds - 600.0).abs() < 0.001);
    }

    #[test]
    fn makes_last_chunk_shorter_when_needed() {
        let chunks = calculate_chunks_for_duration(1500.0, 10).expect("chunk calculation should succeed");
        assert_eq!(chunks.len(), 3);
        assert!((chunks[2].duration_seconds - 300.0).abs() < 0.001);
        assert!((chunks[2].start_time_seconds - 1200.0).abs() < 0.001);
        assert!((chunks[2].end_time_seconds - 1500.0).abs() < 0.001);
    }
}
