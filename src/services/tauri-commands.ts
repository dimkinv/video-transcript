import { invoke } from "@tauri-apps/api/core";
import type { Language } from "../types/languages";
import type { AppSettings } from "../types/settings";

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  return invoke<AppSettings>("save_settings", { settings });
}

export async function getSupportedLanguages(): Promise<Language[]> {
  return invoke<Language[]>("get_supported_languages");
}
