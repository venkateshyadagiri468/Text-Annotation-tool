import { describe, it, expect } from "vitest";
import { computeSpanAgreement, interpretKappa } from "../src/utils/agreement";

describe("agreement utility", () => {
  it("computes 100% agreement and kappa=1.0 for identical annotations", () => {
    const dataA = {
      docs: [
        {
          id: "doc-1",
          text: "Sundar Pichai at Google in London",
          status: "done",
          secondsSpent: 10,
          annotations: [
            { id: "1", start: 0, end: 13, labelId: "l1", labelName: "PERSON", text: "Sundar Pichai" },
            { id: "2", start: 17, end: 23, labelId: "l2", labelName: "ORG", text: "Google" },
            { id: "3", start: 27, end: 33, labelId: "l3", labelName: "LOCATION", text: "London" },
          ],
        },
      ],
    };

    const dataB = JSON.parse(JSON.stringify(dataA));

    const report = computeSpanAgreement(dataA, dataB);
    expect(report.totalUniqueSpans).toBe(3);
    expect(report.exactMatches).toBe(3);
    expect(report.percentAgreement).toBe(100);
    expect(report.cohensKappa).toBe(1.0);
    expect(report.f1Score).toBe(1.0);
  });

  it("handles disagreement in label assignment on same span", () => {
    const dataA = {
      docs: [
        {
          id: "doc-1",
          text: "Apple released a phone",
          status: "done",
          secondsSpent: 10,
          annotations: [
            { id: "1", start: 0, end: 5, labelId: "l1", labelName: "ORG", text: "Apple" },
          ],
        },
      ],
    };

    const dataB = {
      docs: [
        {
          id: "doc-1",
          text: "Apple released a phone",
          status: "done",
          secondsSpent: 10,
          annotations: [
            { id: "1", start: 0, end: 5, labelId: "l2", labelName: "PRODUCT", text: "Apple" },
          ],
        },
      ],
    };

    const report = computeSpanAgreement(dataA, dataB);
    expect(report.totalUniqueSpans).toBe(1);
    expect(report.exactMatches).toBe(0);
    expect(report.percentAgreement).toBe(0);
    expect(report.cohensKappa).toBeLessThanOrEqual(0);
  });

  it("handles spans identified by only one annotator", () => {
    const dataA = {
      docs: [
        {
          id: "doc-1",
          text: "Sundar and Satya in Seattle",
          status: "done",
          secondsSpent: 10,
          annotations: [
            { id: "1", start: 0, end: 6, labelId: "l1", labelName: "PERSON", text: "Sundar" },
            { id: "2", start: 11, end: 16, labelId: "l1", labelName: "PERSON", text: "Satya" },
          ],
        },
      ],
    };

    const dataB = {
      docs: [
        {
          id: "doc-1",
          text: "Sundar and Satya in Seattle",
          status: "done",
          secondsSpent: 10,
          annotations: [
            { id: "1", start: 0, end: 6, labelId: "l1", labelName: "PERSON", text: "Sundar" },
            // Satya missed by B
          ],
        },
      ],
    };

    const report = computeSpanAgreement(dataA, dataB);
    expect(report.totalUniqueSpans).toBe(2);
    expect(report.exactMatches).toBe(1);
    expect(report.percentAgreement).toBe(50);
  });

  it("handles empty documents gracefully", () => {
    const dataA = { docs: [] };
    const dataB = { docs: [] };
    const report = computeSpanAgreement(dataA, dataB);
    expect(report.totalUniqueSpans).toBe(0);
    expect(report.percentAgreement).toBe(100);
  });

  it("interprets kappa ranges correctly", () => {
    expect(interpretKappa(-0.1)).toContain("Poor");
    expect(interpretKappa(0.15)).toContain("Slight");
    expect(interpretKappa(0.35)).toContain("Fair");
    expect(interpretKappa(0.55)).toContain("Moderate");
    expect(interpretKappa(0.75)).toContain("Substantial");
    expect(interpretKappa(0.95)).toContain("Almost perfect");
  });
});
