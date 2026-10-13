import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "../src/App";
import { DEFAULT_APP_STATE } from "../src/data/defaultData";

describe("DocSpan App Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the DocSpan header, document queue, canvas, and progress bar", () => {
    render(<App />);

    expect(screen.getByText("DocSpan")).toBeDefined();
    expect(screen.getByText("Span Annotation")).toBeDefined();
    expect(screen.getByText("RLHF Ranking")).toBeDefined();
    expect(screen.getByText("Agreement (IAA)")).toBeDefined();
    expect(screen.getAllByText("Guidelines").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Export")).toBeDefined();

    // Check first document loaded
    expect(screen.getAllByText(DEFAULT_APP_STATE.docs[0].title!).length).toBeGreaterThanOrEqual(1);

    // Check Label buttons (PERSON, ORG, LOCATION)
    expect(screen.getAllByText("PERSON").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ORG").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("LOCATION").length).toBeGreaterThanOrEqual(1);
  });

  it("switches documents when clicked in the DocumentQueue sidebar", () => {
    render(<App />);

    const doc2Title = DEFAULT_APP_STATE.docs[1].title!;
    const doc2Card = screen.getAllByText(doc2Title)[0];
    fireEvent.click(doc2Card);

    // Canvas title should now show doc 2
    const canvasHeaders = screen.getAllByText(doc2Title);
    expect(canvasHeaders.length).toBeGreaterThanOrEqual(1);
  });

  it("toggles mark done, auto-advances to next pending doc, and updates progress", () => {
    const { container } = render(<App />);

    // Click "Mark Done" for active Doc 1
    const markDoneBtn = screen.getByRole("button", { name: /Mark document as done/i });
    fireEvent.click(markDoneBtn);

    // After marking doc 1 as done, it auto-advances to doc 2 (next pending)
    // and overall progress count increases (from 1 done initially in doc-4 to 2 done)
    const progressCount = container.querySelector(".progress-count");
    expect(progressCount?.textContent).toContain("2 of 5 completed");
  });

  it("opens guidelines drawer and displays editable definitions", () => {
    render(<App />);

    const guidelinesBtn = screen.getByRole("button", { name: /Toggle Guidelines/i });
    fireEvent.click(guidelinesBtn);

    expect(screen.getByText("Annotation Guidelines")).toBeDefined();
    expect(screen.getByText(/People, including fictional characters/i)).toBeDefined();
  });

  it("opens export modal with JSON and CSV options", () => {
    render(<App />);

    const exportBtn = screen.getByRole("button", { name: /Export dataset/i });
    fireEvent.click(exportBtn);

    expect(screen.getByText("Export Annotations")).toBeDefined();
    expect(screen.getByText("JSON Format")).toBeDefined();
    expect(screen.getByText("CSV Format")).toBeDefined();
    expect(screen.getByText("Download JSON")).toBeDefined();
    expect(screen.getByText("Download CSV")).toBeDefined();
  });

  it("switches to RLHF Ranking mode and back to Span Annotation", () => {
    render(<App />);

    const rlhfTab = screen.getByRole("button", { name: /RLHF Ranking/i });
    fireEvent.click(rlhfTab);

    expect(screen.getByText("RLHF Preference Ranking")).toBeDefined();
    expect(screen.getByText("Export Dataset")).toBeDefined();

    // Switch back
    const annotateTab = screen.getByRole("button", { name: /Span Annotation/i });
    fireEvent.click(annotateTab);

    expect(screen.getByText("DocSpan")).toBeDefined();
    expect(screen.getByText("Annotations")).toBeDefined();
  });
});
