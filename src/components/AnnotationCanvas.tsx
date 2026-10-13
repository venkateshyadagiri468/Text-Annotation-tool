import React, { useRef, useMemo } from "react";
import { AlertCircle, X, Sparkles } from "lucide-react";
import type { Doc, Label } from "../types";
import { getSegments } from "../utils/segments";
import { getSelectionOffsets, type TrimmedSpan } from "../utils/offsets";

interface AnnotationCanvasProps {
  doc: Doc;
  labels: Label[];
  activeSelection: TrimmedSpan | null;
  onSelectionChange: (selection: TrimmedSpan | null) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  hoveredAnnotationId: string | null;
  setHoveredAnnotationId: (id: string | null) => void;
  overlapError: string | null;
  onDismissError: () => void;
  onApplyLabelToSelection: (label: Label) => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  doc,
  labels,
  activeSelection,
  onSelectionChange,
  onRemoveAnnotation,
  hoveredAnnotationId,
  setHoveredAnnotationId,
  overlapError,
  onDismissError,
  onApplyLabelToSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelMap = useMemo(() => new Map<string, Label>(labels.map((l) => [l.id, l])), [labels]);

  const segments = useMemo(() => {
    return getSegments(doc.text, doc.annotations);
  }, [doc.text, doc.annotations]);

  function handleMouseUp() {
    if (!containerRef.current) return;
    const span = getSelectionOffsets(containerRef.current, doc.text);
    onSelectionChange(span);
  }

  function handleKeyUp(e: React.KeyboardEvent) {
    if (e.key === "Shift" || e.key.startsWith("Arrow")) {
      if (!containerRef.current) return;
      const span = getSelectionOffsets(containerRef.current, doc.text);
      onSelectionChange(span);
    }
  }

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <h2 className="canvas-title">{doc.title || `Document ${doc.id}`}</h2>
          <span className="canvas-length-badge">{doc.text.length} characters</span>
        </div>

        {activeSelection && (
          <div className="selection-toolbar" role="status">
            <span className="selection-toolbar-text">
              Selected: &ldquo;{activeSelection.text}&rdquo; [{activeSelection.start}:{activeSelection.end}]
            </span>
            <div className="selection-quick-labels">
              {labels.slice(0, 5).map((lbl) => (
                <button
                  key={lbl.id}
                  type="button"
                  className="quick-label-pill"
                  style={{ backgroundColor: `${lbl.color}20`, borderColor: lbl.color, color: lbl.color }}
                  onClick={() => onApplyLabelToSelection(lbl)}
                  title={`Apply ${lbl.name} (${lbl.shortcut})`}
                >
                  {lbl.name} <kbd>{lbl.shortcut}</kbd>
                </button>
              ))}
              <button
                type="button"
                className="btn-icon-sm"
                onClick={() => onSelectionChange(null)}
                aria-label="Clear active text selection"
                title="Clear selection (Esc)"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {overlapError && (
        <div className="inline-error-banner" role="alert">
          <AlertCircle size={16} className="error-icon" />
          <span className="error-message">{overlapError}</span>
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={onDismissError}
            aria-label="Dismiss error message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {doc.text.length === 0 ? (
        <div className="empty-document-state">
          <Sparkles size={28} className="empty-icon" />
          <p>This document is empty.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="annotation-canvas-text"
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          tabIndex={0}
          role="region"
          aria-label="Annotatable text area. Select text and click a label or press 1-9 to annotate."
        >
          {segments.map((segment) => {
            if (!segment.isAnnotated || !segment.annotation) {
              return (
                <span
                  key={segment.id}
                  data-start={segment.start}
                  className="canvas-segment plain-segment"
                >
                  {segment.text}
                </span>
              );
            }

            const ann = segment.annotation;
            const label = labelMap.get(ann.labelId);
            const labelColor = label?.color || "#6366F1";
            const labelName = label?.name || "TAG";
            const isHovered = hoveredAnnotationId === ann.id;

            return (
              <mark
                key={segment.id}
                data-start={segment.start}
                className={`canvas-segment annotated-segment ${isHovered ? "is-hovered" : ""}`}
                style={{
                  backgroundColor: `${labelColor}2A`,
                  borderBottomColor: labelColor,
                }}
                onMouseEnter={() => setHoveredAnnotationId(ann.id)}
                onMouseLeave={() => setHoveredAnnotationId(null)}
              >
                <span className="annotated-text">{segment.text}</span>
                <span
                  className="inline-annotation-badge"
                  style={{ backgroundColor: labelColor }}
                >
                  <span className="badge-name">{labelName}</span>
                  <button
                    type="button"
                    className="badge-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveAnnotation(ann.id);
                    }}
                    aria-label={`Remove annotation ${segment.text} (${labelName})`}
                    title="Remove annotation"
                  >
                    ×
                  </button>
                </span>
              </mark>
            );
          })}
        </div>
      )}

      <div className="canvas-footer">
        <span className="canvas-hint">
          Tip: Highlight words with your mouse and press keys <kbd>1</kbd>&ndash;<kbd>9</kbd> to annotate instantly. Press <kbd>Ctrl+Z</kbd> to undo.
        </span>
      </div>
    </div>
  );
};
