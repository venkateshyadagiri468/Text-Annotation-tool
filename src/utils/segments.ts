import type { Annotation } from "../types";

export interface Segment {
  id: string;
  start: number;
  end: number;
  text: string;
  isAnnotated: boolean;
  annotation?: Annotation;
}

/**
 * Takes document text and annotations, sorts annotations by start offset,
 * and walks the text sequentially to yield alternating plain and annotated segments.
 * Each segment carries precise character offsets [start, end].
 */
export function getSegments(
  text: string,
  annotations: readonly Annotation[] = []
): Segment[] {
  if (!text || text.length === 0) {
    return [];
  }

  if (!annotations || annotations.length === 0) {
    return [
      {
        id: "plain-0",
        start: 0,
        end: text.length,
        text,
        isAnnotated: false,
      },
    ];
  }

  // Filter valid annotations within bounds and sort by start ascending
  const validAnnotations = [...annotations]
    .filter((a) => a.start >= 0 && a.end <= text.length && a.start < a.end)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const segments: Segment[] = [];
  let currentIndex = 0;

  for (const ann of validAnnotations) {
    // If annotation starts before currentIndex, it overlaps with a previous one: skip for rendering
    if (ann.start < currentIndex) {
      continue;
    }

    // Emit plain segment leading up to this annotation
    if (ann.start > currentIndex) {
      segments.push({
        id: `plain-${currentIndex}`,
        start: currentIndex,
        end: ann.start,
        text: text.slice(currentIndex, ann.start),
        isAnnotated: false,
      });
    }

    // Emit annotated segment
    segments.push({
      id: `ann-${ann.id}`,
      start: ann.start,
      end: ann.end,
      text: text.slice(ann.start, ann.end),
      isAnnotated: true,
      annotation: ann,
    });

    currentIndex = ann.end;
  }

  // Emit trailing plain text
  if (currentIndex < text.length) {
    segments.push({
      id: `plain-${currentIndex}`,
      start: currentIndex,
      end: text.length,
      text: text.slice(currentIndex),
      isAnnotated: false,
    });
  }

  return segments;
}
