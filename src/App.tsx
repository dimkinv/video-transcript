import { useEffect, useState } from "react";
import { FileSelector } from "./components/FileSelector";
import { LanguageSelector } from "./components/LanguageSelector";
import { OutputLocationPicker } from "./components/OutputLocationPicker";
import { SettingsModal } from "./components/SettingsModal";
import { getSettings, getSupportedLanguages } from "./services/tauri-commands";
import { WHISPER_LANGUAGES, type Language } from "./types/languages";
import type { AppSettings } from "./types/settings";
import type { VideoFileInfo } from "./types/video";
import "./App.css";

function parentFolder(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex <= 0) return null;
  return path.slice(0, slashIndex);
}

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [allLanguages, setAllLanguages] = useState<Language[]>(WHISPER_LANGUAGES);
  const [selectedVideo, setSelectedVideo] = useState<VideoFileInfo | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [outputFolderOverride, setOutputFolderOverride] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedSettings, supportedLanguages] = await Promise.all([
          getSettings(),
          getSupportedLanguages(),
        ]);
        setSettings(loadedSettings);
        setAllLanguages(supportedLanguages.length > 0 ? supportedLanguages : WHISPER_LANGUAGES);
        setSourceLanguage(loadedSettings.sourceLanguage);
        setTargetLanguage(loadedSettings.targetLanguage);
        setOutputFolderOverride(loadedSettings.defaultOutputFolder);
      } catch (error) {
        console.error("Failed to load settings", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load app settings.");
      }
    };

    void load();
  }, []);

  const availableLanguages = (() => {
    const list = allLanguages.length > 0 ? allLanguages : WHISPER_LANGUAGES;
    if (!settings || settings.preferredLanguages.length === 0) {
      return list;
    }
    const preferred = new Set(settings.preferredLanguages);
    return list.filter((language) => preferred.has(language.code));
  })();

  const defaultOutputFolder = selectedVideo ? parentFolder(selectedVideo.path) : null;
  const effectiveOutputFolder = outputFolderOverride ?? defaultOutputFolder;
  const canProcess = Boolean(selectedVideo);
  const isProcessing = false;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="kicker">Video Transcription</p>
          <h1>Main Workflow</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => setIsSettingsOpen(true)}>
          Settings
        </button>
      </header>

      {loadError && <p className="error-text">{loadError}</p>}

      <FileSelector selectedFile={selectedVideo} onFileChange={setSelectedVideo} />

      <section className="card">
        <div className="section-header">
          <h2>2. Languages</h2>
        </div>
        <div className="language-grid">
          <LanguageSelector
            label="Source Language"
            languages={availableLanguages}
            selected={sourceLanguage}
            onChange={(value) => value && setSourceLanguage(value)}
          />
          <LanguageSelector
            label="Target Language (optional)"
            languages={availableLanguages}
            selected={targetLanguage}
            onChange={setTargetLanguage}
            includeNoneOption
            noneLabel="No translation"
          />
        </div>
      </section>

      <OutputLocationPicker
        outputFolder={effectiveOutputFolder}
        fallbackLabel="Same folder as selected video"
        onChange={setOutputFolderOverride}
      />

      <section className="card">
        <div className="section-header">
          <h2>4. Cost Estimate</h2>
        </div>
        <p className="info-text">Cost estimation will appear here after Phase 3 video analysis is implemented.</p>
      </section>

      <section className="card">
        <div className="section-header">
          <h2>5. Process</h2>
        </div>
        <button type="button" className="primary-btn process-btn" disabled={!canProcess}>
          Process Video
        </button>
        {!canProcess && (
          <p className="info-text">Select a valid video file to enable processing.</p>
        )}
      </section>

      {isProcessing && (
        <section className="card">
          <div className="section-header">
            <h2>Progress</h2>
          </div>
          <p className="info-text">Processing progress will be displayed here.</p>
        </section>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(nextSettings) => {
          setSettings(nextSettings);
          setSourceLanguage(nextSettings.sourceLanguage);
          setTargetLanguage(nextSettings.targetLanguage);
          setOutputFolderOverride(nextSettings.defaultOutputFolder);
        }}
      />
    </main>
  );
}

export default App;
