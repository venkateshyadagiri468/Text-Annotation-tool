import { useEffect } from "react";
import type { Label } from "../types";

interface UseKeyboardShortcutsOptions {
  labels: Label[];
  onApplyLabel: (label: Label) => void;
  onUndo: () => void;
  onClearSelection?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  labels,
  onApplyLabel,
  onUndo,
  onClearSelection,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Don't intercept shortcuts when user is actively typing in inputs or textareas
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Check Undo: Ctrl+Z or Cmd+Z (without Shift)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Check Escape
      if (event.key === "Escape") {
        if (onClearSelection) {
          onClearSelection();
        }
        return;
      }

      // Check 1-9 shortcuts
      const matchedLabel = labels.find((l) => l.shortcut === event.key);
      if (matchedLabel) {
        event.preventDefault();
        onApplyLabel(matchedLabel);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [labels, onApplyLabel, onUndo, onClearSelection, enabled]);
}
