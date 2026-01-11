/**
 * React-based Picker UI - replaces vanilla JS picker.ts
 */

import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { add, sub, clamp } from "../../utils/math.ts"
import { getCaretCoordinates } from "../../utils/dom.ts"
import { isDarkMode } from "../../utils/theme.ts"
import type { PickerItem } from "../types.ts"
import type { Position } from "./types.ts"
import { state, resetPickerState, setPopoverFocus } from "./state.ts"
import { determinePopoverPriority } from "./github-commands.ts"
import type { PopoverFocus } from "./github-commands.ts"
import { applyPickerStyles } from "./styles.ts"
import { Picker, type PickerView } from "./components/Picker.tsx"

// React root for the picker
let pickerRoot: Root | null = null

// Current picker state for React rendering
export type ReactPickerState = {
  visible: boolean
  title: string
  subtitle: string
  view: PickerView
  position: Position
  focusedPopover: PopoverFocus
  githubPopoverVisible: boolean
}

const reactState: ReactPickerState = {
  visible: false,
  title: "Slash Palette",
  subtitle: "",
  view: { type: "loading" },
  position: { left: 0, top: 0 },
  focusedPopover: "slashPalette",
  githubPopoverVisible: false,
}

// Store the view before switching to settings so we can restore it
let viewBeforeSettings: PickerView | null = null

// Callbacks for picker interactions
let currentImgUrlFn: (item: PickerItem) => string = (item) => item.previewUrl
let currentOnSelect: (item: PickerItem) => void = () => {}
let currentOnSuggestPick: (term: string) => void = () => {}
let currentOnSetupComplete: () => void = () => {}

/**
 * Re-render the React picker with current state
 */
