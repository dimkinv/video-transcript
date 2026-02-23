import { useState } from "react";
import { selectOutputFolder } from "../services/tauri-commands";

interface OutputLocationPickerProps {
  outputFolder: string | null;
  fallbackLabel: string;
  onChange: (folder: string | null) => void;
}

export function OutputLocationPicker({ outputFolder, fallbackLabel, onChange }: OutputLocationPickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const handleChangeFolder = async () => {
    setError(null);
    setIsPicking(true);
    try {
      const selected = await selectOutputFolder();
      if (selected) {
        onChange(selected);
      }
    } catch (pickError) {
      const message =
        pickError instanceof Error ? pickError.message : "Failed to select output folder.";
      setError(message);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <section className="card">
      <div className="section-header">
        <h2>3. Output Location</h2>
      </div>
      <p className="output-path">{outputFolder ?? fallbackLabel}</p>
      <div className="row-inline">
        <button type="button" className="secondary-btn" onClick={() => void handleChangeFolder()} disabled={isPicking}>
          {isPicking ? "Opening..." : "Change"}
        </button>
        <button type="button" className="secondary-btn" onClick={() => onChange(null)}>
          Reset to Default
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
