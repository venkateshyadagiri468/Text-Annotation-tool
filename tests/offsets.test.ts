import { describe, it, expect, beforeEach } from "vitest";
import {
  trimSelection,
  isOverlapping,
  findOverlappingAnnotation,
  getAbsoluteOffsetFromNode,
  getSelectionOffsets,
} from "../src/utils/offsets";
import type { Annotation } from "../src/types";

describe("offsets utility", () => {
  describe("trimSelection", () => {
    const text = "   Hello beautiful world!   ";

    it("trims leading and trailing whitespace", () => {
      const res = trimSelection(text, 0, 19); // "   Hello beautiful "
      expect(res).not.toBeNull();
      expect(res?.start).toBe(3);
      expect(res?.end).toBe(18);
      expect(res?.text).toBe("Hello beautiful");
    });

    it("preserves internal whitespace", () => {
      const res = trimSelection(text, 3, 18);
      expect(res).not.toBeNull();
      expect(res?.start).toBe(3);
      expect(res?.end).toBe(18);
      expect(res?.text).toBe("Hello beautiful");
    });

    it("returns null for selection consisting only of whitespace", () => {
      const res = trimSelection(text, 0, 3);
      expect(res).toBeNull();
    });

    it("returns null for inverted or zero-length range", () => {
      expect(trimSelection(text, 5, 5)).toBeNull();
      expect(trimSelection(text, 10, 5)).toBeNull();
    });

    it("clamps safely at text boundaries", () => {
      const res = trimSelection(text, 19, 100);
      expect(res).not.toBeNull();
      expect(res?.text).toBe("world!");
    });
  });

  describe("isOverlapping & findOverlappingAnnotation", () => {
    const existing: Annotation[] = [
      { id: "a1", start: 10, end: 20, labelId: "l1" },
      { id: "a2", start: 30, end: 40, labelId: "l2" },
    ];

    it("returns false for non-overlapping spans before", () => {
      expect(isOverlapping({ start: 0, end: 10 }, existing)).toBe(false);
    });

    it("returns false for adjacent spans (sharing exactly start/end edge)", () => {
      // [20, 30] is adjacent to [10, 20] and [30, 40]
      expect(isOverlapping({ start: 20, end: 30 }, existing)).toBe(false);
      expect(isOverlapping({ start: 40, end: 50 }, existing)).toBe(false);
    });

    it("detects partial overlap on right", () => {
      expect(isOverlapping({ start: 15, end: 25 }, existing)).toBe(true);
      expect(findOverlappingAnnotation({ start: 15, end: 25 }, existing)?.id).toBe("a1");
    });

    it("detects partial overlap on left", () => {
      expect(isOverlapping({ start: 5, end: 15 }, existing)).toBe(true);
      expect(findOverlappingAnnotation({ start: 5, end: 15 }, existing)?.id).toBe("a1");
    });

    it("detects complete superset enclosure", () => {
      expect(isOverlapping({ start: 5, end: 25 }, existing)).toBe(true);
      expect(findOverlappingAnnotation({ start: 5, end: 25 }, existing)?.id).toBe("a1");
    });

    it("detects complete subset enclosure", () => {
      expect(isOverlapping({ start: 12, end: 18 }, existing)).toBe(true);
      expect(findOverlappingAnnotation({ start: 12, end: 18 }, existing)?.id).toBe("a1");
    });

    it("honors ignoreId parameter", () => {
      expect(isOverlapping({ start: 12, end: 18 }, existing, "a1")).toBe(false);
    });
  });

  describe("DOM selection offset conversion (jsdom)", () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      document.body.innerHTML = "";
      container = document.createElement("div");
      container.innerHTML = `
        <span data-start="0">Hello </span>
        <span data-start="6" class="highlight">brave</span>
        <span data-start="11"> new world</span>
      `;
      document.body.appendChild(container);
    });

    it("resolves single segment offset correctly", () => {
      const firstSpan = container.children[0];
      const textNode = firstSpan.firstChild!;
      const offset = getAbsoluteOffsetFromNode(container, textNode, 2);
      expect(offset).toBe(2);
    });

    it("resolves offset in subsequent segment using data-start", () => {
      const secondSpan = container.children[1];
      const textNode = secondSpan.firstChild!;
      const offset = getAbsoluteOffsetFromNode(container, textNode, 3);
      // data-start=6 + 3 = 9
      expect(offset).toBe(9);
    });

    it("converts multi-segment DOM range selection and trims", () => {
      const fullText = "Hello brave new world";
      const span1Text = container.children[0].firstChild!;
      const span3Text = container.children[2].firstChild!;

      const range = document.createRange();
      range.setStart(span1Text, 0); // "Hello "
      range.setEnd(span3Text, 4); // " new" -> total: "Hello brave new"

      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);

      const result = getSelectionOffsets(container, fullText);
      expect(result).not.toBeNull();
      expect(result?.start).toBe(0);
      expect(result?.end).toBe(15);
      expect(result?.text).toBe("Hello brave new");
    });

    it("returns null when selection is outside container", () => {
      const outside = document.createElement("div");
      outside.textContent = "Outside text";
      document.body.appendChild(outside);

      const range = document.createRange();
      range.selectNodeContents(outside);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);

      const result = getSelectionOffsets(container, "Hello brave new world");
      expect(result).toBeNull();
    });
  });
});
