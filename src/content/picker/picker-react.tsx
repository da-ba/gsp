/**
 * React-based Picker UI - replaces vanilla JS picker.ts
 */

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { add, sub, clamp } from "../../utils/math.ts"
import { getCaretCoordinates } from "../../utils/dom.ts"
import type { PickerItem } from "../types.ts"
import type { Position } from "./types.ts"
import { state, resetPickerState } from "./state.ts"
import { applyPickerStyles } from "./styles.ts"
import { Picker, type PickerView } from "./components/Picker.tsx"
import type { ListItemData } from "./components/PickerList.tsx"

// React root for the picker
let pickerRoot: Root | null = null

// Current picker state for React rendering
export type ReactPickerState = {
  visible: boolean
  title: string
  subtitle: string
  view: PickerView
  position: Position
}

const reactState: ReactPickerState = {
  visible: false,
  title: "GitHub Slash Palette",
  subtitle: "Type a slash command",
  view: { type: "loading" },
  position: { left: 0, top: 0 },
}

// Callbacks for picker interactions
let currentImgUrlFn: (item: PickerItem) => string = (item) => item.previewUrl
let currentOnSelect: (item: PickerItem) => void = () => {}
let currentOnSuggestPick: (term: string) => void = () => {}
let currentOnSetupComplete: () => void = () => {}
let currentOnInputChange: (value: string) => void = () => {}
let currentOnInputSubmit: () => void = () => {}

/**
 * Re-render the React picker with current state
 */
function renderPicker(): void {
  if (!pickerRoot || !state.pickerEl) return

  pickerRoot.render(
    React.createElement(Picker, {
      visible: reactState.visible,
      title: reactState.title,
      subtitle: reactState.subtitle,
      view: reactState.view,
      selectedIndex: state.selectedIndex,
      imgUrlFn: currentImgUrlFn,
      onSelect: (item: PickerItem) => {
        const field = state.activeField
        // Capture activeCommand before onSelect as it may change via input event
        const wasCommandSelector = state.activeCommand === "gsp"
        currentOnSelect(item)
        // Don't hide picker if:
        // - settings view is currently being shown
        // - gsp command was active (command selector replaces text and triggers new command)
        if (!state.showingSettings && !wasCommandSelector) {
          hidePicker()
          if (field) {
            setTimeout(() => field.focus(), 0)
          }
        }
      },
      onHover: (index: number) => {
        state.selectedIndex = index
        renderPicker()
      },
      onSuggestPick: currentOnSuggestPick,
      onSettingsClick: () => {
        state.showingSettings = true
        reactState.view = { type: "settings" }
        renderPicker()
      },
      onSetupComplete: currentOnSetupComplete,
      onInputChange: (value: string) => {
        state.inputValue = value
        currentOnInputChange(value)
      },
      onInputSubmit: () => {
        currentOnInputSubmit()
      },
      position: reactState.position,
    })
  )
}

function getPickerMountForField(field?: HTMLElement | null): HTMLElement {
  if (!field) return document.body
  const mount = field.closest(
    [
      "details-dialog",
      "dialog",
      "[role='dialog']",
      ".Overlay",
      ".Popover",
      ".SelectMenu",
      ".SelectMenu-modal",
      ".details-overlay",
      "details",
    ].join(", ")
  ) as HTMLElement | null
  return mount || document.body
}

export function ensurePicker(field?: HTMLElement | null): HTMLElement {
  const mount = getPickerMountForField(field)

  if (state.pickerEl) {
    if (state.pickerEl.parentElement !== mount) mount.appendChild(state.pickerEl)
    return state.pickerEl
  }

  // Create container element for React
  const el = document.createElement("div")
  el.id = "slashPalettePickerContainer"

  // Keep textarea focus when selecting GIFs with the mouse
  const shouldPreventFocusSteal = (target: EventTarget | null): boolean => {
    const t = target as HTMLElement | null
    if (!t) return false
    const btn = t.closest("button") as HTMLButtonElement | null
    return !!(
      btn &&
      (btn.hasAttribute("data-item-index") ||
        btn.hasAttribute("data-suggest-chip") ||
        btn.hasAttribute("data-settings-btn") ||
        btn.hasAttribute("data-settings-action"))
    )
  }

  el.addEventListener(
    "pointerdown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault()
    },
    true
  )
  el.addEventListener(
    "mousedown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault()
    },
    true
  )

  // Stop bubbling events so GitHub's handlers don't interfere
  const stopBubble = (ev: Event) => {
    ev.stopPropagation()
  }
  el.addEventListener("click", stopBubble)
  el.addEventListener("mousedown", stopBubble)
  el.addEventListener("mouseup", stopBubble)

  el.addEventListener("mousedown", () => {
    state.mouseDownInPicker = true
  })
  el.addEventListener("mouseup", () => {
    state.mouseDownInPicker = false
  })

  mount.appendChild(el)
  state.pickerEl = el

  // Create React root
  pickerRoot = createRoot(el)
  renderPicker()

  return el
}

export function isPickerVisible(): boolean {
  return reactState.visible
}

export function showPicker(field?: HTMLElement | null): void {
  ensurePicker(field)
  reactState.visible = true
  renderPicker()
}

export function hidePicker(): void {
  if (!state.pickerEl) return
  reactState.visible = false
  reactState.view = { type: "loading" }
  renderPicker()
  resetPickerState()
}

export function clearBody(): void {
  ensurePicker()
  reactState.view = { type: "loading" }
  renderPicker()
}

