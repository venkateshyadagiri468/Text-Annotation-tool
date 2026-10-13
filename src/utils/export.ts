import type { Doc, Label } from "../types";

export interface ExportedAnnotation {
  id: string;
  start: number;
  end: number;
  labelId: string;
  labelName: string;
  text: string;
}

export interface ExportedDoc {
  id: string;
  title?: string;
  text: string;
  status: "pending" | "done";
  secondsSpent: number;
  annotations: ExportedAnnotation[];
}

export interface ExportPayload {
  version: string;
  exportedAt: string;
  labels: Label[];
  docs: ExportedDoc[];
}

/**
 * Prepares enriched JSON representation of documents with annotation entity text and label names.
 */
export function generateExportJsonData(docs: Doc[], labels: Label[]): ExportPayload {
  const labelMap = new Map<string, Label>(labels.map((l) => [l.id, l]));

  const enrichedDocs: ExportedDoc[] = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    text: doc.text,
    status: doc.status,
    secondsSpent: doc.secondsSpent,
    annotations: doc.annotations.map((ann) => {
      const label = labelMap.get(ann.labelId);
      return {
        id: ann.id,
        start: ann.start,
        end: ann.end,
        labelId: ann.labelId,
        labelName: label ? label.name : "UNKNOWN",
        text: doc.text.slice(ann.start, ann.end),
      };
    }),
  }));

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    labels,
    docs: enrichedDocs,
  };
}

/**
 * Returns formatted JSON string.
 */
export function exportToJson(docs: Doc[], labels: Label[]): string {
  const data = generateExportJsonData(docs, labels);
  return JSON.stringify(data, null, 2);
}

/**
 * Escapes a single CSV cell value according to RFC 4180.
 */
export function escapeCsvField(val: string | number): string {
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV string containing: doc_id,start,end,text,label.
 * One row per annotation.
 */
export function exportToCsv(docs: Doc[], labels: Label[]): string {
  const labelMap = new Map<string, Label>(labels.map((l) => [l.id, l]));
  const rows: string[] = ["doc_id,start,end,text,label"];

  for (const doc of docs) {
    for (const ann of doc.annotations) {
      const label = labelMap.get(ann.labelId);
      const labelName = label ? label.name : "UNKNOWN";
      const snippet = doc.text.slice(ann.start, ann.end);

      rows.push(
        [
          escapeCsvField(doc.id),
          escapeCsvField(ann.start),
          escapeCsvField(ann.end),
          escapeCsvField(snippet),
          escapeCsvField(labelName),
        ].join(",")
      );
    }
  }

  return rows.join("\r\n");
}

/**
 * Triggers a browser file download.
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  contentType: string
): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
