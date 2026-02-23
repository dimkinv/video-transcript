import { useEffect, useState } from "react";
import { CostEstimate } from "./components/CostEstimate";
import { FileSelector } from "./components/FileSelector";
import { LanguageSelector } from "./components/LanguageSelector";
import { OutputLocationPicker } from "./components/OutputLocationPicker";
import { SettingsModal } from "./components/SettingsModal";
import {
  calculateChunks,
  estimateCost,
  getSettings,
  getSupportedLanguages,
  getVideoInfo,
} from "./services/tauri-commands";
import { WHISPER_LANGUAGES, type Language } from "./types/languages";
import type { ChunkInfo, CostEstimate as CostEstimateModel, VideoInfo } from "./types/processing";
import type { AppSettings } from "./types/settings";
import type { VideoFileInfo } from "./types/video";
import "./App.css";

function parentFolder(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex <= 0) return null;
  return path.slice(0, slashIndex);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatDuration(totalSeconds: number): string {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
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

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [costEstimate, setCostEstimate] = useState<CostEstimateModel | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedVideo) {
      setVideoInfo(null);
      setChunks([]);
      setCostEstimate(null);
      setAnalysisError(null);
      setAnalysisLoading(false);
      return;
    }

    let cancelled = false;

    const analyzeVideo = async () => {
      setAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const info = await getVideoInfo(selectedVideo.path);
        const chunkDuration = settings?.chunkDurationMinutes ?? 20;
        const [chunkList, estimate] = await Promise.all([
          calculateChunks(info.durationSeconds, chunkDuration),
          estimateCost(info.durationSeconds),
        ]);

        if (cancelled) return;

        setVideoInfo(info);
        setChunks(chunkList);
        setCostEstimate(estimate);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to analyze the selected video.";
        setAnalysisError(message);
        setVideoInfo(null);
        setChunks([]);
        setCostEstimate(null);
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
        }
      }
    };

    void analyzeVideo();

    return () => {
      cancelled = true;
    };
  }, [selectedVideo, settings?.chunkDurationMinutes]);

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
  const canProcess = Boolean(selectedVideo && videoInfo && !analysisLoading && !analysisError);
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
          <h2>4. Video Analysis & Cost</h2>
        </div>

        {!selectedVideo && <p className="info-text">Select a video file to analyze metadata and estimate cost.</p>}

        {analysisLoading && selectedVideo && <p className="info-text">Probing video metadata...</p>}

        {analysisError && <p className="error-text">{analysisError}</p>}

        {videoInfo && (
          <dl className="summary-grid">
            <div>
              <dt>Duration</dt>
              <dd>{formatDuration(videoInfo.durationSeconds)}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(videoInfo.sizeBytes)}</dd>
            </div>
            <div>
              <dt>Chunks</dt>
              <dd>{chunks.length}</dd>
            </div>
            <div>
              <dt>Format / Codec</dt>
              <dd>
                {videoInfo.formatName} / {videoInfo.codecName}
              </dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd>
                {videoInfo.width && videoInfo.height
                  ? `${videoInfo.width}x${videoInfo.height}`
                  : "Unavailable"}
              </dd>
            </div>
          </dl>
        )}

        <CostEstimate estimate={costEstimate} isLoading={analysisLoading} error={analysisError} />
      </section>

      <section className="card">
        <div className="section-header">
          <h2>5. Process</h2>
        </div>
        <button type="button" className="primary-btn process-btn" disabled={!canProcess}>
          Process Video
        </button>
        {!canProcess && (
          <p className="info-text">Select and analyze a valid video file to enable processing.</p>
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
