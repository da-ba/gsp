/**
 * Main Picker Component - SolidJS version
 */

import { Show, onMount, createEffect } from "solid-js"
import { PickerHeader } from "./PickerHeader.tsx"
import { PickerHints } from "./PickerHints.tsx"
import { PickerFooter } from "./PickerFooter.tsx"
import { PickerGrid } from "./PickerGrid.tsx"
import { LoadingSkeleton } from "./LoadingSkeleton.tsx"
import { Message } from "./Message.tsx"
import { SettingsPanel } from "./SettingsPanel.tsx"
import { applyPickerStyles } from "../styles.ts"
import type { PickerItem } from "../../types.ts"
import type { Position } from "../types.ts"

export type PickerView =
  | { type: "loading" }
  | { type: "message"; message: string }
  | { type: "grid"; items: PickerItem[]; suggestItems?: string[]; suggestTitle?: string }
  | { type: "settings" }
  | { type: "setup"; renderFn: (bodyEl: HTMLElement, onComplete: () => void) => void }

export type PickerProps = {
  visible: boolean
  title: string
  subtitle: string
  view: PickerView
  selectedIndex: number
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  onSuggestPick: (term: string) => void
  onSettingsClick: () => void
  onSetupComplete: () => void
  position: Position
}

export function Picker(props: PickerProps) {
  let containerRef: HTMLDivElement | undefined
  let setupBodyRef: HTMLDivElement | undefined

  // Apply picker styles on mount
  onMount(() => {
    if (containerRef) {
      applyPickerStyles(containerRef)
      // Animate on show
      try {
        containerRef.animate(
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
  })

  // Handle setup panel rendering
  createEffect(() => {
    if (props.view.type === "setup" && setupBodyRef) {
      setupBodyRef.innerHTML = ""
      props.view.renderFn(setupBodyRef, props.onSetupComplete)
    }
  })

  const renderBody = () => {
    switch (props.view.type) {
      case "loading":
        return <LoadingSkeleton />
      case "message":
        return <Message message={props.view.message} />
      case "grid":
        return (
          <PickerGrid
            items={props.view.items}
            selectedIndex={props.selectedIndex}
            imgUrlFn={props.imgUrlFn}
            onSelect={props.onSelect}
            onHover={props.onHover}
            suggestItems={props.view.suggestItems}
            suggestTitle={props.view.suggestTitle}
            onSuggestPick={props.onSuggestPick}
          />
        )
      case "settings":
        return <SettingsPanel />
      case "setup":
        return (
          <div
            ref={setupBodyRef}
            style={{
              overflow: "auto",
              padding: "0 10px 10px 10px",
              flex: "1 1 auto",
              "min-height": "0",
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <Show when={props.visible}>
      <div
        ref={containerRef}
        id="slashPalettePicker"
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "380px",
          "max-height": "380px",
          width: "400px",
          "max-width": "400px",
          "box-sizing": "border-box",
          position: "fixed",
          left: `${props.position.left}px`,
          top: `${props.position.top}px`,
        }}
      >
        <PickerHeader
          title={props.title}
          subtitle={props.subtitle}
          onSettingsClick={props.onSettingsClick}
        />
        <PickerHints />
        {renderBody()}
        <PickerFooter />
      </div>
    </Show>
  )
}