function renderPicker(): void {
  if (!pickerRoot || !state.pickerEl) return

  // Update GitHub popover dimming
  updateGitHubPopoverDimming()

  pickerRoot.render(
    React.createElement(Picker, {
      visible: reactState.visible,
      isDark: isDarkMode(),
      title: reactState.title,
      subtitle: reactState.subtitle,
      view: reactState.view,
      selectedIndex: state.selectedIndex,
      imgUrlFn: currentImgUrlFn,
      onSelect: (item: PickerItem) => {
        const field = state.activeField
        const isCommandsList = state.activeCommand === ""
        currentOnSelect(item)
        // Don't hide picker if settings view is currently being shown
        // or if selecting from the commands list (let input event switch to selected command's picker)
        if (!state.showingSettings && !isCommandsList) {
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
        // Store current view before switching to settings
        if (reactState.view.type !== "settings") {
          viewBeforeSettings = reactState.view
        }
        state.showingSettings = true
        reactState.view = { type: "settings" }
        renderPicker()
      },
      onCloseClick: () => {
        hidePicker()
      },
      onSettingsBackClick: () => {
        state.showingSettings = false
        // Restore the previous view if available
        if (viewBeforeSettings) {
          reactState.view = viewBeforeSettings
          viewBeforeSettings = null
        } else {
          reactState.view = { type: "loading" }
        }
        renderPicker()
      },
      onThemeChange: () => {
        // Re-render all picker components when theme changes
        // Use setTimeout to avoid re-rendering during an active render cycle
        setTimeout(() => renderPicker(), 0)
      },
      onSetupComplete: currentOnSetupComplete,
      position: reactState.position,
      focusedPopover: reactState.focusedPopover,
      githubPopoverVisible: reactState.githubPopoverVisible,
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

  // Keep textarea focus when interacting with the picker
  const shouldPreventFocusSteal = (target: EventTarget | null): boolean => {
    const t = target as HTMLElement | null
    if (!t) return false

    // When settings panel is showing, prevent focus steal for all buttons
    // This keeps the picker open when interacting with settings controls
    if (state.showingSettings) {
      const btn = t.closest("button") as HTMLButtonElement | null
      if (btn) return true
    }

    // For non-settings views, only prevent for specific interactive buttons
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

/**
 * Update which popover has focus based on query (context-aware priority)
 */
export function updateFocusForQuery(query: string): void {
  const priority = determinePopoverPriority(query)
  reactState.focusedPopover = priority
  state.focusedPopover = priority
  setPopoverFocus(priority)
  renderPicker()
}

/**
 * Handle Tab key to switch popover focus.
 * Returns true if the switch was handled (both popovers visible).
 */
export function switchPopoverFocus(): boolean {
  if (!reactState.githubPopoverVisible || !reactState.visible) {
    return false
  }

  const newFocus: PopoverFocus =
    reactState.focusedPopover === "slashPalette" ? "github" : "slashPalette"
  reactState.focusedPopover = newFocus
  state.focusedPopover = newFocus
  setPopoverFocus(newFocus)
  renderPicker()
  return true
}

/**
 * Check if both popovers are currently visible
 */
export function areBothPopoversVisible(): boolean {
  return reactState.visible && reactState.githubPopoverVisible
}

export function hidePicker(): void {
  if (!state.pickerEl) return
  reactState.visible = false
  reactState.view = { type: "loading" }
  viewBeforeSettings = null
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
  reactState.title = title || "Slash Palette"
  reactState.subtitle = subtitle || ""
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

/**
 * Get GitHub's native slash commands menu element if visible.
 */
export function getGitHubSlashMenuElement(): HTMLElement | null {
  const selectors = [
    "text-expander-menu[role='listbox']",
    ".suggester-container",
    ".slash-command-suggester",
    "markdown-toolbar + [role='listbox']",
    "[data-target='text-expander.menu']",
  ]

  for (const selector of selectors) {
    const el = document.querySelector(selector) as HTMLElement | null
    if (el && el.offsetParent !== null) {
      return el
    }
  }
  return null
}

// Style element for GitHub popover dimming
let githubDimStyleEl: HTMLStyleElement | null = null

/**
 * Update dimming styles on GitHub's popover based on focus state
 */
function updateGitHubPopoverDimming(): void {
  const githubMenu = getGitHubSlashMenuElement()
  const isGitHubVisible = githubMenu !== null

  // Update visibility state
  reactState.githubPopoverVisible = isGitHubVisible
  state.githubPopoverVisible = isGitHubVisible

  // Create style element if needed
  if (!githubDimStyleEl) {
    githubDimStyleEl = document.createElement("style")
    githubDimStyleEl.id = "slashPaletteGitHubDimStyle"
    document.head.appendChild(githubDimStyleEl)
  }

  if (!isGitHubVisible || !reactState.visible) {
    // No GitHub popover or our picker not visible - remove dimming
    githubDimStyleEl.textContent = ""
    return
  }

  // Apply dimming based on which popover has focus
  const githubSelectors = [
    "text-expander-menu[role='listbox']",
    ".suggester-container",
    ".slash-command-suggester",
    "[data-target='text-expander.menu']",
  ].join(", ")

  if (reactState.focusedPopover === "slashPalette") {
    // We have focus - dim GitHub's popover
    githubDimStyleEl.textContent = `
      ${githubSelectors} {
        opacity: 0.5 !important;
        transition: opacity 0.15s ease !important;
      }
    `
  } else {
    // GitHub has focus - remove dimming from GitHub
    githubDimStyleEl.textContent = `
      ${githubSelectors} {
        opacity: 1 !important;
        transition: opacity 0.15s ease !important;
      }
    `
  }
}

export function positionPickerAtCaret(field: HTMLTextAreaElement): void {
  ensurePicker(field)
  const rect = field.getBoundingClientRect()
  const caret = getCaretCoordinates(field, field.selectionStart || 0)

  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const pickerWidth = 320
  const pickerHeight = 320
  const gap = 8

  let left: number
  let top: number

  // Check if GitHub's native slash commands menu is visible
  const githubMenu = getGitHubSlashMenuElement()
  if (githubMenu) {
    // Position our picker next to GitHub's menu
    const githubRect = githubMenu.getBoundingClientRect()

    // Try to position to the right of GitHub's menu
    left = add(githubRect.right, gap)

    // If it doesn't fit on the right, position to the left
    if (add(left, pickerWidth) > sub(vw, 10)) {
      left = sub(githubRect.left, add(pickerWidth, gap))
    }

    // Align top with GitHub's menu
    top = githubRect.top
  } else {
    // Default: position at caret
    left = add(rect.left, caret.left)
    top = add(rect.top, add(caret.top, add(caret.height, gap)))
  }

  // Ensure picker stays within viewport bounds
  const maxLeft = sub(sub(vw, pickerWidth), 10)
  if (left > maxLeft) left = maxLeft
  const minLeft = 10
  if (left < minLeft) left = minLeft

  const maxTop = sub(sub(vh, pickerHeight), 10)
  if (top > maxTop) {
    // If GitHub menu exists, try to keep alignment; otherwise flip above caret
    if (githubMenu) {
      top = maxTop
    } else {
      top = sub(add(rect.top, caret.top), add(pickerHeight, gap))
    }
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
  state.cols = 3

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

export function renderList(
  items: PickerItem[],
  onPickItem: (item: PickerItem) => void,
  title?: string
): void {
  clearBody()

  state.currentItems = items
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)))
  state.cols = 1

  currentOnSelect = onPickItem

  reactState.view = {
    type: "list",
    items,
    title,
  }
  renderPicker()
}

export function setSlashQueryInField(cmd: string, term: string): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  // Guard against undefined values to prevent inserting "undefined" text
  const safeCmd = cmd ?? ""
  const safeTerm = term ?? ""

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const replacement = "/" + safeCmd + (safeTerm ? " " + safeTerm : "")
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
