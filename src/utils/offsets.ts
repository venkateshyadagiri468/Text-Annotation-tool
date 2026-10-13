import type { Annotation } from "../types";

export interface TrimmedSpan {
  start: number;
  end: number;
  text: string;
}

/**
 * Trims leading and trailing whitespace from character offsets based on the document text.
 * Returns null if the resulting span is empty or contains only whitespace.
 */
export function trimSelection(
  text: string,
  rawStart: number,
  rawEnd: number
): TrimmedSpan | null {
  if (rawStart < 0 || rawEnd <= rawStart || rawStart >= text.length) {
    return null;
  }

  const safeStart = Math.max(0, rawStart);
  const safeEnd = Math.min(text.length, rawEnd);

  if (safeStart >= safeEnd) {
    return null;
  }

  const slice = text.slice(safeStart, safeEnd);
  if (!slice.trim()) {
    return null;
  }

  const leadingWhitespaceMatch = slice.match(/^\s*/);
  const leadingSpaces = leadingWhitespaceMatch ? leadingWhitespaceMatch[0].length : 0;

  const trailingWhitespaceMatch = slice.match(/\s*$/);
  const trailingSpaces = trailingWhitespaceMatch ? trailingWhitespaceMatch[0].length : 0;

  const trimmedStart = safeStart + leadingSpaces;
  const trimmedEnd = safeEnd - trailingSpaces;

  if (trimmedStart >= trimmedEnd) {
    return null;
  }

  return {
    start: trimmedStart,
    end: trimmedEnd,
    text: text.slice(trimmedStart, trimmedEnd),
  };
}

/**
 * Checks if a candidate span overlaps with any existing annotations.
 * [A.start, A.end] and [B.start, B.end] overlap iff max(A.start, B.start) < min(A.end, B.end).
 * Adjacent spans (e.g. [0, 5] and [5, 10]) do NOT overlap.
 */
export function isOverlapping(
  candidate: { start: number; end: number },
  existing: readonly Annotation[],
  ignoreId?: string
): boolean {
  return existing.some((ann) => {
    if (ignoreId && ann.id === ignoreId) return false;
    return Math.max(candidate.start, ann.start) < Math.min(candidate.end, ann.end);
  });
}

/**
 * Finds the first overlapping annotation, if any exists.
 */
export function findOverlappingAnnotation(
  candidate: { start: number; end: number },
  existing: readonly Annotation[],
  ignoreId?: string
): Annotation | undefined {
  return existing.find((ann) => {
    if (ignoreId && ann.id === ignoreId) return false;
    return Math.max(candidate.start, ann.start) < Math.min(candidate.end, ann.end);
  });
}

/**
 * Resolves the absolute character offset of a DOM node and offset relative to the document text,
 * by traversing up to the enclosing element with data-start and adding the intra-segment offset.
 */
export function getAbsoluteOffsetFromNode(
  containerEl: HTMLElement,
  node: Node,
  offset: number
): number | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  const segmentEl = el?.closest("[data-start]") as HTMLElement | null;

  if (!segmentEl || !containerEl.contains(segmentEl)) {
    return null;
  }

  const baseAttr = segmentEl.getAttribute("data-start");
  if (baseAttr === null) return null;

  const baseStart = parseInt(baseAttr, 10);
  if (Number.isNaN(baseStart)) return null;

  let intraOffset = 0;

  if (node.nodeType === Node.TEXT_NODE) {
    let curr = node.previousSibling;
    while (curr) {
      intraOffset += curr.textContent?.length || 0;
      curr = curr.previousSibling;
    }
    intraOffset += offset;
  } else if (node === segmentEl) {
    for (let i = 0; i < offset && i < segmentEl.childNodes.length; i++) {
      intraOffset += segmentEl.childNodes[i].textContent?.length || 0;
    }
  }

  return baseStart + intraOffset;
}

/**
 * Reads window.getSelection(), converts range to absolute offsets within containerEl,
 * handles multi-segment selections, and trims whitespace.
 */
export function getSelectionOffsets(
  containerEl: HTMLElement | null,
  docText: string
): TrimmedSpan | null {
  if (!containerEl || !docText) return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!containerEl.contains(range.startContainer) || !containerEl.contains(range.endContainer)) {
    return null;
  }

  const startAbs = getAbsoluteOffsetFromNode(containerEl, range.startContainer, range.startOffset);
  const endAbs = getAbsoluteOffsetFromNode(containerEl, range.endContainer, range.endOffset);

  if (startAbs === null || endAbs === null) {
    return null;
  }

  const rawStart = Math.min(startAbs, endAbs);
  const rawEnd = Math.max(startAbs, endAbs);

  return trimSelection(docText, rawStart, rawEnd);
}
