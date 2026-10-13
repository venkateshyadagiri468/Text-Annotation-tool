import { describe, it, expect } from "vitest";
import { appReducer, type ExtendedAppState } from "../src/state/reducer";
import type { Annotation, Label } from "../src/types";

describe("appReducer", () => {
  const initialLabels: Label[] = [
    { id: "l1", name: "PERSON", color: "#3B82F6", shortcut: "1" },
    { id: "l2", name: "ORG", color: "#8B5CF6", shortcut: "2" },
  ];

  const initialState: ExtendedAppState = {
    docs: [
      {
        id: "doc-1",
        text: "Alice visited Paris",
        annotations: [],
        status: "pending",
        secondsSpent: 0,
      },
      {
        id: "doc-2",
        text: "Bob visited Rome",
        annotations: [],
        status: "pending",
        secondsSpent: 0,
      },
    ],
    labels: initialLabels,
    activeDocId: "doc-1",
    history: [],
  };

  it("adds an annotation and tracks undo history", () => {
    const ann: Annotation = { id: "a1", start: 0, end: 5, labelId: "l1" };
    const nextState = appReducer(initialState, {
      type: "ADD_ANNOTATION",
      payload: { docId: "doc-1", annotation: ann },
    });

    expect(nextState.docs[0].annotations).toHaveLength(1);
    expect(nextState.docs[0].annotations[0]).toEqual(ann);
    expect(nextState.history).toHaveLength(1);
    expect(nextState.history[0].type).toBe("ADD");
  });

  it("undoes adding an annotation", () => {
    const ann: Annotation = { id: "a1", start: 0, end: 5, labelId: "l1" };
    const stateWithAnnotation = appReducer(initialState, {
      type: "ADD_ANNOTATION",
      payload: { docId: "doc-1", annotation: ann },
    });

    const undoneState = appReducer(stateWithAnnotation, { type: "UNDO" });
    expect(undoneState.docs[0].annotations).toHaveLength(0);
    expect(undoneState.history).toHaveLength(0);
  });

  it("removes an annotation and undo restores it", () => {
    const ann: Annotation = { id: "a1", start: 0, end: 5, labelId: "l1" };
    const stateWithAnnotation = appReducer(initialState, {
      type: "ADD_ANNOTATION",
      payload: { docId: "doc-1", annotation: ann },
    });

    const stateAfterRemoval = appReducer(stateWithAnnotation, {
      type: "REMOVE_ANNOTATION",
      payload: { docId: "doc-1", annotationId: "a1" },
    });

    expect(stateAfterRemoval.docs[0].annotations).toHaveLength(0);

    const undoneRemovalState = appReducer(stateAfterRemoval, { type: "UNDO" });
    expect(undoneRemovalState.docs[0].annotations).toHaveLength(1);
    expect(undoneRemovalState.docs[0].annotations[0]).toEqual(ann);
  });

  it("marks document as done and advances to next pending doc", () => {
    const nextState = appReducer(initialState, {
      type: "MARK_DONE",
      payload: { docId: "doc-1", status: "done" },
    });

    expect(nextState.docs[0].status).toBe("done");
    expect(nextState.activeDocId).toBe("doc-2");
  });

  it("increments timer on TICK_TIMER", () => {
    const nextState = appReducer(initialState, {
      type: "TICK_TIMER",
      payload: { docId: "doc-1" },
    });
    expect(nextState.docs[0].secondsSpent).toBe(1);
  });
});
