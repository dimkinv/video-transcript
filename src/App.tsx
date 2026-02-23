import { useEffect, useState } from "react";
import { SettingsModal } from "./components/SettingsModal";
import { getSettings } from "./services/tauri-commands";
import type { AppSettings } from "./types/settings";
import "./App.css";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    void load();
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="kicker">Video Transcription</p>
          <h1>Setup & Configuration</h1>
        </div>
        <button type="button" className="primary-btn" onClick={() => setIsSettingsOpen(true)}>
          Open Settings
        </button>
      </header>

      <section className="card">
        <h2>Phase 1 Status</h2>
        <p>
          Settings persistence, language definitions, and development environment support are wired.
          Continue with file selection in Phase 2.
        </p>
        {settings && (
          <dl className="summary-grid">
            <div>
              <dt>Chunk Duration</dt>
              <dd>{settings.chunkDurationMinutes} min</dd>
            </div>
            <div>
              <dt>Max Retries</dt>
              <dd>{settings.maxRetries}</dd>
            </div>
            <div>
              <dt>Source Language</dt>
              <dd>{settings.sourceLanguage}</dd>
            </div>
            <div>
              <dt>Output Folder</dt>
              <dd>{settings.defaultOutputFolder ?? "Same as input video"}</dd>
            </div>
          </dl>
        )}
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(nextSettings) => setSettings(nextSettings)}
      />
    </main>
  );
}

export default App;