export function setHeader(title: string, subtitle: string): void {
  ensurePicker()
  reactState.title = title || "GitHub Slash Palette"
  reactState.subtitle = subtitle || "Type a slash command"
  renderPicker()
}

export function renderMessage(msg: string): void {
  clearBody()
  reactState.view = { type: "message", message: msg }
  renderPicker()
}

export function renderLoadingSkeleton(): void {
  clearBody()
  reactState.view = { type: "loading" }
  renderPicker()
}

export function positionPickerAtCaret(field: HTMLTextAreaElement): void {
  ensurePicker(field)
  const rect = field.getBoundingClientRect()
  const caret = getCaretCoordinates(field, field.selectionStart || 0)

  let left = add(rect.left, caret.left)
  let top = add(rect.top, add(caret.top, add(caret.height, 10)))

  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const pickerWidth = 400
  const pickerHeight = 380

  const maxLeft = sub(sub(vw, pickerWidth), 10)
  if (left > maxLeft) left = maxLeft
  const minLeft = 10
  if (left < minLeft) left = minLeft

  const maxTop = sub(sub(vh, pickerHeight), 10)
  if (top > maxTop) {
    top = sub(add(rect.top, caret.top), add(pickerHeight, 10))
  }
  const minTop = 10
  if (top < minTop) top = minTop

  reactState.position = { left, top }
  renderPicker()
}

export function refreshSelectionStyles(): void {
  renderPicker()
}

export function scrollSelectedIntoView(): void {
  if (!state.pickerEl) return
  const btn = state.pickerEl.querySelector(`button[data-item-index="${state.selectedIndex}"]`)
  if (!btn) return
  btn.scrollIntoView({ block: "nearest", inline: "nearest" })
}

export function renderSuggestChips(
  items: string[],
  title: string,
  onPick: (term: string) => void
): void {
  // This is handled through the grid view now
  currentOnSuggestPick = onPick
}

export function renderGrid(
  items: PickerItem[],
  imgUrlFn: (item: PickerItem) => string,
  onPickItem: (item: PickerItem) => void,
  suggestTitle: string
): void {
  clearBody()

  state.currentItems = items
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)))

  currentImgUrlFn = imgUrlFn
  currentOnSelect = onPickItem
  currentOnSuggestPick = (term: string) => {
    const field = state.activeField
    if (field) {
      setSlashQueryInField(state.activeCommand, term)
    }
  }

  reactState.view = {
    type: "grid",
    items,
    suggestItems: state.suggestItems,
    suggestTitle,
  }
  renderPicker()
}

export function setSlashQueryInField(cmd: string, term: string): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const replacement = "/" + cmd + " " + term
  const newValue = value.slice(0, lineStart) + replacement + value.slice(pos)

  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

export function renderSetupPanel(
  renderFn: (bodyEl: HTMLElement, onComplete: () => void) => void,
  onComplete: () => void
): void {
  clearBody()
  currentOnSetupComplete = onComplete
  reactState.view = { type: "setup", renderFn }
  renderPicker()
}

export function moveSelectionGrid(dx: number, dy: number): void {
  const cols = state.cols
  const maxIdx = Math.max(0, sub(state.currentItems.length, 1))
  const row = Math.floor(state.selectedIndex / cols)
  const col = state.selectedIndex % cols
  const newRow = add(row, dy)
  const newCol = add(col, dx)
  let next = add(newRow * cols, newCol)
  next = clamp(next, 0, maxIdx)
  state.selectedIndex = next
  renderPicker()
  scrollSelectedIntoView()
}

/**
 * Move selection in list view (up/down only)
 */
export function moveSelectionList(dy: number): void {
  const maxIdx = Math.max(0, sub(state.currentItems.length, 1))
  let next = add(state.selectedIndex, dy)
  next = clamp(next, 0, maxIdx)
  state.selectedIndex = next
  renderPicker()
  scrollSelectedIntoView()
}

/**
 * Render a list view (for commands that don't need visual previews)
 */
export function renderList(
  items: PickerItem[],
  getItemData: (item: PickerItem) => ListItemData,
  onPickItem: (item: PickerItem) => void,
  options?: {
    title?: string
    showInput?: boolean
    inputPlaceholder?: string
    commandName?: string
    onInputChange?: (value: string) => void
    onInputSubmit?: () => void
  }
): void {
  clearBody()

  state.currentItems = items
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)))

  currentOnSelect = onPickItem
  currentOnInputChange = options?.onInputChange || (() => {})
  currentOnInputSubmit = options?.onInputSubmit || (() => {})

  reactState.view = {
    type: "list",
    items,
    getItemData,
    title: options?.title,
    showInput: options?.showInput,
    inputValue: state.inputValue,
    inputPlaceholder: options?.inputPlaceholder,
    commandName: options?.commandName,
  }
  renderPicker()
}

/**
 * Set the current input value (for input field in list view)
 */
export function setInputValue(value: string): void {
  state.inputValue = value
  // Update the view if it's a list view with input
  if (reactState.view.type === "list" && reactState.view.showInput) {
    reactState.view = {
      ...reactState.view,
      inputValue: value,
    }
    renderPicker()
  }
}

/**
 * Get the current input value
 */
export function getInputValue(): string {
  return state.inputValue
}

/**
 * Show the settings panel programmatically
 */
export function showSettings(): void {
  ensurePicker()
  state.showingSettings = true
  reactState.view = { type: "settings" }
  renderPicker()
}

// Re-export applyPickerStyles for use in content/index.ts
export { applyPickerStyles }
