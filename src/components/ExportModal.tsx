import React, { useState } from "react";
import { Download, Copy, Check, FileJson, FileSpreadsheet, X } from "lucide-react";
import type { Doc, Label } from "../types";
import { exportToJson, exportToCsv, triggerFileDownload } from "../utils/export";

interface ExportModalProps {
  docs: Doc[];
  labels: Label[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  docs,
  labels,
  isOpen,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<"json" | "csv" | null>(null);

  if (!isOpen) return null;

  const jsonString = exportToJson(docs, labels);
  const csvString = exportToCsv(docs, labels);

  const totalAnnotations = docs.reduce((acc, d) => acc + d.annotations.length, 0);

  function handleDownloadJson() {
    const filename = `annotations-export-${new Date().toISOString().slice(0, 10)}.json`;
    triggerFileDownload(jsonString, filename, "application/json");
  }

  function handleDownloadCsv() {
    const filename = `annotations-export-${new Date().toISOString().slice(0, 10)}.csv`;
    triggerFileDownload(csvString, filename, "text/csv;charset=utf-8;");
  }

  async function handleCopy(type: "json" | "csv") {
    const text = type === "json" ? jsonString : csvString;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Download size={20} className="modal-icon" />
            <h2 id="export-modal-title">Export Annotations</h2>
          </div>
          <button
            type="button"
            className="btn-icon-sm"
            onClick={onClose}
            aria-label="Close export dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Exporting <strong>{docs.length}</strong> documents containing <strong>{totalAnnotations}</strong> total annotated spans.
          </p>

          <div className="export-options-grid">
            <div className="export-option-card">
              <div className="option-header">
                <FileJson size={24} className="option-icon text-indigo" />
                <div>
                  <h4>JSON Format</h4>
                  <p className="option-desc">Complete document structure with entity text & label metadata</p>
                </div>
              </div>
              <div className="option-actions">
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={handleDownloadJson}
                >
                  <Download size={14} /> Download JSON
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => handleCopy("json")}
                >
                  {copiedType === "json" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedType === "json" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="export-option-card">
              <div className="option-header">
                <FileSpreadsheet size={24} className="option-icon text-emerald" />
                <div>
                  <h4>CSV Format</h4>
                  <p className="option-desc">Tabular dataset (doc_id, start, end, text, label) for model training</p>
                </div>
              </div>
              <div className="option-actions">
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={handleDownloadCsv}
                >
                  <Download size={14} /> Download CSV
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => handleCopy("csv")}
                >
                  {copiedType === "csv" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedType === "csv" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="export-preview-box">
            <span className="preview-label">JSON Output Preview:</span>
            <pre className="preview-code">{jsonString.slice(0, 420)}...</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
