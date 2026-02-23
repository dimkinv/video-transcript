import type { CostEstimate as CostEstimateModel } from "../types/processing";

interface CostEstimateProps {
  estimate: CostEstimateModel | null;
  isLoading: boolean;
  error: string | null;
}

export function CostEstimate({ estimate, isLoading, error }: CostEstimateProps) {
  if (isLoading) {
    return <p className="info-text">Analyzing video and calculating cost...</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!estimate) {
    return <p className="info-text">Select a video to calculate estimated transcription cost.</p>;
  }

  return (
    <div className="cost-estimate">
      <p className="cost-amount">{estimate.formattedCost}</p>
      <p className="info-text">
        {estimate.durationMinutes.toFixed(2)} minutes at ${estimate.ratePerMinuteUsd.toFixed(3)}/minute
      </p>
      {estimate.exceedsWarningThreshold && (
        <p className="warning-text">
          Estimated cost exceeds ${estimate.warningThresholdUsd.toFixed(2)}. Review before processing.
        </p>
      )}
    </div>
  );
}
