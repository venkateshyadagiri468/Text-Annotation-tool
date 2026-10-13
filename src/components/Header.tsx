import React from "react";
import {
  Tag,
  Scale,
  Download,
  BookOpen,
  RotateCcw,
  Sparkles,
  Layers,
  Menu,
  Sun,
  Moon,
  Keyboard,
} from "lucide-react";
import type { ToolMode } from "../types";

interface HeaderProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  onOpenExport: () => void;
  onOpenAgreement: () => void;
  onToggleGuidelines: () => void;
  isGuidelinesOpen: boolean;
  onResetData: () => void;
  onToggleSidebar: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenExport,
  onOpenAgreement,
  onToggleGuidelines,
  isGuidelinesOpen,
  onResetData,
  onToggleSidebar,
  theme,
  onToggleTheme,
  onOpenShortcuts,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="btn-icon sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle documents sidebar"
          title="Toggle sidebar"
        >
          <Menu size={16} />
        </button>

        <div className="brand-group">
          <div className="brand-logo-badge">
            <Tag size={15} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">DocSpan</h1>
            <span className="brand-subtitle">Text Annotation Tool</span>
          </div>
        </div>

        <nav className="mode-tabs" aria-label="Tool modes">
          <button
            type="button"
            className={`mode-tab ${currentMode === "annotate" ? "active" : ""}`}
            onClick={() => onSelectMode("annotate")}
            aria-current={currentMode === "annotate" ? "page" : undefined}
          >
            <Layers size={14} />
            <span>Span Annotation</span>
          </button>
          <button
            type="button"
            className={`mode-tab ${currentMode === "ranking" ? "active" : ""}`}
            onClick={() => onSelectMode("ranking")}
            aria-current={currentMode === "ranking" ? "page" : undefined}
          >
            <Sparkles size={14} />
            <span>RLHF Ranking</span>
          </button>
        </nav>
      </div>

      <div className="header-right">
        {currentMode === "annotate" && (
          <>
            <button
              type="button"
              className="btn-header"
              onClick={onOpenAgreement}
              title="Compute Inter-Annotator Agreement (Cohen's Kappa & Percent Agreement)"
              aria-label="Open Agreement modal"
            >
              <Scale size={14} />
              <span className="btn-label-desktop">Agreement (IAA)</span>
            </button>

            <button
              type="button"
              className={`btn-header ${isGuidelinesOpen ? "active" : ""}`}
              onClick={onToggleGuidelines}
              title="Annotation guidelines and label definitions"
              aria-label="Toggle Guidelines"
            >
              <BookOpen size={14} />
              <span className="btn-label-desktop">Guidelines</span>
            </button>

            <button
              type="button"
              className="btn-header btn-primary-header"
              onClick={onOpenExport}
              title="Export annotations as JSON or CSV"
              aria-label="Export dataset"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn-icon"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts guide (?)"
          aria-label="View keyboard shortcuts"
        >
          <Keyboard size={15} />
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button
          type="button"
          className="btn-icon"
          onClick={onResetData}
          title="Reset to default sample documents"
          aria-label="Reset to default documents"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};
