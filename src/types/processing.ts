export interface VideoInfo {
  path: string;
  fileName: string;
  sizeBytes: number;
  durationSeconds: number;
  formatName: string;
  codecName: string;
  width: number | null;
  height: number | null;
}

export interface ChunkInfo {
  chunkNumber: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
}

export interface CostEstimate {
  ratePerMinuteUsd: number;
  durationMinutes: number;
  totalCostUsd: number;
  formattedCost: string;
  warningThresholdUsd: number;
  exceedsWarningThreshold: boolean;
}
