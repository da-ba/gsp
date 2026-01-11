/**
 * Main Picker Component
 */

import React from "react"
import { PickerHeader } from "./PickerHeader.tsx"
import { PickerGrid } from "./PickerGrid.tsx"
import { PickerList } from "./PickerList.tsx"
import { LoadingSkeleton } from "./LoadingSkeleton.tsx"
import { Message } from "./Message.tsx"
import { SettingsPanel } from "./SettingsPanel.tsx"
import { applyPickerStyles } from "../styles.ts"
import type { PickerItem } from "../../types.ts"
import type { Position } from "../types.ts"
import type { PopoverFocus } from "../github-commands.ts"
import { getOtherPopoverName } from "../github-commands.ts"

export type PickerView =
  | { type: "loading" }
  | { type: "message"; message: string }
  | { type: "grid"; items: PickerItem[]; suggestItems?: string[]; suggestTitle?: string }
  | { type: "list"; items: PickerItem[]; title?: string }
  | { type: "settings" }
  | { type: "setup"; renderFn: (bodyEl: HTMLElement, onComplete: () => void) => void }

export type PickerProps = {
  visible: boolean
  isDark: boolean
  title: string
  subtitle: string
  view: PickerView
  selectedIndex: number
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  onSuggestPick: (term: string) => void
  onSettingsClick: () => void
  onCloseClick: () => void
  onSettingsBackClick: () => void
  onThemeChange: () => void
  onSetupComplete: () => void
  position: Position
  focusedPopover: PopoverFocus
  githubPopoverVisible: boolean
}

export function Picker({
  visible,
  isDark,
  title,
  subtitle,
  view,
  selectedIndex,
  imgUrlFn,
  onSelect,
  onHover,
  onSuggestPick,
  onSettingsClick,
  onCloseClick,
  onSettingsBackClick,
  onThemeChange,
  onSetupComplete,
  position,
  focusedPopover,
  githubPopoverVisible,
}: PickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const setupBodyRef = React.useRef<HTMLDivElement>(null)

  // Apply picker styles on mount and theme changes
  React.useEffect(() => {
    if (containerRef.current) {
      applyPickerStyles(containerRef.current)
    }
  }, [visible, isDark])

  // Handle setup panel rendering
  React.useEffect(() => {
    if (view.type === "setup" && setupBodyRef.current) {
      setupBodyRef.current.innerHTML = ""
      view.renderFn(setupBodyRef.current, onSetupComplete)
    }
  }, [view, onSetupComplete])

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
        )
      } catch {
        // Animation not supported
      }
    }
  }, [visible])

  if (!visible) return null

  // Determine if we should show the focus hint
  const showFocusHint = githubPopoverVisible && view.type !== "settings"
  const otherPopoverName = getOtherPopoverName(focusedPopover)

  // Determine opacity based on focus state
  const isUnfocused = githubPopoverVisible && focusedPopover !== "slashPalette"

  const renderBody = () => {
    switch (view.type) {
      case "loading":
        return <LoadingSkeleton />
      case "message":
        return <Message message={view.message} />
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
        )
      case "list":
        return (
          <PickerList
            items={view.items}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
            title={view.title}
          />
        )
      case "settings":
        return <SettingsPanel onBackClick={onSettingsBackClick} onThemeChange={onThemeChange} />
      case "setup":
        return (
          <div
            ref={setupBodyRef}
            style={{
              overflow: "auto",
              padding: "12px",
              flex: "1 1 auto",
              minHeight: 0,
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={containerRef}
      id="slashPalettePicker"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "auto",
        maxHeight: "320px",
        width: "320px",
        maxWidth: "320px",
        boxSizing: "border-box",
        position: "fixed",
        left: `${position.left}px`,
        top: `${position.top}px`,
        opacity: isUnfocused ? 0.5 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <PickerHeader
        title={title}
        subtitle={subtitle}
        onSettingsClick={onSettingsClick}
        onCloseClick={onCloseClick}
      />
      {renderBody()}
      {showFocusHint && (
        <div
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            color: isDark ? "#8b949e" : "#57606a",
            backgroundColor: isDark ? "rgba(33, 38, 45, 0.8)" : "rgba(246, 248, 250, 0.8)",
            borderTop: `1px solid ${isDark ? "#30363d" : "#d0d7de"}`,
            textAlign: "center",
            borderBottomLeftRadius: "6px",
            borderBottomRightRadius: "6px",
          }}
        >
          <kbd
            style={{
              display: "inline-block",
              padding: "2px 5px",
              fontSize: "10px",
              fontFamily:
                "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
              lineHeight: 1,
              color: isDark ? "#c9d1d9" : "#24292f",
              backgroundColor: isDark ? "#161b22" : "#f6f8fa",
              border: `1px solid ${isDark ? "#30363d" : "#d0d7de"}`,
              borderRadius: "3px",
              boxShadow: isDark ? "inset 0 -1px 0 #21262d" : "inset 0 -1px 0 #d0d7de",
              marginRight: "4px",
            }}
          >
            Tab
          </kbd>
          <span>Switch to {otherPopoverName}</span>
        </div>
      )}
    </div>
  )
}
