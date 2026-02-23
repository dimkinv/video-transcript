import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getSettings, getSupportedLanguages, saveSettings } from "../services/tauri-commands";
import { WHISPER_LANGUAGES, type Language } from "../types/languages";
import { DEFAULT_SETTINGS, type AppSettings } from "../types/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
}

interface FormErrors {
  chunkDurationMinutes?: string;
  maxRetries?: string;
  sourceLanguage?: string;
}

export function SettingsModal({ isOpen, onClose, onSaved }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [allLanguages, setAllLanguages] = useState<Language[]>(WHISPER_LANGUAGES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiKeyTestMessage, setApiKeyTestMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [loadedSettings, backendLanguages] = await Promise.all([
          getSettings(),
          getSupportedLanguages(),
        ]);

        if (cancelled) return;

        setSettings({
          ...loadedSettings,
          preferredLanguages:
            loadedSettings.preferredLanguages.length > 0
              ? loadedSettings.preferredLanguages
              : backendLanguages.map((lang) => lang.code),
        });
        setAllLanguages(backendLanguages.length > 0 ? backendLanguages : WHISPER_LANGUAGES);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load settings", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      setErrors({});
      setApiKeyTestMessage(null);
    };
  }, [isOpen]);

  const availableLanguages = useMemo(() => {
    if (settings.preferredLanguages.length === 0) {
      return allLanguages;
    }

    const allowed = new Set(settings.preferredLanguages);
    return allLanguages.filter((language) => allowed.has(language.code));
  }, [allLanguages, settings.preferredLanguages]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (settings.chunkDurationMinutes < 5 || settings.chunkDurationMinutes > 60) {
      nextErrors.chunkDurationMinutes = "Chunk duration must be between 5 and 60.";
    }

    if (settings.maxRetries < 1 || settings.maxRetries > 10) {
      nextErrors.maxRetries = "Max retries must be between 1 and 10.";
    }

    if (!settings.sourceLanguage) {
      nextErrors.sourceLanguage = "Source language is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBrowseOutputFolder = async () => {
    const folder = await open({
      directory: true,
      multiple: false,
      title: "Select default output folder",
    });

    if (typeof folder === "string") {
      setSettings((current) => ({ ...current, defaultOutputFolder: folder }));
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const saved = await saveSettings(settings);
      onSaved(saved);
      onClose();
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreferredLanguage = (languageCode: string) => {
    setSettings((current) => {
      const exists = current.preferredLanguages.includes(languageCode);
      const preferredLanguages = exists
        ? current.preferredLanguages.filter((code) => code !== languageCode)
        : [...current.preferredLanguages, languageCode];

      return {
        ...current,
        preferredLanguages,
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <section className="settings-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </header>

        {isLoading ? (
          <p>Loading settings...</p>
        ) : (
          <div className="settings-grid">
            <label>
              API Key
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.currentTarget.value }))}
                placeholder="sk-..."
              />
            </label>

            <div>
              <label>Default output folder</label>
              <div className="row-inline">
                <input
                  type="text"
                  value={settings.defaultOutputFolder ?? "Same as video file"}
                  readOnly
                />
                <button type="button" className="secondary-btn" onClick={() => void handleBrowseOutputFolder()}>
                  Browse
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSettings((s) => ({ ...s, defaultOutputFolder: null }))}
                >
                  Clear
                </button>
              </div>
            </div>

            <label>
              Chunk duration (minutes)
              <input
                type="number"
                min={5}
                max={60}
                value={settings.chunkDurationMinutes}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, chunkDurationMinutes: Number(e.currentTarget.value) }))
                }
              />
              {errors.chunkDurationMinutes && <span className="error-text">{errors.chunkDurationMinutes}</span>}
            </label>

            <label>
              Max retries
              <input
                type="number"
                min={1}
                max={10}
                value={settings.maxRetries}
                onChange={(e) => setSettings((s) => ({ ...s, maxRetries: Number(e.currentTarget.value) }))}
              />
              {errors.maxRetries && <span className="error-text">{errors.maxRetries}</span>}
            </label>

            <label>
              Source language
              <select
                value={settings.sourceLanguage}
                onChange={(e) => setSettings((s) => ({ ...s, sourceLanguage: e.currentTarget.value }))}
              >
                {availableLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
              {errors.sourceLanguage && <span className="error-text">{errors.sourceLanguage}</span>}
            </label>

            <label>
              Target language (optional)
              <select
                value={settings.targetLanguage ?? ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, targetLanguage: e.currentTarget.value || null }))
                }
              >
                <option value="">None</option>
                {availableLanguages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <label>Preferred languages</label>
              <div className="language-list" role="listbox" aria-label="Preferred languages">
                {allLanguages.map((language) => {
                  const selected = settings.preferredLanguages.includes(language.code);
                  return (
                    <button
                      type="button"
                      key={language.code}
                      className={selected ? "chip chip-selected" : "chip"}
                      onClick={() => togglePreferredLanguage(language.code)}
                    >
                      {language.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="row-inline">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setApiKeyTestMessage("API key test is planned for Phase 5.")}
              >
                Test API Key
              </button>
              {apiKeyTestMessage && <span className="info-text">{apiKeyTestMessage}</span>}
            </div>
          </div>
        )}

        <footer className="settings-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={() => void handleSave()} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </section>
    </div>
  );
}
