import React from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Keyboard size={18} className="modal-icon text-indigo" />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            className="btn-icon-sm"
            onClick={onClose}
            aria-label="Close shortcuts guide"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Navigate and annotate documents rapidly with these keyboard shortcuts:
          </p>

          <div className="agreement-table-container">
            <table className="agreement-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Tag Selection</td>
                  <td>
                    <kbd>1</kbd> &ndash; <kbd>9</kbd>
                  </td>
                  <td>Applies label corresponding to number to highlighted text</td>
                </tr>
                <tr>
                  <td className="font-semibold">Undo Action</td>
                  <td>
                    <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>⌘Z</kbd>
                  </td>
                  <td>Reverses the last added or deleted annotation span</td>
                </tr>
                <tr>
                  <td className="font-semibold">Clear Selection</td>
                  <td>
                    <kbd>Esc</kbd>
                  </td>
                  <td>Clears active text highlight or dismisses warning</td>
                </tr>
                <tr>
                  <td className="font-semibold">Extend Highlight</td>
                  <td>
                    <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>
                  </td>
                  <td>Selects words character by character</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary btn-sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
