import React, { useState } from "react";
import { Scale, Upload, CheckCircle2, AlertTriangle, X, Play } from "lucide-react";
import { computeSpanAgreement, type AgreementReport } from "../utils/agreement";

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExportData: unknown;
}

export const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onClose,
  currentExportData,
}) => {
  const [fileAContent, setFileAContent] = useState<unknown | null>(null);
  const [fileBContent, setFileBContent] = useState<unknown | null>(null);
  const [fileAName, setFileAName] = useState<string>("");
  const [fileBName, setFileBName] = useState<string>("");
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, which: "A" | "B") {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (which === "A") {
          setFileAContent(parsed);
          setFileAName(file.name);
        } else {
          setFileBContent(parsed);
          setFileBName(file.name);
        }
      } catch {
        setError(`Failed to parse ${file.name}: invalid JSON`);
      }
    };
    reader.readAsText(file);
  }

  function handleLoadDemoData() {
    setError(null);
    // Use currentExportData as Annotator A
    const parsedA = currentExportData;
    // Create slightly perturbed version as Annotator B to demonstrate real IAA
    const rawB = JSON.parse(JSON.stringify(currentExportData));
    if (rawB.docs && rawB.docs.length > 0) {
      // Modify one label and drop one annotation to show meaningful agreement & disagreement
      if (rawB.docs[0].annotations && rawB.docs[0].annotations.length > 1) {
        rawB.docs[0].annotations[0].labelName = "ORG"; // perturbation
      }
      if (rawB.docs[1]?.annotations?.length > 1) {
        rawB.docs[1].annotations.pop(); // dropped span
      }
    }

    setFileAContent(parsedA);
    setFileAName("Annotator_Alice.json");
    setFileBContent(rawB);
    setFileBName("Annotator_Bob.json");

    try {
      const rep = computeSpanAgreement(parsedA, rawB);
      setReport(rep);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error computing agreement");
    }
  }

  function handleCalculate() {
    setError(null);
    if (!fileAContent || !fileBContent) {
      setError("Please provide both Annotator A and Annotator B files.");
      return;
    }

    try {
      const rep = computeSpanAgreement(fileAContent, fileBContent);
      setReport(rep);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error calculating agreement");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="agreement-title">
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Scale size={20} className="modal-icon text-indigo" />
            <h2 id="agreement-title">Inter-Annotator Agreement (IAA)</h2>
          </div>
          <button
            type="button"
            className="btn-icon-sm"
            onClick={onClose}
            aria-label="Close Agreement modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Upload two exported JSON files from independent annotators to measure span agreement and Cohen&rsquo;s Kappa (&kappa;).
          </p>

          <div className="agreement-upload-row">
            <div className="upload-box">
              <span className="upload-box-title">Annotator A</span>
              <label className="file-upload-label">
                <Upload size={16} />
                <span>{fileAName || "Choose File A (.json)"}</span>
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, "A")}
                />
              </label>
            </div>

            <div className="upload-box">
              <span className="upload-box-title">Annotator B</span>
              <label className="file-upload-label">
                <Upload size={16} />
                <span>{fileBName || "Choose File B (.json)"}</span>
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={(e) => handleFileUpload(e, "B")}
                />
              </label>
            </div>
          </div>

          <div className="agreement-action-bar">
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handleCalculate}
              disabled={!fileAContent || !fileBContent}
            >
              Calculate Agreement
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={handleLoadDemoData}
            >
              <Play size={13} /> Load Demo Comparison
            </button>
          </div>

          {error && (
            <div className="inline-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="agreement-results-section">
              <div className="metrics-summary-grid">
                <div className="metric-card">
                  <span className="metric-label">Percent Agreement</span>
                  <span className="metric-value text-indigo">{report.percentAgreement}%</span>
                  <span className="metric-sub">{report.exactMatches} of {report.totalUniqueSpans} spans matched</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Cohen&rsquo;s Kappa (&kappa;)</span>
                  <span className="metric-value text-emerald">{report.cohensKappa}</span>
                  <span className="metric-sub">{report.kappaInterpretation}</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">F1 / Dice Score</span>
                  <span className="metric-value text-amber">{report.f1Score}</span>
                  <span className="metric-sub">Harmonic mean of precision & recall</span>
                </div>
              </div>

              {report.labelStats.length > 0 && (
                <div className="agreement-table-container">
                  <h4>Per-Label Breakdown</h4>
                  <table className="agreement-table">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>A Spans</th>
                        <th>B Spans</th>
                        <th>Agreed</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.labelStats.map((stat) => (
                        <tr key={stat.label}>
                          <td className="font-semibold">{stat.label}</td>
                          <td>{stat.annotatorACount}</td>
                          <td>{stat.annotatorBCount}</td>
                          <td>{stat.agreedCount}</td>
                          <td>{(stat.precision * 100).toFixed(0)}%</td>
                          <td>{(stat.recall * 100).toFixed(0)}%</td>
                          <td className="font-semibold">{stat.f1.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="span-comparison-list">
                <h4>Span Breakdown</h4>
                <div className="span-comparison-scroll">
                  {report.items.map((item, idx) => (
                    <div
                      key={`${item.docId}-${item.start}-${item.end}-${idx}`}
                      className={`span-diff-item ${item.isMatch ? "match" : "mismatch"}`}
                    >
                      <div className="diff-header">
                        <span className="diff-doc">{item.docId} [{item.start}:{item.end}]</span>
                        {item.isMatch ? (
                          <span className="match-tag text-emerald">
                            <CheckCircle2 size={13} /> Matched
                          </span>
                        ) : (
                          <span className="match-tag text-danger">
                            <AlertTriangle size={13} /> Disagreement
                          </span>
                        )}
                      </div>
                      <div className="diff-text">&ldquo;{item.text}&rdquo;</div>
                      <div className="diff-labels">
                        <span className="diff-label">
                          <strong>A:</strong> {item.labelA || "None"}
                        </span>
                        <span className="diff-label">
                          <strong>B:</strong> {item.labelB || "None"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
