import React, { useState, useMemo } from "react";
import { CheckCircle2, Clock, Search, FileText, ChevronRight, Plus } from "lucide-react";
import type { Doc } from "../types";
import { formatTime } from "./ProgressBar";

interface DocumentQueueProps {
  docs: Doc[];
  activeDocId: string;
  onSelectDoc: (docId: string) => void;
  onToggleStatus: (docId: string) => void;
  onAddDoc: (title: string, text: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const DocumentQueue: React.FC<DocumentQueueProps> = ({
  docs,
  activeDocId,
  onSelectDoc,
  onToggleStatus,
  onAddDoc,
  isOpen,
  onCloseMobile,
}) => {
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      if (filter === "pending" && doc.status !== "pending") return false;
      if (filter === "done" && doc.status !== "done") return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (doc.title || "").toLowerCase().includes(query);
        const matchesText = doc.text.toLowerCase().includes(query);
        if (!matchesTitle && !matchesText) return false;
      }
      return true;
    });
  }, [docs, filter, searchQuery]);

  const pendingCount = docs.filter((d) => d.status === "pending").length;
  const doneCount = docs.filter((d) => d.status === "done").length;

  function handleCreateDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    onAddDoc(newTitle.trim() || `Document ${docs.length + 1}`, newText.trim());
    setNewTitle("");
    setNewText("");
    setShowAddForm(false);
  }

  return (
    <aside className={`doc-queue-sidebar ${isOpen ? "open" : "closed"}`} aria-label="Documents Queue">
      <div className="doc-queue-header">
        <div className="queue-title-row">
          <div className="queue-title-left">
            <FileText size={16} />
            <h3>Documents</h3>
            <span className="queue-total-badge">{docs.length}</span>
          </div>

          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
            title="Add your own document to annotate"
            aria-label="Add new document"
          >
            <Plus size={13} />
            <span>{showAddForm ? "Cancel" : "New"}</span>
          </button>
        </div>

        {showAddForm && (
          <form className="add-label-form" style={{ flexDirection: "column", gap: "8px" }} onSubmit={handleCreateDoc}>
            <input
              type="text"
              className="input-text"
              placeholder="Title (e.g. News Excerpt)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="input-textarea"
              rows={3}
              placeholder="Paste text to annotate here..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary btn-sm" style={{ width: "100%" }}>
              Add to Queue
            </button>
          </form>
        )}

        <div className="queue-search-container">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="queue-search-input"
            placeholder="Search text or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter documents by text"
          />
        </div>

        <div className="queue-filters" role="tablist" aria-label="Filter documents">
          <button
            type="button"
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({docs.length})
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            className={`filter-tab ${filter === "done" ? "active" : ""}`}
            onClick={() => setFilter("done")}
          >
            Done ({doneCount})
          </button>
        </div>
      </div>

      <div className="doc-queue-list" role="list">
        {filteredDocs.length === 0 ? (
          <div className="empty-queue-msg">
            <p>No documents found</p>
          </div>
        ) : (
          filteredDocs.map((doc, idx) => {
            const isActive = doc.id === activeDocId;
            const isDone = doc.status === "done";
            const snippet = doc.text.slice(0, 80);

            return (
              <div
                key={doc.id}
                role="listitem"
                className={`doc-card ${isActive ? "active" : ""} ${isDone ? "is-done" : ""}`}
                onClick={() => {
                  onSelectDoc(doc.id);
                  if (onCloseMobile) onCloseMobile();
                }}
              >
                <div className="doc-card-top">
                  <span className="doc-index">#{idx + 1}</span>
                  <span className="doc-card-title">{doc.title || `Doc ${doc.id}`}</span>
                  <button
                    type="button"
                    className={`doc-status-badge ${isDone ? "done" : "pending"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(doc.id);
                    }}
                    title={isDone ? "Click to mark as pending" : "Click to mark as done"}
                    aria-label={`Document ${doc.id} is ${doc.status}. Click to change.`}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    <span>{isDone ? "Done" : "Pending"}</span>
                  </button>
                </div>

                <p className="doc-snippet">{snippet}...</p>

                <div className="doc-card-footer">
                  <span className="doc-annotation-count">
                    {doc.annotations.length} annotation{doc.annotations.length === 1 ? "" : "s"}
                  </span>
                  <span className="doc-time-spent" title="Time spent">
                    <Clock size={11} /> {formatTime(doc.secondsSpent)}
                  </span>
                  <ChevronRight size={13} className="doc-arrow-icon" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
