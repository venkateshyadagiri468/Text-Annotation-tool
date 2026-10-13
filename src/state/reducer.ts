import type { AppState, Doc, Annotation, Label, HistoryAction } from "../types";

export interface ExtendedAppState extends AppState {
  history: HistoryAction[];
}

export type Action =
  | { type: "ADD_ANNOTATION"; payload: { docId: string; annotation: Annotation } }
  | { type: "REMOVE_ANNOTATION"; payload: { docId: string; annotationId: string } }
  | { type: "UNDO" }
  | { type: "SET_ACTIVE_DOC"; payload: string }
  | { type: "MARK_DONE"; payload: { docId: string; status?: "pending" | "done" } }
  | { type: "LOAD"; payload: AppState }
  | { type: "ADD_LABEL"; payload: Label }
  | {
      type: "UPDATE_LABEL";
      payload: {
        labelId: string;
        description?: string;
        example?: string;
        name?: string;
        color?: string;
      };
    }
  | { type: "TICK_TIMER"; payload: { docId: string } }
  | { type: "ADD_DOC"; payload: { title: string; text: string } }
  | { type: "RESET_DOC_ANNOTATIONS"; payload: { docId: string } };

export function appReducer(state: ExtendedAppState, action: Action): ExtendedAppState {
  switch (action.type) {
    case "ADD_ANNOTATION": {
      const { docId, annotation } = action.payload;
      const targetDocIndex = state.docs.findIndex((d) => d.id === docId);
      if (targetDocIndex === -1) return state;

      const targetDoc = state.docs[targetDocIndex];
      // Append and sort by start offset
      const updatedAnnotations = [...targetDoc.annotations, annotation].sort(
        (a, b) => a.start - b.start
      );

      const updatedDocs = [...state.docs];
      updatedDocs[targetDocIndex] = {
        ...targetDoc,
        annotations: updatedAnnotations,
      };

      const newHistoryItem: HistoryAction = {
        type: "ADD",
        docId,
        annotation,
      };

      return {
        ...state,
        docs: updatedDocs,
        history: [newHistoryItem, ...state.history].slice(0, 50),
      };
    }

    case "REMOVE_ANNOTATION": {
      const { docId, annotationId } = action.payload;
      const targetDocIndex = state.docs.findIndex((d) => d.id === docId);
      if (targetDocIndex === -1) return state;

      const targetDoc = state.docs[targetDocIndex];
      const removedAnnotation = targetDoc.annotations.find((a) => a.id === annotationId);
      if (!removedAnnotation) return state;

      const updatedAnnotations = targetDoc.annotations.filter((a) => a.id !== annotationId);

      const updatedDocs = [...state.docs];
      updatedDocs[targetDocIndex] = {
        ...targetDoc,
        annotations: updatedAnnotations,
      };

      const newHistoryItem: HistoryAction = {
        type: "REMOVE",
        docId,
        annotation: removedAnnotation,
      };

      return {
        ...state,
        docs: updatedDocs,
        history: [newHistoryItem, ...state.history].slice(0, 50),
      };
    }

    case "UNDO": {
      if (state.history.length === 0) return state;

      const [lastAction, ...remainingHistory] = state.history;
      const targetDocIndex = state.docs.findIndex((d) => d.id === lastAction.docId);
      if (targetDocIndex === -1) {
        return { ...state, history: remainingHistory };
      }

      const targetDoc = state.docs[targetDocIndex];
      let updatedAnnotations = [...targetDoc.annotations];

      if (lastAction.type === "ADD") {
        // Undoing an ADD means removing the annotation
        updatedAnnotations = updatedAnnotations.filter((a) => a.id !== lastAction.annotation.id);
      } else if (lastAction.type === "REMOVE") {
        // Undoing a REMOVE means re-adding the annotation
        updatedAnnotations = [...updatedAnnotations, lastAction.annotation].sort(
          (a, b) => a.start - b.start
        );
      }

      const updatedDocs = [...state.docs];
      updatedDocs[targetDocIndex] = {
        ...targetDoc,
        annotations: updatedAnnotations,
      };

      return {
        ...state,
        docs: updatedDocs,
        activeDocId: lastAction.docId,
        history: remainingHistory,
      };
    }

    case "SET_ACTIVE_DOC": {
      if (state.activeDocId === action.payload) return state;
      const exists = state.docs.some((d) => d.id === action.payload);
      if (!exists) return state;
      return {
        ...state,
        activeDocId: action.payload,
      };
    }

    case "MARK_DONE": {
      const { docId, status } = action.payload;
      const targetIndex = state.docs.findIndex((d) => d.id === docId);
      if (targetIndex === -1) return state;

      const currentStatus = state.docs[targetIndex].status;
      const nextStatus = status || (currentStatus === "pending" ? "done" : "pending");

      const updatedDocs = [...state.docs];
      updatedDocs[targetIndex] = {
        ...state.docs[targetIndex],
        status: nextStatus,
      };

      let nextActiveDocId = state.activeDocId;

      // If marked done, advance to next pending document
      if (nextStatus === "done") {
        const docCount = updatedDocs.length;
        for (let i = 1; i <= docCount; i++) {
          const candidateIndex = (targetIndex + i) % docCount;
          if (updatedDocs[candidateIndex].status === "pending") {
            nextActiveDocId = updatedDocs[candidateIndex].id;
            break;
          }
        }
      }

      return {
        ...state,
        docs: updatedDocs,
        activeDocId: nextActiveDocId,
      };
    }

    case "LOAD": {
      return {
        docs: action.payload.docs,
        labels: action.payload.labels,
        activeDocId: action.payload.activeDocId || action.payload.docs[0]?.id || "",
        history: [],
      };
    }

    case "ADD_LABEL": {
      if (state.labels.some((l) => l.id === action.payload.id || l.name === action.payload.name)) {
        return state;
      }
      return {
        ...state,
        labels: [...state.labels, action.payload],
      };
    }

    case "UPDATE_LABEL": {
      const { labelId, ...changes } = action.payload;
      return {
        ...state,
        labels: state.labels.map((l) => (l.id === labelId ? { ...l, ...changes } : l)),
      };
    }

    case "TICK_TIMER": {
      const targetIndex = state.docs.findIndex((d) => d.id === action.payload.docId);
      if (targetIndex === -1) return state;

      const updatedDocs = [...state.docs];
      updatedDocs[targetIndex] = {
        ...state.docs[targetIndex],
        secondsSpent: state.docs[targetIndex].secondsSpent + 1,
      };

      return {
        ...state,
        docs: updatedDocs,
      };
    }

    case "ADD_DOC": {
      const newDoc: Doc = {
        id: `doc-${Date.now()}`,
        title: action.payload.title,
        text: action.payload.text,
        annotations: [],
        status: "pending",
        secondsSpent: 0,
      };
      return {
        ...state,
        docs: [newDoc, ...state.docs],
        activeDocId: newDoc.id,
      };
    }

    case "RESET_DOC_ANNOTATIONS": {
      const targetIndex = state.docs.findIndex((d) => d.id === action.payload.docId);
      if (targetIndex === -1) return state;

      const updatedDocs = [...state.docs];
      updatedDocs[targetIndex] = {
        ...state.docs[targetIndex],
        annotations: [],
      };

      return {
        ...state,
        docs: updatedDocs,
      };
    }

    default:
      return state;
  }
}
