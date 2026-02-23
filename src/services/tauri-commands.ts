import { invoke } from "@tauri-apps/api/core";
import type { Language } from "../types/languages";
import type { AppSettings } from "../types/settings";
import type { VideoFileInfo } from "../types/video";

async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Tauri command "${command}" failed: ${message}`);
  }
}

/**
 * Loads persisted app settings.
 */
export async function getSettings(): Promise<AppSettings> {
  return invokeCommand<AppSettings>("get_settings");
}

/**
 * Persists app settings and returns the saved value.
 */
export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  return invokeCommand<AppSettings>("save_settings", { settings });
}

/**
 * Returns supported Whisper languages from the backend.
 */
export async function getSupportedLanguages(): Promise<Language[]> {
  return invokeCommand<Language[]>("get_supported_languages");
}

/**
 * Opens a native video file picker.
 */
export async function selectVideoFile(): Promise<string | null> {
  return invokeCommand<string | null>("select_video_file");
}

/**
 * Validates a video path and returns file metadata.
 */
export async function validateVideoFile(path: string): Promise<VideoFileInfo> {
  return invokeCommand<VideoFileInfo>("validate_video_file", { path });
}

/**
 * Opens a native output folder picker.
 */
export async function selectOutputFolder(): Promise<string | null> {
  return invokeCommand<string | null>("select_output_folder");
}
