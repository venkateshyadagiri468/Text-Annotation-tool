import { describe, it, expect } from "vitest";
import { getSegments } from "../src/utils/segments";
import type { Annotation } from "../src/types";

describe("getSegments", () => {
  it("returns empty array for empty string", () => {
    expect(getSegments("", [])).toEqual([]);
  });

  it("returns a single plain segment when there are no annotations", () => {
    const text = "Hello world";
    const segments = getSegments(text, []);
    expect(segments).toEqual([
      {
        id: "plain-0",
        start: 0,
        end: 11,
        text: "Hello world",
        isAnnotated: false,
      },
    ]);
  });

  it("handles a single annotation in the middle", () => {
    const text = "Hello world today";
    const annotations: Annotation[] = [
      { id: "a1", start: 6, end: 11, labelId: "l1" },
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({
      id: "plain-0",
      start: 0,
      end: 6,
      text: "Hello ",
      isAnnotated: false,
    });
    expect(segments[1]).toEqual({
      id: "ann-a1",
      start: 6,
      end: 11,
      text: "world",
      isAnnotated: true,
      annotation: annotations[0],
    });
    expect(segments[2]).toEqual({
      id: "plain-11",
      start: 11,
      end: 17,
      text: " today",
      isAnnotated: false,
    });
  });

  it("handles an annotation at the very start", () => {
    const text = "Apple is great";
    const annotations: Annotation[] = [
      { id: "a1", start: 0, end: 5, labelId: "l1" },
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(2);
    expect(segments[0].isAnnotated).toBe(true);
    expect(segments[0].text).toBe("Apple");
    expect(segments[1].isAnnotated).toBe(false);
    expect(segments[1].text).toBe(" is great");
  });

  it("handles an annotation at the very end", () => {
    const text = "Visit Tokyo";
    const annotations: Annotation[] = [
      { id: "a1", start: 6, end: 11, labelId: "l1" },
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe("Visit ");
    expect(segments[1].text).toBe("Tokyo");
  });

  it("handles back-to-back annotations with no plain gap", () => {
    const text = "San Francisco";
    const annotations: Annotation[] = [
      { id: "a1", start: 0, end: 3, labelId: "l1" },
      { id: "a2", start: 3, end: 13, labelId: "l2" },
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe("San");
    expect(segments[1].text).toBe(" Francisco");
  });

  it("sorts annotations if provided out of order", () => {
    const text = "A B C D";
    const annotations: Annotation[] = [
      { id: "a2", start: 4, end: 5, labelId: "l2" },
      { id: "a1", start: 0, end: 1, labelId: "l1" },
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(4);
    expect(segments[0].text).toBe("A");
    expect(segments[1].text).toBe(" B ");
    expect(segments[2].text).toBe("C");
    expect(segments[3].text).toBe(" D");
  });

  it("safely ignores overlapping second annotation during render walk", () => {
    const text = "Testing overlaps";
    const annotations: Annotation[] = [
      { id: "a1", start: 0, end: 7, labelId: "l1" },
      { id: "a2", start: 4, end: 12, labelId: "l2" }, // overlaps with a1
    ];
    const segments = getSegments(text, annotations);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe("Testing");
    expect(segments[1].text).toBe(" overlaps");
  });
});
