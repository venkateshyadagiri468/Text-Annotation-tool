import type { ExportedDoc } from "./export";

export interface SpanAgreementItem {
  docId: string;
  start: number;
  end: number;
  text: string;
  labelA?: string;
  labelB?: string;
  isMatch: boolean;
}

export interface LabelAgreementStats {
  label: string;
  annotatorACount: number;
  annotatorBCount: number;
  agreedCount: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface AgreementReport {
  totalUniqueSpans: number;
  exactMatches: number;
  percentAgreement: number; // 0 to 100
  cohensKappa: number; // -1 to 1
  kappaInterpretation: string;
  annotatorATotalSpans: number;
  annotatorBTotalSpans: number;
  f1Score: number;
  labelStats: LabelAgreementStats[];
  items: SpanAgreementItem[];
}

/**
 * Returns human-readable interpretation of Cohen's Kappa according to Landis & Koch (1977).
 */
export function interpretKappa(kappa: number): string {
  if (kappa < 0) return "Poor (Less than chance)";
  if (kappa <= 0.2) return "Slight agreement";
  if (kappa <= 0.4) return "Fair agreement";
  if (kappa <= 0.6) return "Moderate agreement";
  if (kappa <= 0.8) return "Substantial agreement";
  return "Almost perfect agreement";
}

/**
 * Normalizes input JSON data (handles either raw export payload or documents array).
 */
export function extractDocs(input: unknown): ExportedDoc[] {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid file content: must be a JSON object");
  }

  const obj = input as Record<string, unknown>;
  if (Array.isArray(obj.docs)) {
    return obj.docs as ExportedDoc[];
  }
  if (Array.isArray(obj)) {
    return obj as ExportedDoc[];
  }

  throw new Error("Invalid annotation export schema: missing 'docs' array");
}

/**
 * Computes span-level inter-annotator agreement and Cohen's Kappa between two export files.
 */
export function computeSpanAgreement(
  annotatorAData: unknown,
  annotatorBData: unknown
): AgreementReport {
  const docsA = extractDocs(annotatorAData);
  const docsB = extractDocs(annotatorBData);

  interface RawSpan {
    docId: string;
    start: number;
    end: number;
    text: string;
    labelA?: string;
    labelB?: string;
  }

  const spanKeyMap = new Map<string, RawSpan>();

  // Map Annotator A spans
  let totalSpansA = 0;
  for (const doc of docsA) {
    for (const ann of doc.annotations || []) {
      totalSpansA++;
      const key = `${doc.id}:${ann.start}:${ann.end}`;
      spanKeyMap.set(key, {
        docId: doc.id,
        start: ann.start,
        end: ann.end,
        text: ann.text || doc.text.slice(ann.start, ann.end),
        labelA: ann.labelName || "UNKNOWN",
      });
    }
  }

  // Map Annotator B spans
  let totalSpansB = 0;
  for (const doc of docsB) {
    for (const ann of doc.annotations || []) {
      totalSpansB++;
      const key = `${doc.id}:${ann.start}:${ann.end}`;
      const existing = spanKeyMap.get(key);
      if (existing) {
        existing.labelB = ann.labelName || "UNKNOWN";
      } else {
        spanKeyMap.set(key, {
          docId: doc.id,
          start: ann.start,
          end: ann.end,
          text: ann.text || doc.text.slice(ann.start, ann.end),
          labelB: ann.labelName || "UNKNOWN",
        });
      }
    }
  }

  const items: SpanAgreementItem[] = [];
  let exactMatches = 0;

  // Collect all unique labels involved
  const allLabelsSet = new Set<string>();
  const NONE_CATEGORY = "__NONE__";

  for (const span of spanKeyMap.values()) {
    const isMatch = Boolean(span.labelA && span.labelB && span.labelA === span.labelB);
    if (isMatch) exactMatches++;

    if (span.labelA) allLabelsSet.add(span.labelA);
    if (span.labelB) allLabelsSet.add(span.labelB);

    items.push({
      docId: span.docId,
      start: span.start,
      end: span.end,
      text: span.text,
      labelA: span.labelA,
      labelB: span.labelB,
      isMatch,
    });
  }

  const totalUniqueSpans = items.length;
  if (totalUniqueSpans === 0) {
    return {
      totalUniqueSpans: 0,
      exactMatches: 0,
      percentAgreement: 100,
      cohensKappa: 1.0,
      kappaInterpretation: "Perfect agreement (No spans)",
      annotatorATotalSpans: 0,
      annotatorBTotalSpans: 0,
      f1Score: 1.0,
      labelStats: [],
      items: [],
    };
  }

  const percentAgreement = (exactMatches / totalUniqueSpans) * 100;
  const f1Score =
    totalSpansA + totalSpansB > 0
      ? (2 * exactMatches) / (totalSpansA + totalSpansB)
      : 1.0;

  // Cohen's Kappa calculation on the universe of candidate spans
  // Categories: all observed labels + NONE_CATEGORY
  const categories = Array.from(allLabelsSet);
  categories.push(NONE_CATEGORY);

  // Build confusion matrix
  const matrix: Record<string, Record<string, number>> = {};
  for (const catA of categories) {
    matrix[catA] = {};
    for (const catB of categories) {
      matrix[catA][catB] = 0;
    }
  }

  for (const item of items) {
    const catA = item.labelA || NONE_CATEGORY;
    const catB = item.labelB || NONE_CATEGORY;
    matrix[catA][catB] = (matrix[catA][catB] || 0) + 1;
  }

  const N = totalUniqueSpans;
  let observedAgreementCount = 0;
  for (const cat of categories) {
    observedAgreementCount += matrix[cat][cat] || 0;
  }
  const Po = observedAgreementCount / N;

  // Expected chance agreement Pe = sum( (rowTotal / N) * (colTotal / N) )
  let Pe = 0;
  for (const cat of categories) {
    let rowSum = 0;
    let colSum = 0;
    for (const other of categories) {
      rowSum += matrix[cat][other] || 0;
      colSum += matrix[other][cat] || 0;
    }
    Pe += (rowSum / N) * (colSum / N);
  }

  let cohensKappa = 1.0;
  if (Pe < 1) {
    cohensKappa = (Po - Pe) / (1 - Pe);
  }

  // Bound kappa between -1 and 1
  cohensKappa = Math.max(-1, Math.min(1, Math.round(cohensKappa * 1000) / 1000));

  // Compute label-specific statistics
  const labelStats: LabelAgreementStats[] = Array.from(allLabelsSet)
    .sort()
    .map((label) => {
      const aCount = items.filter((i) => i.labelA === label).length;
      const bCount = items.filter((i) => i.labelB === label).length;
      const agreed = items.filter((i) => i.labelA === label && i.labelB === label).length;
      const precision = bCount > 0 ? agreed / bCount : 0;
      const recall = aCount > 0 ? agreed / aCount : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      return {
        label,
        annotatorACount: aCount,
        annotatorBCount: bCount,
        agreedCount: agreed,
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1: Math.round(f1 * 1000) / 1000,
      };
    });

  return {
    totalUniqueSpans,
    exactMatches,
    percentAgreement: Math.round(percentAgreement * 10) / 10,
    cohensKappa,
    kappaInterpretation: interpretKappa(cohensKappa),
    annotatorATotalSpans: totalSpansA,
    annotatorBTotalSpans: totalSpansB,
    f1Score: Math.round(f1Score * 1000) / 1000,
    labelStats,
    items,
  };
}
