use std::path::PathBuf;

use anyhow::{Context, Result};
use tauri::{AppHandle, Manager};
use tokio::fs;

use crate::models::settings::AppSettings;

const SETTINGS_FILE_NAME: &str = "settings.json";

fn settings_file_path(app: &AppHandle) -> Result<PathBuf> {
    let mut dir = app
        .path()
        .app_config_dir()
        .context("failed to resolve app config directory")?;

    dir.push(SETTINGS_FILE_NAME);
    Ok(dir)
}

fn apply_default_languages(settings: &mut AppSettings) {
    if settings.preferred_languages.is_empty() {
        settings.preferred_languages = crate::models::language::supported_languages()
            .into_iter()
            .map(|language| language.code.to_string())
            .collect();
    }
}

fn apply_dev_api_key(settings: &mut AppSettings) {
    #[cfg(debug_assertions)]
    {
        if let Ok(dev_api_key) = std::env::var("OPENAI_API_KEY") {
            if !dev_api_key.trim().is_empty() {
                settings.api_key = dev_api_key;
            }
        }
    }
}

async fn read_settings_from_disk(app: &AppHandle) -> Result<AppSettings> {
    let file_path = settings_file_path(app)?;

    if fs::try_exists(&file_path).await.unwrap_or(false) {
        let content = fs::read_to_string(&file_path)
            .await
            .with_context(|| format!("failed to read settings at {}", file_path.display()))?;
        let mut parsed: AppSettings = serde_json::from_str(&content)
            .with_context(|| format!("failed to parse settings at {}", file_path.display()))?;
        apply_default_languages(&mut parsed);

        return Ok(parsed);
    }

    let mut defaults = AppSettings::default();
    apply_default_languages(&mut defaults);
    Ok(defaults)
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let mut settings = read_settings_from_disk(&app)
        .await
        .map_err(|error| error.to_string())?;

    apply_dev_api_key(&mut settings);
    Ok(settings)
}

#[tauri::command]
pub async fn save_settings(
    app: AppHandle,
    mut settings: AppSettings,
) -> Result<AppSettings, String> {
    settings.validate().map_err(|error| error.to_string())?;
    apply_default_languages(&mut settings);

    let file_path = settings_file_path(&app).map_err(|error| error.to_string())?;

    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|error| format!("failed to create settings directory: {error}"))?;
    }

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|error| format!("failed to serialize settings: {error}"))?;

    fs::write(&file_path, content)
        .await
        .map_err(|error| format!("failed to write settings file: {error}"))?;

    let mut response = settings;
    apply_dev_api_key(&mut response);

    Ok(response)
}
