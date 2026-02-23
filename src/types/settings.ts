import { WHISPER_LANGUAGES, type LanguageCode } from "./languages";

export interface AppSettings {
  apiKey: string;
  defaultOutputFolder: string | null;
  preferredLanguages: LanguageCode[];
  chunkDurationMinutes: number;
  maxRetries: number;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  defaultOutputFolder: null,
  preferredLanguages: WHISPER_LANGUAGES.map((language) => language.code),
  chunkDurationMinutes: 20,
  maxRetries: 3,
  sourceLanguage: "en",
  targetLanguage: null,
};
