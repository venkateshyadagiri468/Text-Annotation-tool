import type { AppState, Doc, Label } from "../types";

const STORAGE_KEY = "text_annotation_tool_state_v1";

export function isValidLabel(label: unknown): label is Label {
  if (!label || typeof label !== "object") return false;
  const l = label as Record<string, unknown>;
  return (
    typeof l.id === "string" &&
    typeof l.name === "string" &&
    typeof l.color === "string" &&
    typeof l.shortcut === "string"
  );
}

export function isValidDoc(doc: unknown): doc is Doc {
  if (!doc || typeof doc !== "object") return false;
  const d = doc as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.text === "string" &&
    Array.isArray(d.annotations) &&
    (d.status === "pending" || d.status === "done") &&
    typeof d.secondsSpent === "number"
  );
}

export function isValidAppState(state: unknown): state is AppState {
  if (!state || typeof state !== "object") return false;
  const s = state as Record<string, unknown>;

  if (!Array.isArray(s.docs) || s.docs.length === 0) return false;
  if (!Array.isArray(s.labels) || s.labels.length === 0) return false;
  if (typeof s.activeDocId !== "string") return false;

  const allDocsValid = s.docs.every(isValidDoc);
  const allLabelsValid = s.labels.every(isValidLabel);

  return allDocsValid && allLabelsValid;
}

/**
 * Safely loads application state from localStorage with validation.
 * If data is corrupted or schema is invalid, returns null.
 */
export function loadStateFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (isValidAppState(parsed)) {
      return parsed;
    }
    console.warn("Corrupted or outdated state in localStorage. Falling back to defaults.");
    return null;
  } catch (err) {
    console.warn("Error reading state from localStorage:", err);
    return null;
  }
}

/**
 * Safely persists application state to localStorage.
 */
export function saveStateToStorage(state: AppState): boolean {
  try {
    const serialized = JSON.stringify({
      docs: state.docs,
      labels: state.labels,
      activeDocId: state.activeDocId,
    });
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error("Failed to save state to localStorage:", err);
    return false;
  }
}

/**
 * Clears saved state from localStorage.
 */
export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear localStorage:", err);
  }
}
