import { useState, type DragEvent } from "react";
import { selectVideoFile, validateVideoFile } from "../services/tauri-commands";
import type { VideoFileInfo } from "../types/video";

interface FileSelectorProps {
  selectedFile: VideoFileInfo | null;
  onFileChange: (file: VideoFileInfo | null) => void;
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

export function FileSelector({ selectedFile, onFileChange }: FileSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectAndValidatePath = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const validated = await validateVideoFile(path);
      onFileChange(validated);
    } catch (selectionError) {
      onFileChange(null);
      const message =
        selectionError instanceof Error
          ? selectionError.message
          : "Failed to validate selected video file.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const selectedPath = await selectVideoFile();
      if (!selectedPath) {
        return;
      }
      await selectAndValidatePath(selectedPath);
    } catch (selectionError) {
      const message =
        selectionError instanceof Error ? selectionError.message : "Failed to select video file.";
      setError(message);
      onFileChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files.item(0);
    const droppedPath = file ? (file as File & { path?: string }).path : undefined;

    if (!droppedPath) {
      setError("Drag-drop is supported only for local file drops with accessible file paths.");
      return;
    }

    await selectAndValidatePath(droppedPath);
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2>1. Select Video</h2>
      </div>
      <div
        className={selectedFile ? "dropzone dropzone-active" : "dropzone"}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void handleDrop(event)}
      >
        <p className="dropzone-text">Drop a video file here or use the picker.</p>
        <button type="button" className="primary-btn" onClick={() => void handleSelectClick()} disabled={isLoading}>
          {isLoading ? "Selecting..." : "Select Video File"}
        </button>
      </div>

      {selectedFile && (
        <div className="file-summary">
          <p>
            <strong>Path:</strong> {selectedFile.path}
          </p>
          <p>
            <strong>Name:</strong> {selectedFile.fileName}
          </p>
          <p>
            <strong>Size:</strong> {formatBytes(selectedFile.sizeBytes)}
          </p>
          <button type="button" className="secondary-btn" onClick={() => onFileChange(null)}>
            Clear file
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
