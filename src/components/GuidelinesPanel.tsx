import React, { useState } from "react";
import { BookOpen, Edit2, Check, X } from "lucide-react";
import type { Label } from "../types";

interface GuidelinesPanelProps {
  labels: Label[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onUpdateLabel: (labelId: string, description: string, example: string) => void;
}

export const GuidelinesPanel: React.FC<GuidelinesPanelProps> = ({
  labels,
  isOpen,
  onToggleOpen,
  onUpdateLabel,
}) => {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editExample, setEditExample] = useState("");

  function startEditing(label: Label) {
    setEditingLabelId(label.id);
    setEditDesc(label.description || "");
    setEditExample(label.example || "");
  }

  function cancelEditing() {
    setEditingLabelId(null);
  }

  function saveEditing(labelId: string) {
    onUpdateLabel(labelId, editDesc, editExample);
    setEditingLabelId(null);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="guidelines-toggle-float"
        onClick={onToggleOpen}
        aria-label="Open Annotation Guidelines"
        title="Annotation Guidelines"
      >
        <BookOpen size={18} />
        <span>Guidelines</span>
      </button>
    );
  }

  return (
    <aside className="guidelines-drawer" aria-label="Annotation Guidelines">
      <div className="guidelines-header">
        <div className="guidelines-title">
          <BookOpen size={18} />
          <h3>Annotation Guidelines</h3>
        </div>
        <button
          type="button"
          className="btn-icon-sm"
          onClick={onToggleOpen}
          aria-label="Close Guidelines"
        >
          <X size={16} />
        </button>
      </div>

      <div className="guidelines-content">
        <p className="guidelines-intro">
          Consistent guidelines improve annotation quality. You can edit any label definition or example below.
        </p>

        <div className="guidelines-list">
          {labels.map((label) => {
            const isEditing = editingLabelId === label.id;

            return (
              <div
                key={label.id}
                className="guideline-card"
                style={{ borderLeftColor: label.color }}
              >
                <div className="guideline-card-header">
                  <div className="label-badge-group">
                    <span
                      className="label-badge-pill"
                      style={{
                        backgroundColor: `${label.color}25`,
                        color: label.color,
                        borderColor: label.color,
                      }}
                    >
                      <span className="dot" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </span>
                    <kbd className="label-shortcut-pill">Key {label.shortcut}</kbd>
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      className="btn-icon-sm"
                      onClick={() => startEditing(label)}
                      aria-label={`Edit guidelines for ${label.name}`}
                      title="Edit definition & example"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="guideline-edit-form">
                    <label className="input-label">
                      Definition:
                      <textarea
                        className="input-textarea"
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Define what qualifies for this label..."
                      />
                    </label>

                    <label className="input-label">
                      Examples:
                      <textarea
                        className="input-textarea"
                        rows={2}
                        value={editExample}
                        onChange={(e) => setEditExample(e.target.value)}
                        placeholder="Comma-separated examples..."
                      />
                    </label>

                    <div className="edit-form-actions">
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => saveEditing(label.id)}
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="guideline-body">
                    <div className="guideline-field">
                      <span className="field-title">Definition:</span>
                      <p className="field-text">
                        {label.description || "No description provided."}
                      </p>
                    </div>

                    <div className="guideline-field">
                      <span className="field-title">Examples:</span>
                      <blockquote className="field-examples">
                        {label.example || "No examples provided."}
                      </blockquote>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
