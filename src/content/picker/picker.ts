/**
 * Vanilla DOM Picker UI
 *
 * Uses CSS classes from picker-css.ts for styling.
 * Theme switching is done by toggling the "sp-dark" class on the container.
 */

import { add, sub, clamp } from "../../utils/math.ts"
import { getCaretCoordinates } from "../../utils/dom.ts"
import { isDarkMode, setThemeOverride, fontSystemUi, fontSansSerif } from "../../utils/theme.ts"
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../../utils/storage.ts"
import type { PickerItem } from "../types.ts"
import type { Position } from "./types.ts"
import { state, resetPickerState } from "./state.ts"
import { getOptionsSections } from "../commands/options-registry.ts"
import { COMMAND_PREFIX } from "../../utils/command-prefix.ts"
import { injectPickerCSS } from "./picker-css.ts"

// --- SVG icons ---

const SETTINGS_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>`

const CLOSE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/></svg>`

const BACK_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/></svg>`

// --- Types ---

type PickerViewType = "loading" | "message" | "grid" | "list" | "settings" | "setup"

// --- State ---

let visible = false
let title = "Slash Palette"
let subtitle = ""
let position: Position = { left: 0, top: 0 }
let viewType: PickerViewType = "loading"
let viewBeforeSettings: PickerViewType | null = null

// Grid/List view state
let currentViewItems: PickerItem[] = []
let currentImgUrlFn: (item: PickerItem) => string = (item) => item.previewUrl
let currentOnSelect: (item: PickerItem) => void = () => {}
let currentSuggestItems: string[] = []
let currentSuggestTitle = ""
let currentOnSuggestPick: (term: string) => void = () => {}
let currentListTitle: string | undefined = undefined
let currentMessageText = ""
let currentSetupRenderFn: ((bodyEl: HTMLElement, onComplete: () => void) => void) | null = null
let currentOnSetupComplete: () => void = () => {}

// DOM elements
let pickerInner: HTMLElement | null = null
let headerTitleEl: HTMLElement | null = null
let headerSubEl: HTMLElement | null = null
let bodyEl: HTMLElement | null = null

// --- Helpers ---

function ce<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  }
  return e
}

function updateThemeClass(): void {
  if (!state.pickerEl) return
  state.pickerEl.classList.toggle("sp-dark", isDarkMode())
}

// --- Build the picker DOM ---

function buildPickerInner(): HTMLElement {
  const container = ce("div", undefined, { id: "slashPalettePicker" })
  container.style.left = `${position.left}px`
  container.style.top = `${position.top}px`
  container.style.fontFamily = fontSystemUi() + ", " + fontSansSerif()

  // --- Header ---
  const header = ce("div", "sp-header")

  const headerLeft = ce("div", "sp-header-left")
  const prefix = ce("span", "sp-header-prefix")
  prefix.textContent = "//"
  headerLeft.appendChild(prefix)

  headerTitleEl = ce("span", "sp-header-title")
  headerTitleEl.textContent = title
  headerLeft.appendChild(headerTitleEl)
  header.appendChild(headerLeft)

  const headerRight = ce("div", "sp-header-right")

  headerSubEl = ce("span", "sp-header-subtitle")
  headerSubEl.textContent = subtitle
  headerRight.appendChild(headerSubEl)

  const settingsBtn = ce("button", "sp-icon-btn", {
    type: "button",
    title: "Settings",
    "data-settings-btn": "true",
  })
  settingsBtn.innerHTML = SETTINGS_ICON_SVG
  settingsBtn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    handleSettingsClick()
  })
  headerRight.appendChild(settingsBtn)

  const closeBtn = ce("button", "sp-icon-btn", {
    type: "button",
    title: "Close",
    "data-settings-btn": "true",
  })
  closeBtn.innerHTML = CLOSE_ICON_SVG
  closeBtn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    handleCloseClick()
  })
  headerRight.appendChild(closeBtn)

  header.appendChild(headerRight)
  container.appendChild(header)

  // --- Body ---
  bodyEl = ce("div")
  container.appendChild(bodyEl)

  return container
}

// --- Render body views ---

function renderBodyContent(): void {
  if (!bodyEl) return
  bodyEl.innerHTML = ""

  switch (viewType) {
    case "loading":
      bodyEl.appendChild(buildLoadingSkeleton())
      break
    case "message":
      bodyEl.appendChild(buildMessage(currentMessageText))
      break
    case "grid":
      bodyEl.appendChild(
        buildGridView(
          currentViewItems,
          currentImgUrlFn,
          currentSuggestItems,
          currentSuggestTitle,
          currentOnSuggestPick
        )
      )
      break
    case "list":
      bodyEl.appendChild(buildListView(currentViewItems, currentListTitle))
      break
    case "settings":
      bodyEl.appendChild(buildSettingsPanel())
      break
    case "setup":
      bodyEl.appendChild(buildSetupPanel())
      break
  }
}

function buildLoadingSkeleton(): HTMLElement {
  const wrapper = ce("div", "sp-body-scroll")
  const grid = ce("div", "sp-grid")
  for (let i = 0; i < 9; i++) {
    grid.appendChild(ce("div", "sp-skeleton"))
  }
  wrapper.appendChild(grid)
  return wrapper
}

function buildMessage(msg: string): HTMLElement {
  const wrapper = ce("div", "sp-body-pad")
  const card = ce("div", "sp-card sp-message")
  card.textContent = msg
  wrapper.appendChild(card)
  return wrapper
}

function buildGridItem(
  item: PickerItem,
  index: number,
  imgUrlFn: (item: PickerItem) => string
): HTMLButtonElement {
  const selected = index === state.selectedIndex
  const btn = ce("button", "sp-grid-item", {
    type: "button",
    "data-item-index": String(index),
    "aria-selected": String(selected),
  })

  const img = ce("img", undefined, { src: imgUrlFn(item), alt: "item" })
  btn.appendChild(img)

  btn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    handleItemSelect(item)
  })
  btn.addEventListener("mouseenter", () => {
    state.selectedIndex = index
    refreshSelection()
  })

  return btn
}

function buildSuggestChips(
  items: string[],
  chipTitle: string,
  onPick: (term: string) => void
): HTMLElement {
  const wrapper = ce("div", "sp-chips")

  if (chipTitle) {
    const titleEl = ce("div", "sp-section-title")
    titleEl.textContent = chipTitle
    wrapper.appendChild(titleEl)
  }

  items.slice(0, 8).forEach((term) => {
    const chip = ce("button", "sp-chip", { type: "button", "data-suggest-chip": "true" })
    chip.textContent = term
    chip.addEventListener("click", (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      onPick(term)
    })
    wrapper.appendChild(chip)
  })

  return wrapper
}

function buildGridView(
  items: PickerItem[],
  imgUrlFn: (item: PickerItem) => string,
  suggestItems: string[],
  suggestTitle: string,
  onSuggestPick: (term: string) => void
): HTMLElement {
  const wrapper = ce("div", "sp-body-scroll")

  if (suggestItems.length > 0) {
    wrapper.appendChild(buildSuggestChips(suggestItems, suggestTitle, onSuggestPick))
  } else if (suggestTitle) {
    const titleEl = ce("div", "sp-section-title")
    titleEl.textContent = suggestTitle
    wrapper.appendChild(titleEl)
  }

  const grid = ce("div", "sp-grid")
  items.forEach((item, idx) => {
    grid.appendChild(buildGridItem(item, idx, imgUrlFn))
  })
  wrapper.appendChild(grid)
  return wrapper
}

function buildListItem(item: PickerItem, index: number): HTMLButtonElement {
  const selected = index === state.selectedIndex
  const btn = ce("button", "sp-list-item", {
    type: "button",
    "data-item-index": String(index),
    "aria-selected": String(selected),
  })

  if (item.icon) {
    const iconSpan = ce("span", "sp-list-item-icon")
    iconSpan.textContent = item.icon
    btn.appendChild(iconSpan)
  }

  const textContainer = ce("div", "sp-list-item-text")

  const titleSpan = ce("span", "sp-list-item-title")
  titleSpan.textContent = item.title || item.id
  textContainer.appendChild(titleSpan)

  if (item.subtitle) {
    const subSpan = ce("span", "sp-list-item-subtitle")
    subSpan.textContent = item.subtitle
    textContainer.appendChild(subSpan)
  }

  btn.appendChild(textContainer)

  btn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    handleItemSelect(item)
  })
  btn.addEventListener("mouseenter", () => {
    state.selectedIndex = index
    refreshSelection()
  })

  return btn
}

function buildListView(items: PickerItem[], listTitle?: string): HTMLElement {
  const wrapper = ce("div", "sp-body-list")

  if (listTitle) {
    const titleEl = ce("div", "sp-list-section-title")
    titleEl.textContent = listTitle
    wrapper.appendChild(titleEl)
  }

  const list = ce("div", "sp-list")
  items.forEach((item, idx) => {
    list.appendChild(buildListItem(item, idx))
  })
  wrapper.appendChild(list)
  return wrapper
}

function buildSettingsPanel(): HTMLElement {
  const wrapper = ce("div", "sp-body-pad")

  // Back button
  const backRow = ce("div", undefined)
  backRow.style.marginBottom = "10px"
  const backBtn = ce("button", "sp-back-btn", {
    type: "button",
    "data-settings-action": "true",
    title: "Back",
  })
  backBtn.innerHTML = BACK_ICON_SVG + " Back"
  backBtn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    handleSettingsBackClick()
  })
  backRow.appendChild(backBtn)
  wrapper.appendChild(backRow)

  // Card
  const card = ce("div", "sp-settings-card")

  // Theme section
  const themeSection = ce("div")
  themeSection.style.display = "flex"
  themeSection.style.flexDirection = "column"
  themeSection.style.gap = "8px"

  const themeLabel = ce("div", "sp-settings-label")
  themeLabel.textContent = "Theme"
  themeSection.appendChild(themeLabel)

  const themeRow = ce("div", "sp-theme-row")
  const themes: { value: ThemePreference; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ]

  getThemePreference().then((currentTheme) => {
    themes.forEach(({ value, label }) => {
      const btn = ce("button", "sp-badge-btn", { type: "button", "data-settings-action": "true" })
      btn.textContent = label
      if (value === currentTheme) {
        btn.style.opacity = "1"
        btn.style.fontWeight = "600"
      }
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        await setThemePreference(value)
        setThemeOverride(value)
        setTimeout(() => render(), 0)
      })
      themeRow.appendChild(btn)
    })
  })

  themeSection.appendChild(themeRow)
  card.appendChild(themeSection)

  // Options sections from registry
  const sections = getOptionsSections()
  sections.forEach(({ renderSection }) => {
    const sectionEl = ce("div")
    renderSection(sectionEl)
    card.appendChild(sectionEl)
  })

  wrapper.appendChild(card)
  return wrapper
}

function buildSetupPanel(): HTMLElement {
  const wrapper = ce("div", "sp-body-pad")
  if (currentSetupRenderFn) {
    currentSetupRenderFn(wrapper, currentOnSetupComplete)
  }
  return wrapper
}

// --- Interaction handlers ---

function handleItemSelect(item: PickerItem): void {
  const field = state.activeField
  const isCommandsList = state.activeCommand === ""
  currentOnSelect(item)
  if (!state.showingSettings && !isCommandsList) {
    hidePicker()
    if (field) {
      setTimeout(() => field.focus(), 0)
    }
  }
}

function handleSettingsClick(): void {
  if (viewType !== "settings") {
    viewBeforeSettings = viewType
  }
  state.showingSettings = true
  viewType = "settings"
  renderBodyContent()
}

function handleCloseClick(): void {
  hidePicker()
}

function handleSettingsBackClick(): void {
  state.showingSettings = false
  if (viewBeforeSettings) {
    viewType = viewBeforeSettings
    viewBeforeSettings = null
  } else {
    viewType = "loading"
  }
  renderBodyContent()
}

// --- Selection highlighting ---

function refreshSelection(): void {
  if (!bodyEl) return

  const buttons = bodyEl.querySelectorAll("button[data-item-index]")
  buttons.forEach((btnNode) => {
    const btn = btnNode as HTMLButtonElement
    const idx = parseInt(btn.getAttribute("data-item-index") || "0", 10)
    const selected = idx === state.selectedIndex
    btn.setAttribute("aria-selected", String(selected))
  })
}

// --- Render / re-render ---

function render(): void {
  if (!state.pickerEl) return

  if (!visible) {
    if (pickerInner) {
      pickerInner.style.display = "none"
    }
    return
  }

  // Rebuild the inner DOM for theme consistency
  if (pickerInner) {
    pickerInner.remove()
  }

  updateThemeClass()
  pickerInner = buildPickerInner()
  state.pickerEl.appendChild(pickerInner)
  renderBodyContent()

  // Animate on show
  try {
    pickerInner.animate(
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

// --- Public API ---

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
  injectPickerCSS()
  const mount = getPickerMountForField(field)

  if (state.pickerEl) {
    if (state.pickerEl.parentElement !== mount) mount.appendChild(state.pickerEl)
    return state.pickerEl
  }

  const container = document.createElement("div")
  container.id = "slashPalettePickerContainer"

  // Keep textarea focus when interacting with the picker
  const shouldPreventFocusSteal = (target: EventTarget | null): boolean => {
    const t = target as HTMLElement | null
    if (!t) return false

    if (state.showingSettings) {
      const btn = t.closest("button") as HTMLButtonElement | null
      if (btn) return true
    }

    const btn = t.closest("button") as HTMLButtonElement | null
    return !!(
      btn &&
      (btn.hasAttribute("data-item-index") ||
        btn.hasAttribute("data-suggest-chip") ||
        btn.hasAttribute("data-settings-btn") ||
        btn.hasAttribute("data-settings-action"))
    )
  }

  container.addEventListener(
    "pointerdown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault()
    },
    true
  )
  container.addEventListener(
    "mousedown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault()
    },
    true
  )

  const stopBubble = (ev: Event) => {
    ev.stopPropagation()
  }
  container.addEventListener("click", stopBubble)
  container.addEventListener("mousedown", stopBubble)
  container.addEventListener("mouseup", stopBubble)

  container.addEventListener("mousedown", () => {
    state.mouseDownInPicker = true
  })
  container.addEventListener("mouseup", () => {
    state.mouseDownInPicker = false
  })

  mount.appendChild(container)
  state.pickerEl = container

  render()
  return container
}

export function isPickerVisible(): boolean {
  return visible
}

export function showPicker(field?: HTMLElement | null): void {
  ensurePicker(field)
  visible = true
  render()
}

export function hidePicker(): void {
  if (!state.pickerEl) return
  visible = false
  viewType = "loading"
  viewBeforeSettings = null
  if (pickerInner) {
    pickerInner.style.display = "none"
  }
  resetPickerState()
}

export function clearBody(): void {
  ensurePicker()
  viewType = "loading"
  renderBodyContent()
}

export function setHeader(newTitle: string, newSubtitle: string): void {
  ensurePicker()
  title = newTitle || "Slash Palette"
  subtitle = newSubtitle || ""
  if (headerTitleEl) headerTitleEl.textContent = title
  if (headerSubEl) headerSubEl.textContent = subtitle
}

export function renderMessage(msg: string): void {
  clearBody()
  currentMessageText = msg
  viewType = "message"
  renderBodyContent()
}

export function renderLoadingSkeleton(): void {
  clearBody()
  viewType = "loading"
  renderBodyContent()
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

  let left = add(rect.left, caret.left)
  let top = add(rect.top, add(caret.top, add(caret.height, gap)))

  const maxLeft = sub(sub(vw, pickerWidth), 10)
  if (left > maxLeft) left = maxLeft
  const minLeft = 10
  if (left < minLeft) left = minLeft

  const maxTop = sub(sub(vh, pickerHeight), 10)
  if (top > maxTop) {
    top = sub(add(rect.top, caret.top), add(pickerHeight, gap))
  }
  const minTop = 10
  if (top < minTop) top = minTop

  position = { left, top }
  if (pickerInner) {
    pickerInner.style.left = `${left}px`
    pickerInner.style.top = `${top}px`
  }
}

export function refreshSelectionStyles(): void {
  refreshSelection()
}

export function scrollSelectedIntoView(): void {
  if (!state.pickerEl) return
  const btn = state.pickerEl.querySelector(`button[data-item-index="${state.selectedIndex}"]`)
  if (!btn) return
  btn.scrollIntoView({ block: "nearest", inline: "nearest" })
}

export function renderSuggestChips(
  _items: string[],
  _chipTitle: string,
  _onPick: (term: string) => void
): void {
  // Suggest chips are rendered as part of the grid view
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

  currentViewItems = items
  currentImgUrlFn = imgUrlFn
  currentOnSelect = onPickItem
  currentSuggestItems = state.suggestItems
  currentSuggestTitle = suggestTitle
  currentOnSuggestPick = (term: string) => {
    if (state.activeField) {
      setSlashQueryInField(state.activeCommand, term)
    }
  }

  viewType = "grid"
  renderBodyContent()
}

export function renderList(
  items: PickerItem[],
  onPickItem: (item: PickerItem) => void,
  listViewTitle?: string
): void {
  clearBody()

  state.currentItems = items
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)))
  state.cols = 1

  currentViewItems = items
  currentOnSelect = onPickItem
  currentListTitle = listViewTitle

  viewType = "list"
  renderBodyContent()
}

export function setSlashQueryInField(cmd: string, term: string): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const safeCmd = cmd ?? ""
  const safeTerm = term ?? ""

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const replacement = COMMAND_PREFIX + safeCmd + (safeTerm ? " " + safeTerm : "")
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
  currentSetupRenderFn = renderFn
  currentOnSetupComplete = onComplete
  viewType = "setup"
  renderBodyContent()
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
  refreshSelection()
  scrollSelectedIntoView()
}

export function showSettings(): void {
  ensurePicker()
  state.showingSettings = true
  viewType = "settings"
  renderBodyContent()
}
