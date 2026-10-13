export interface Label {
  id: string;
  name: string;
  color: string;
  shortcut: string;
  description?: string;
  example?: string;
}

export interface Annotation {
  id: string;
  start: number;
  end: number;
  labelId: string;
}

export interface Doc {
  id: string;
  text: string;
  annotations: Annotation[];
  status: "pending" | "done";
  secondsSpent: number;
  title?: string;
}

export interface AppState {
  docs: Doc[];
  labels: Label[];
  activeDocId: string;
}

export interface HistoryAction {
  type: "ADD" | "REMOVE";
  docId: string;
  annotation: Annotation;
}

// Preference ranking types (Stretch Goal)
export interface PreferencePrompt {
  id: string;
  prompt: string;
  responseA: { model: string; text: string };
  responseB: { model: string; text: string };
  chosen?: "A" | "B" | "tie";
  reason?: string;
  status: "pending" | "done";
}

export type ToolMode = "annotate" | "ranking" | "agreement";
