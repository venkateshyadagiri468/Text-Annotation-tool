import React, { useState } from "react";
import { Download, ThumbsUp, Scale, CheckCircle2, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { PreferencePrompt } from "../types";
import { triggerFileDownload } from "../utils/export";

const INITIAL_PROMPTS: PreferencePrompt[] = [
  {
    id: "pref-1",
    prompt: "Write a concise Python function to calculate the Fibonacci sequence up to n terms with memoization.",
    responseA: {
      model: "Model-Alpha",
      text: `def fibonacci_memo(n, memo=None):\n    if memo is None:\n        memo = {0: 0, 1: 1}\n    if n in memo:\n        return memo[n]\n    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)\n    return memo[n]\n\ndef fibonacci_sequence(n):\n    return [fibonacci_memo(i) for i in range(n)]`,
    },
    responseB: {
      model: "Model-Beta",
      text: `from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fib(n: int) -> int:\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\ndef get_fibonacci_series(n: int) -> list[int]:\n    """Returns first n terms of Fibonacci sequence."""\n    return [fib(i) for i in range(n)]`,
    },
    chosen: "B",
    reason: "Model Beta uses idiomatic Python functools.lru_cache and clean type annotations.",
    status: "done",
  },
  {
    id: "pref-2",
    prompt: "Explain quantum entanglement in 2 sentences to a high school student.",
    responseA: {
      model: "Model-Alpha",
      text: "Quantum entanglement is a phenomenon where two particles become inextricably linked so that the physical state of one instantly dictates the state of the other, regardless of distance. Albert Einstein famously described this counterintuitive property as 'spooky action at a distance.'",
    },
    responseB: {
      model: "Model-Beta",
      text: "Imagine having a pair of magical dice separated across the universe; whenever you roll one to show a six, the other dice instantly rolls a six at the exact same moment. Entanglement means paired particles share a single connected identity, no matter how far apart they travel.",
    },
    chosen: undefined,
    reason: "",
    status: "pending",
  },
  {
    id: "pref-3",
    prompt: "Draft a polite decline email to an invitation for a podcast interview because of calendar conflicts.",
    responseA: {
      model: "Model-Alpha",
      text: "Subject: Re: Podcast Invitation\n\nHi Alex,\n\nThanks for reaching out! I'm very flattered by your invitation, but unfortunately my schedule is completely booked this quarter with product launches so I have to pass.\n\nBest,\nTaylor",
    },
    responseB: {
      model: "Model-Beta",
      text: "Subject: Thank you for the podcast invitation\n\nHi Alex,\n\nThank you so much for thinking of me for the show! I really enjoy your episodes on technology and engineering.\n\nUnfortunately, due to current project deadlines and travel commitments over the coming weeks, I won't be able to participate at this time. I would love to stay in touch and explore connecting in a future season once our launch cycle wraps up.\n\nWishing you all the best with the show!\n\nWarm regards,\nTaylor",
    },
    chosen: undefined,
    reason: "",
    status: "pending",
  },
];

export const PreferenceRanking: React.FC = () => {
  const [prompts, setPrompts] = useState<PreferencePrompt[]>(() => {
    try {
      const saved = localStorage.getItem("text_annotation_pref_prompts");
      return saved ? JSON.parse(saved) : INITIAL_PROMPTS;
    } catch {
      return INITIAL_PROMPTS;
    }
  });

  const [activeIndex, setActiveIndex] = useState(0);

  const currentItem = prompts[activeIndex] || prompts[0];
  const completedCount = prompts.filter((p) => p.status === "done").length;

  function updateCurrent(chosen: "A" | "B" | "tie", reason: string) {
    const updated = [...prompts];
    updated[activeIndex] = {
      ...currentItem,
      chosen,
      reason,
      status: "done",
    };
    setPrompts(updated);
    try {
      localStorage.setItem("text_annotation_pref_prompts", JSON.stringify(updated));
    } catch {
      // storage quota fallback
    }
  }

  function handleExport() {
    const payload = {
      dataset: "preference_ranking_rlhf",
      exportedAt: new Date().toISOString(),
      items: prompts,
    };
    triggerFileDownload(
      JSON.stringify(payload, null, 2),
      `preference-ranking-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
  }

  return (
    <div className="preference-view-container">
      <div className="preference-header">
        <div className="pref-title-group">
          <h2>RLHF Preference Ranking</h2>
          <span className="pref-subtitle">
            Evaluate and rank paired model responses side-by-side to train preference models.
          </span>
        </div>

        <div className="pref-actions">
          <span className="pref-progress-pill">
            {completedCount} / {prompts.length} Ranked
          </span>
          <button type="button" className="btn-primary btn-sm" onClick={handleExport}>
            <Download size={14} /> Export Dataset
          </button>
        </div>
      </div>

      <div className="pref-nav-row">
        <div className="pref-nav-buttons">
          {prompts.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              className={`pref-nav-tab ${idx === activeIndex ? "active" : ""} ${p.status === "done" ? "done" : ""}`}
              onClick={() => setActiveIndex(idx)}
            >
              <span>Prompt #{idx + 1}</span>
              {p.status === "done" && <CheckCircle2 size={12} className="text-emerald" />}
            </button>
          ))}
        </div>

        <div className="pref-pagination">
          <button
            type="button"
            className="btn-icon-sm"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((prev) => prev - 1)}
            aria-label="Previous prompt"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="pagination-text">
            {activeIndex + 1} of {prompts.length}
          </span>
          <button
            type="button"
            className="btn-icon-sm"
            disabled={activeIndex === prompts.length - 1}
            onClick={() => setActiveIndex((prev) => prev + 1)}
            aria-label="Next prompt"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="prompt-box">
        <span className="prompt-label">Prompt:</span>
        <p className="prompt-text">&ldquo;{currentItem.prompt}&rdquo;</p>
      </div>

      <div className="responses-grid">
        <div
          className={`response-card ${currentItem.chosen === "A" ? "selected" : ""}`}
          onClick={() => updateCurrent("A", currentItem.reason || "")}
        >
          <div className="response-card-header">
            <span className="model-name">Response A ({currentItem.responseA.model})</span>
            <button
              type="button"
              className={`choice-btn ${currentItem.chosen === "A" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                updateCurrent("A", currentItem.reason || "");
              }}
            >
              <ThumbsUp size={14} /> Prefer A
            </button>
          </div>
          <pre className="response-content">{currentItem.responseA.text}</pre>
        </div>

        <div
          className={`response-card ${currentItem.chosen === "B" ? "selected" : ""}`}
          onClick={() => updateCurrent("B", currentItem.reason || "")}
        >
          <div className="response-card-header">
            <span className="model-name">Response B ({currentItem.responseB.model})</span>
            <button
              type="button"
              className={`choice-btn ${currentItem.chosen === "B" ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                updateCurrent("B", currentItem.reason || "");
              }}
            >
              <ThumbsUp size={14} /> Prefer B
            </button>
          </div>
          <pre className="response-content">{currentItem.responseB.text}</pre>
        </div>
      </div>

      <div className="preference-feedback-section">
        <div className="tie-selection-row">
          <span className="tie-text">Or if both responses are equally good / bad:</span>
          <button
            type="button"
            className={`btn-ghost btn-sm ${currentItem.chosen === "tie" ? "active" : ""}`}
            onClick={() => updateCurrent("tie", currentItem.reason || "")}
          >
            <Scale size={14} /> Mark as Tie
          </button>
        </div>

        <div className="reason-field">
          <label htmlFor="pref-reason-input" className="reason-label">
            <MessageSquare size={14} />
            <span>Justification / Reason for choice:</span>
          </label>
          <textarea
            id="pref-reason-input"
            className="input-textarea"
            rows={3}
            placeholder="Explain why you chose this response (e.g., accuracy, tone, formatting, adherence to instructions)..."
            value={currentItem.reason || ""}
            onChange={(e) => {
              const val = e.target.value;
              updateCurrent(currentItem.chosen || "A", val);
            }}
          />
        </div>
      </div>
    </div>
  );
};
