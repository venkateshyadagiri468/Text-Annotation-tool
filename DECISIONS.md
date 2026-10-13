# Architectural & Design Decisions (DECISIONS.md)

This document outlines the core architectural choices and design trade-offs made while developing **DocSpan**.

---

### 1. Pure Segment Walker vs `contentEditable`

- **Decision**: Render document text by sorting annotations by start offset and walking from index `0` to `text.length`, emitting alternating plain and `<mark>` segments. Avoid `contentEditable`.
- **Rationale**: `contentEditable` introduces dirty browser HTML (spurious `<div>`, `<br>`, and nested `<span>` elements) across different browsers, corrupting character counts. By rendering immutable text using pure React elements carrying `data-start` attributes, the raw text is guaranteed to remain pristine and deterministic.

---

### 2. DOM Selection to Absolute Offset Mapping

- **Decision**: On `mouseup` / `keyup`, read `window.getSelection()`, locate the closest enclosing element with `data-start`, and compute intra-segment offsets.
- **Rationale**: 
  - Standard DOM selection returns relative offsets inside the innermost `TextNode`. When text is split across multiple segments (plain text and highlighted spans), naive offset queries fail.
  - Adding `data-start` to each segment provides an anchor. The algorithm finds the absolute offset as `data-start + intraSegmentOffset`, easily handles selections starting in one segment and ending in another, and trims extraneous whitespace before committing the span.

---

### 3. Flat Annotations & Overlap Invariant

- **Decision**: Enforce a strict non-overlapping rule: `max(A.start, B.start) < min(A.end, B.end)`.
- **Rationale**:
  - Most downstream NER pipelines (spaCy, BERT-based token classifiers, BIO/BILOU tagging schemes) require flat, non-overlapping spans.
  - Allowing arbitrary overlapping spans complicates rendering (requiring interval trees and fragmented split tags) and degrades user clarity. We reject overlaps with a clear, empathetic inline message.

---

### 4. Single-Source State & Bounded Undo History

- **Decision**: Manage application state with `useReducer` in `src/state/reducer.ts` paired with a 50-action circular history stack for `Ctrl+Z` undo.
- **Rationale**:
  - Encapsulating mutations into pure reducer actions (`ADD_ANNOTATION`, `REMOVE_ANNOTATION`, `UNDO`, `MARK_DONE`, `ADD_LABEL`, `TICK_TIMER`) ensures predictable state transitions and makes unit testing straightforward.
  - Storing inverse actions in history allows immediate restoration of deleted spans and rollback of erroneous tags.

---

### 5. Resilient LocalStorage Storage Adapter

- **Decision**: Protect all `localStorage` access with type guards and try/catch blocks in `src/state/storage.ts`.
- **Rationale**: Browser storage can become corrupted, clear between sessions, or hit quota limits in private browsing modes. If stored JSON is malformed, DocSpan logs a warning and falls back to `sample-docs.json` without crashing the application.

---

### 6. Humanized Editorial Aesthetics vs "Vibecoded" AI Tropes

- **Decision**: Move away from monolithic neon dark themes and clinical dashboard styles to an authentic, humanized editorial reading experience.
- **Rationale**:
  - Annotation is fundamentally an act of reading comprehension. Reading high-volume text on harsh neon backgrounds causes rapid visual fatigue.
  - We implemented a warm, paper-inspired light mode as default (alongside an obsidian dark mode), comfortable 17-18px body typography with 1.85 line-height, felt-marker highlighter aesthetics, friendly conversational feedback, and a keyboard shortcuts modal.

---

### 7. Inter-Annotator Agreement (Cohen's Kappa & Percent Agreement)

- **Decision**: Model IAA at the span boundary level across the union of unique spans identified by Annotator A and Annotator B.
- **Rationale**:
  - In NER, span-level agreement is the standard benchmark.
  - When annotator A labels a span that annotator B missed, treating the absence as an explicit `__NONE__` category ensures that chance agreement ($P_e$) and observed agreement ($P_o$) accurately penalize false positives and false negatives, producing an authentic Cohen's Kappa score ($\kappa = \frac{P_o - P_e}{1 - P_e}$).
