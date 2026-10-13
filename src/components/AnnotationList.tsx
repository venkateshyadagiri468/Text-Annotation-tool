import React, { useMemo } from "react";
import { Trash2, RotateCcw, ListFilter, Sparkles } from "lucide-react";
import type { Doc, Label } from "../types";

interface AnnotationListProps {
  doc: Doc;
  labels: Label[];
  onRemoveAnnotation: (annotationId: string) => void;
  onClearAllAnnotations: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hoveredAnnotationId: string | null;
  setHoveredAnnotationId: (id: string | null) => void;
}

export const AnnotationList: React.FC<AnnotationListProps> = ({
  doc,
  labels,
  onRemoveAnnotation,
  onClearAllAnnotations,
  onUndo,
  canUndo,
  hoveredAnnotationId,
  setHoveredAnnotationId,
}) => {
  const labelMap = useMemo(() => new Map<string, Label>(labels.map((l) => [l.id, l])), [labels]);

  const sortedAnnotations = useMemo(() => {
    return [...doc.annotations].sort((a, b) => a.start - b.start);
  }, [doc.annotations]);

  return (
    <div className="annotation-list-panel">
      <div className="annotation-list-header">
        <div className="header-title-row">
          <ListFilter size={16} />
          <h3>Annotations</h3>
          <span className="count-badge">{doc.annotations.length}</span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo last action (Ctrl+Z)"
            aria-label="Undo last annotation action"
          >
            <RotateCcw size={14} />
            <span>Undo</span>
          </button>

          {doc.annotations.length > 0 && (
            <button
              type="button"
              className="btn-ghost btn-sm text-danger"
              onClick={onClearAllAnnotations}
              title="Clear all annotations for this document"
              aria-label="Clear all annotations"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="annotation-items-container" role="list" aria-label="Current document annotations">
        {sortedAnnotations.length === 0 ? (
          <div className="empty-annotations-state">
            <Sparkles size={24} className="empty-icon" />
            <p className="empty-text">No annotations yet</p>
            <span className="empty-subtext">Highlight text in the canvas to tag entities</span>
          </div>
        ) : (
          sortedAnnotations.map((ann) => {
            const label = labelMap.get(ann.labelId);
            const labelColor = label?.color || "#6366F1";
            const labelName = label?.name || "TAG";
            const snippet = doc.text.slice(ann.start, ann.end);
            const isHovered = hoveredAnnotationId === ann.id;

            return (
              <div
                key={ann.id}
                role="listitem"
                className={`annotation-item ${isHovered ? "is-hovered" : ""}`}
                onMouseEnter={() => setHoveredAnnotationId(ann.id)}
                onMouseLeave={() => setHoveredAnnotationId(null)}
              >
                <div className="annotation-item-body">
                  <div className="annotation-item-top">
                    <span
                      className="label-badge-pill"
                      style={{
                        backgroundColor: `${labelColor}25`,
                        color: labelColor,
                        borderColor: labelColor,
                      }}
                    >
                      <span className="dot" style={{ backgroundColor: labelColor }} />
                      {labelName}
                    </span>
                    <span className="offsets-pill" title="Character offsets [start:end]">
                      {ann.start}:{ann.end}
                    </span>
                  </div>

                  <div className="annotation-snippet" title={snippet}>
                    &ldquo;{snippet}&rdquo;
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-delete-annotation"
                  onClick={() => onRemoveAnnotation(ann.id)}
                  aria-label={`Delete annotation for "${snippet}"`}
                  title="Delete annotation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
