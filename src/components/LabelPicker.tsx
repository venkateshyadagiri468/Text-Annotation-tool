import React, { useState } from "react";
import { Plus, Tag } from "lucide-react";
import type { Label } from "../types";

interface LabelPickerProps {
  labels: Label[];
  selectedLabelId: string | null;
  onSelectLabel: (label: Label) => void;
  onAddLabel: (label: Label) => void;
  hasActiveTextSelection: boolean;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({
  labels,
  selectedLabelId,
  onSelectLabel,
  onAddLabel,
  hasActiveTextSelection,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366F1");

  function handleCreateLabel(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newLabelName.trim().toUpperCase();
    if (!trimmed) return;

    // Next shortcut number
    const usedShortcuts = new Set(labels.map((l) => l.shortcut));
    let nextShortcut = "1";
    for (let i = 1; i <= 9; i++) {
      if (!usedShortcuts.has(String(i))) {
        nextShortcut = String(i);
        break;
      }
    }

    const newLabel: Label = {
      id: `label-${Date.now()}`,
      name: trimmed,
      color: newLabelColor,
      shortcut: nextShortcut,
      description: `Custom label for ${trimmed}`,
      example: "Add example here",
    };

    onAddLabel(newLabel);
    setNewLabelName("");
    setShowAddForm(false);
  }

  return (
    <div className="label-picker-container" aria-label="Label selection palette">
      <div className="label-picker-header">
        <div className="label-picker-title">
          <Tag size={16} />
          <span>Labels</span>
          {hasActiveTextSelection && (
            <span className="selection-badge">Text Selected — Click or press 1-9 to tag</span>
          )}
        </div>
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setShowAddForm(!showAddForm)}
          aria-label={showAddForm ? "Cancel adding label" : "Add custom label"}
        >
          <Plus size={14} />
          <span>{showAddForm ? "Cancel" : "Add Label"}</span>
        </button>
      </div>

      {showAddForm && (
        <form className="add-label-form" onSubmit={handleCreateLabel}>
          <input
            type="text"
            className="input-text"
            placeholder="Label name (e.g. PRODUCT)"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            required
            autoFocus
          />
          <div className="color-picker-group">
            <label htmlFor="label-color-input" className="sr-only">Label Color</label>
            <input
              id="label-color-input"
              type="color"
              className="input-color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              title="Pick label color"
            />
            <span className="color-preview" style={{ backgroundColor: newLabelColor }}></span>
          </div>
          <button type="submit" className="btn-primary btn-sm">
            Save
          </button>
        </form>
      )}

      <div className="label-buttons-grid" role="group" aria-label="Entity Labels">
        {labels.map((label) => {
          const isSelected = selectedLabelId === label.id;
          return (
            <button
              key={label.id}
              type="button"
              className={`label-btn ${isSelected ? "active" : ""} ${hasActiveTextSelection ? "highlight-target" : ""}`}
              style={{
                borderColor: label.color,
                backgroundColor: isSelected ? `${label.color}25` : undefined,
              }}
              onClick={() => onSelectLabel(label)}
              aria-label={`Tag with ${label.name}, keyboard shortcut ${label.shortcut}`}
              title={`${label.name}: ${label.description || "Click to annotate"} (Key: ${label.shortcut})`}
            >
              <span
                className="label-color-dot"
                style={{ backgroundColor: label.color }}
              />
              <span className="label-name">{label.name}</span>
              <kbd className="label-shortcut" title={`Press ${label.shortcut}`}>
                {label.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
};
