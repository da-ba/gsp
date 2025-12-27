/**
 * Main Picker Component
 */

import React from "react";
import { PickerHeader } from "./PickerHeader.tsx";
import { PickerHints } from "./PickerHints.tsx";
import { PickerFooter } from "./PickerFooter.tsx";
import { PickerGrid } from "./PickerGrid.tsx";
import { LoadingSkeleton } from "./LoadingSkeleton.tsx";
import { Message } from "./Message.tsx";
import { SettingsPanel } from "./SettingsPanel.tsx";
import { applyPickerStyles } from "../styles.ts";
import type { PickerItem } from "../../types.ts";
import type { Position } from "../types.ts";

export type PickerView =
  | { type: "loading" }
  | { type: "message"; message: string }
  | { type: "grid"; items: PickerItem[]; suggestItems?: string[]; suggestTitle?: string }
  | { type: "settings" }
  | { type: "setup"; renderFn: (bodyEl: HTMLElement, onComplete: () => void) => void };

export type PickerProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  view: PickerView;
  selectedIndex: number;
  imgUrlFn: (item: PickerItem) => string;
  onSelect: (item: PickerItem) => void;
  onHover: (index: number) => void;
  onSuggestPick: (term: string) => void;
  onSettingsClick: () => void;
  onSetupComplete: () => void;
  position: Position;
};

export function Picker({
  visible,
  title,
  subtitle,
  view,
  selectedIndex,
  imgUrlFn,
  onSelect,
  onHover,
  onSuggestPick,
  onSettingsClick,
  onSetupComplete,
  position,
}: PickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const setupBodyRef = React.useRef<HTMLDivElement>(null);

  // Apply picker styles on mount and theme changes
  React.useEffect(() => {
    if (containerRef.current) {
      applyPickerStyles(containerRef.current);
    }
  }, [visible]);

  // Handle setup panel rendering
  React.useEffect(() => {
    if (view.type === "setup" && setupBodyRef.current) {
      setupBodyRef.current.innerHTML = "";
      view.renderFn(setupBodyRef.current, onSetupComplete);
    }
  }, [view, onSetupComplete]);

  // Animate on show
  React.useEffect(() => {
    if (visible && containerRef.current) {
      try {
        containerRef.current.animate(
          [
            { opacity: 0, transform: "scale(0.98)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 120, fill: "both" }
        );
      } catch {
        // Animation not supported
      }
    }
  }, [visible]);

  if (!visible) return null;

  const renderBody = () => {
    switch (view.type) {
      case "loading":
        return <LoadingSkeleton />;
      case "message":
        return <Message message={view.message} />;
      case "grid":
        return (
          <PickerGrid
            items={view.items}
            selectedIndex={selectedIndex}
            imgUrlFn={imgUrlFn}
            onSelect={onSelect}
            onHover={onHover}
            suggestItems={view.suggestItems}
            suggestTitle={view.suggestTitle}
            onSuggestPick={onSuggestPick}
          />
        );
      case "settings":
        return <SettingsPanel />;
      case "setup":
        return (
          <div
            ref={setupBodyRef}
            style={{
              overflow: "auto",
              padding: "0 10px 10px 10px",
              flex: "1 1 auto",
              minHeight: 0,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      id="slashPalettePicker"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "380px",
        maxHeight: "380px",
        width: "400px",
        maxWidth: "400px",
        boxSizing: "border-box",
        position: "fixed",
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <PickerHeader title={title} subtitle={subtitle} onSettingsClick={onSettingsClick} />
      <PickerHints />
      {renderBody()}
      <PickerFooter />
    </div>
  );
}
