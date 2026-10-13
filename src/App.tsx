import React, { useState, useReducer, useEffect, useCallback, useMemo } from "react";
import { appReducer, type ExtendedAppState } from "./state/reducer";
import { loadStateFromStorage, saveStateToStorage, clearStorage } from "./state/storage";
import { DEFAULT_APP_STATE } from "./data/defaultData";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { findOverlappingAnnotation, type TrimmedSpan } from "./utils/offsets";
import { generateExportJsonData } from "./utils/export";
import type { Label, Annotation, ToolMode } from "./types";

import { Header } from "./components/Header";
import { ProgressBar } from "./components/ProgressBar";
import { DocumentQueue } from "./components/DocumentQueue";
import { AnnotationCanvas } from "./components/AnnotationCanvas";
import { LabelPicker } from "./components/LabelPicker";
import { AnnotationList } from "./components/AnnotationList";
import { GuidelinesPanel } from "./components/GuidelinesPanel";
import { ExportModal } from "./components/ExportModal";
import { AgreementModal } from "./components/AgreementModal";
import { PreferenceRanking } from "./components/PreferenceRanking";
import { ShortcutsModal } from "./components/ShortcutsModal";

export const App: React.FC = () => {
  // Theme state: defaults to light (clean editorial paper mode)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("docspan_theme");
      if (saved === "dark" || saved === "light") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("docspan_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Initialize state from storage or default data
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    const saved = loadStateFromStorage();
    if (saved) {
      return { ...saved, history: [] } as ExtendedAppState;
    }
    return { ...DEFAULT_APP_STATE, history: [] } as ExtendedAppState;
  });

  // App UI state
  const [mode, setMode] = useState<ToolMode>("annotate");
  const [activeSelection, setActiveSelection] = useState<TrimmedSpan | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Active document
  const activeDoc = useMemo(() => {
    return state.docs.find((d) => d.id === state.activeDocId) || state.docs[0];
  }, [state.docs, state.activeDocId]);

  // Try fetching public/sample-docs.json on first load if no storage existed
  useEffect(() => {
    const saved = loadStateFromStorage();
    if (!saved) {
      fetch("/sample-docs.json")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load sample docs");
        })
        .then((data) => {
          if (data && Array.isArray(data.docs) && Array.isArray(data.labels)) {
            dispatch({
              type: "LOAD",
              payload: {
                docs: data.docs,
                labels: data.labels,
                activeDocId: data.docs[0]?.id || "doc-1",
              },
            });
          }
        })
        .catch(() => {
          // Defaults are already loaded
        });
    }
  }, []);

  // Persist state to localStorage on modification
  useEffect(() => {
    saveStateToStorage({
      docs: state.docs,
      labels: state.labels,
      activeDocId: state.activeDocId,
    });
  }, [state.docs, state.labels, state.activeDocId]);

  // Per-document timer: ticks every 1 second when window is active
  useEffect(() => {
    if (mode !== "annotate" || !activeDoc) return;

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        dispatch({
          type: "TICK_TIMER",
          payload: { docId: activeDoc.id },
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, activeDoc]);

  // Apply label to currently selected text span
  const applyLabelToSelection = useCallback(
    (label: Label) => {
      if (!activeSelection || !activeDoc) {
        setSelectedLabelId(label.id);
        return;
      }

      // Check overlap
      const overlap = findOverlappingAnnotation(
        { start: activeSelection.start, end: activeSelection.end },
        activeDoc.annotations
      );

      if (overlap) {
        const overlapSnippet = activeDoc.text.slice(overlap.start, overlap.end);
        setOverlapError(
          `Overlapping annotations are not allowed. Selection "${activeSelection.text}" [${activeSelection.start}:${activeSelection.end}] conflicts with existing span "${overlapSnippet}" [${overlap.start}:${overlap.end}].`
        );
        return;
      }

      setOverlapError(null);

      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        start: activeSelection.start,
        end: activeSelection.end,
        labelId: label.id,
      };

      dispatch({
        type: "ADD_ANNOTATION",
        payload: {
          docId: activeDoc.id,
          annotation: newAnnotation,
        },
      });

      // Clear text selection
      window.getSelection()?.removeAllRanges();
      setActiveSelection(null);
    },
    [activeSelection, activeDoc]
  );

  const handleUndo = useCallback(() => {
    dispatch({ type: "UNDO" });
    setOverlapError(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setActiveSelection(null);
    setOverlapError(null);
  }, []);

  // Keyboard shortcuts (1-9, Ctrl+Z, Escape)
  useKeyboardShortcuts({
    labels: state.labels,
    onApplyLabel: applyLabelToSelection,
    onUndo: handleUndo,
    onClearSelection: handleClearSelection,
    enabled: mode === "annotate",
  });

  const handleResetData = useCallback(() => {
    if (window.confirm("Reset all documents and annotations to original sample data?")) {
      clearStorage();
      dispatch({
        type: "LOAD",
        payload: DEFAULT_APP_STATE,
      });
      setActiveSelection(null);
      setOverlapError(null);
    }
  }, []);

  const completedCount = state.docs.filter((d) => d.status === "done").length;

  return (
    <div className="app-container">
      <Header
        currentMode={mode}
        onSelectMode={setMode}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAgreement={() => setIsAgreementOpen(true)}
        onToggleGuidelines={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
        isGuidelinesOpen={isGuidelinesOpen}
        onResetData={handleResetData}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {mode === "ranking" ? (
        <main className="main-content">
          <PreferenceRanking />
        </main>
      ) : (
        <main className="main-layout">
          <DocumentQueue
            docs={state.docs}
            activeDocId={state.activeDocId}
            onSelectDoc={(id) => {
              dispatch({ type: "SET_ACTIVE_DOC", payload: id });
              setActiveSelection(null);
              setOverlapError(null);
            }}
            onToggleStatus={(id) => {
              dispatch({ type: "MARK_DONE", payload: { docId: id } });
            }}
            onAddDoc={(title, text) => {
              dispatch({ type: "ADD_DOC", payload: { title, text } });
            }}
            isOpen={isSidebarOpen}
          />

          <div className="workspace-area">
            {activeDoc && (
              <>
                <ProgressBar
                  totalDocs={state.docs.length}
                  completedDocs={completedCount}
                  secondsSpent={activeDoc.secondsSpent}
                  status={activeDoc.status}
                  onToggleStatus={() => {
                    dispatch({ type: "MARK_DONE", payload: { docId: activeDoc.id } });
                  }}
                />

                <div className="workspace-grid">
                  <div className="canvas-column">
                    <LabelPicker
                      labels={state.labels}
                      selectedLabelId={selectedLabelId}
                      onSelectLabel={(lbl) => {
                        setSelectedLabelId(lbl.id);
                        applyLabelToSelection(lbl);
                      }}
                      onAddLabel={(newLabel) => {
                        dispatch({ type: "ADD_LABEL", payload: newLabel });
                      }}
                      hasActiveTextSelection={Boolean(activeSelection)}
                    />

                    <AnnotationCanvas
                      doc={activeDoc}
                      labels={state.labels}
                      activeSelection={activeSelection}
                      onSelectionChange={(sel) => {
                        setActiveSelection(sel);
                        if (sel) setOverlapError(null);
                      }}
                      onRemoveAnnotation={(annId) => {
                        dispatch({
                          type: "REMOVE_ANNOTATION",
                          payload: { docId: activeDoc.id, annotationId: annId },
                        });
                      }}
                      hoveredAnnotationId={hoveredAnnotationId}
                      setHoveredAnnotationId={setHoveredAnnotationId}
                      overlapError={overlapError}
                      onDismissError={() => setOverlapError(null)}
                      onApplyLabelToSelection={applyLabelToSelection}
                    />
                  </div>

                  <aside className="annotations-sidebar">
                    <AnnotationList
                      doc={activeDoc}
                      labels={state.labels}
                      onRemoveAnnotation={(annId) => {
                        dispatch({
                          type: "REMOVE_ANNOTATION",
                          payload: { docId: activeDoc.id, annotationId: annId },
                        });
                      }}
                      onClearAllAnnotations={() => {
                        dispatch({
                          type: "RESET_DOC_ANNOTATIONS",
                          payload: { docId: activeDoc.id },
                        });
                      }}
                      onUndo={handleUndo}
                      canUndo={state.history.length > 0}
                      hoveredAnnotationId={hoveredAnnotationId}
                      setHoveredAnnotationId={setHoveredAnnotationId}
                    />
                  </aside>
                </div>
              </>
            )}
          </div>

          <GuidelinesPanel
            labels={state.labels}
            isOpen={isGuidelinesOpen}
            onToggleOpen={() => setIsGuidelinesOpen(!isGuidelinesOpen)}
            onUpdateLabel={(labelId, desc, example) => {
              dispatch({
                type: "UPDATE_LABEL",
                payload: {
                  labelId,
                  description: desc,
                  example,
                },
              });
            }}
          />
        </main>
      )}

      <ExportModal
        docs={state.docs}
        labels={state.labels}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <AgreementModal
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        currentExportData={generateExportJsonData(state.docs, state.labels)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
