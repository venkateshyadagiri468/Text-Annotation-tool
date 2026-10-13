import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

interface ProgressBarProps {
  totalDocs: number;
  completedDocs: number;
  secondsSpent: number;
  status: "pending" | "done";
  onToggleStatus: () => void;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalDocs,
  completedDocs,
  secondsSpent,
  status,
  onToggleStatus,
}) => {
  const percentage = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-stats">
        <div className="progress-info">
          <span className="progress-label">Progress</span>
          <span className="progress-count">
            <strong>{completedDocs}</strong> of {totalDocs} completed ({percentage}%)
          </span>
        </div>

        <div className="progress-actions">
          <div className="timer-badge" title="Time spent on this document">
            <Clock size={14} className="timer-icon" />
            <span className="timer-value">{formatTime(secondsSpent)}</span>
          </div>

          <button
            type="button"
            className={`status-toggle-btn ${status === "done" ? "done" : "pending"}`}
            onClick={onToggleStatus}
            aria-label={status === "done" ? "Mark document as pending" : "Mark document as done"}
          >
            <CheckCircle2 size={16} />
            <span>{status === "done" ? "Completed" : "Mark Done"}</span>
          </button>
        </div>
      </div>

      <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
