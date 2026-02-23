#![allow(dead_code)]

use std::fmt;
use std::path::PathBuf;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tokio::time;

#[derive(Debug, Clone)]
pub struct FFmpegCommandOutput {
    pub command: String,
    pub status_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Debug)]
pub enum FFmpegError {
    BinaryNotFound {
        binary: String,
        searched_paths: Vec<PathBuf>,
    },
    SpawnFailed {
        command: String,
        source: std::io::Error,
    },
    Failed {
        command: String,
        status_code: i32,
        stdout: String,
        stderr: String,
    },
    TimedOut {
        command: String,
        timeout: Duration,
    },
}

impl fmt::Display for FFmpegError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BinaryNotFound {
                binary,
                searched_paths,
            } => write!(
                f,
                "Unable to locate {} binary. Searched: {}",
                binary,
                searched_paths
                    .iter()
                    .map(|path| path.display().to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            Self::SpawnFailed { command, source } => {
                write!(f, "Failed to start command `{command}`: {source}")
            }
            Self::Failed {
                command,
                status_code,
                stderr,
                ..
            } => write!(
                f,
                "Command `{command}` failed with exit code {status_code}: {}",
                stderr.trim()
            ),
            Self::TimedOut { command, timeout } => write!(
                f,
                "Command `{command}` exceeded timeout of {}s",
                timeout.as_secs()
            ),
        }
    }
}

impl std::error::Error for FFmpegError {}

#[cfg(target_os = "windows")]
const FFMPEG_SIDECAR_NAME: &str = "ffmpeg-x86_64-pc-windows-msvc.exe";
#[cfg(target_os = "windows")]
const FFPROBE_SIDECAR_NAME: &str = "ffprobe-x86_64-pc-windows-msvc.exe";

#[cfg(target_os = "linux")]
const FFMPEG_SIDECAR_NAME: &str = "ffmpeg-x86_64-unknown-linux-gnu";
#[cfg(target_os = "linux")]
const FFPROBE_SIDECAR_NAME: &str = "ffprobe-x86_64-unknown-linux-gnu";

#[cfg(target_os = "macos")]
const FFMPEG_SIDECAR_NAME: &str = "ffmpeg-aarch64-apple-darwin";
#[cfg(target_os = "macos")]
const FFPROBE_SIDECAR_NAME: &str = "ffprobe-aarch64-apple-darwin";

fn find_sidecar(app: &AppHandle, binary_name: &str) -> Result<PathBuf, FFmpegError> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.push(exe_dir.join(binary_name));

            if let Some(parent) = exe_dir.parent() {
                candidates.push(parent.join(binary_name));
                candidates.push(parent.join("Resources").join(binary_name));
            }
        }
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join(binary_name));
    }

    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("src-tauri").join("binaries").join(binary_name));
        candidates.push(cwd.join("binaries").join(binary_name));
    }

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        let manifest_path = PathBuf::from(manifest_dir);
        candidates.push(manifest_path.join("binaries").join(binary_name));
    }

    if let Some(path) = candidates.iter().find(|path| path.exists()) {
        return Ok(path.to_path_buf());
    }

    Err(FFmpegError::BinaryNotFound {
        binary: binary_name.to_string(),
        searched_paths: candidates,
    })
}

pub fn get_ffmpeg_binary_path(app: &AppHandle) -> Result<PathBuf, FFmpegError> {
    find_sidecar(app, FFMPEG_SIDECAR_NAME)
}

pub fn get_ffprobe_binary_path(app: &AppHandle) -> Result<PathBuf, FFmpegError> {
    match find_sidecar(app, FFPROBE_SIDECAR_NAME) {
        Ok(path) => Ok(path),
        Err(_) => Ok(PathBuf::from("ffprobe")),
    }
}

pub async fn execute_ffmpeg_command(
    app: &AppHandle,
    args: &[&str],
    timeout: Duration,
) -> Result<FFmpegCommandOutput, FFmpegError> {
    let binary = get_ffmpeg_binary_path(app)?;
    execute_command(binary, args, timeout).await
}

pub async fn execute_ffprobe_command(
    app: &AppHandle,
    args: &[&str],
    timeout: Duration,
) -> Result<FFmpegCommandOutput, FFmpegError> {
    let binary = get_ffprobe_binary_path(app)?;
    execute_command(binary, args, timeout).await
}

async fn execute_command(
    binary: PathBuf,
    args: &[&str],
    timeout: Duration,
) -> Result<FFmpegCommandOutput, FFmpegError> {
    let command_display = format!("{} {}", binary.display(), args.join(" "));
    println!("[ffmpeg] executing: {command_display}");

    let result = time::timeout(timeout, tokio::process::Command::new(&binary).args(args).output()).await;

    let output = match result {
        Ok(wait_result) => wait_result.map_err(|source| FFmpegError::SpawnFailed {
            command: command_display.clone(),
            source,
        })?,
        Err(_) => return Err(FFmpegError::TimedOut {
            command: command_display,
            timeout,
        }),
    };

    let status_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        return Err(FFmpegError::Failed {
            command: command_display,
            status_code,
            stdout,
            stderr,
        });
    }

    Ok(FFmpegCommandOutput {
        command: command_display,
        status_code,
        stdout,
        stderr,
    })
}
