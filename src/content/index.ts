/**
 * GitHub Slash Palette - Content Script Entry Point
 */

import { isGitHubMarkdownField, getCursorInfo, parseSlashCommand } from "../utils/dom.ts"
import { onThemeChange, setThemeOverride } from "../utils/theme.ts"
import { getThemePreference } from "../utils/storage.ts"
import { neg } from "../utils/math.ts"
import { getCommand } from "./commands/registry.ts"
import {
  state,
  isPickerVisible,
  showPicker,
  hidePicker,
  positionPickerAtCaret,
  setHeader,
  renderMessage,
  renderLoadingSkeleton,
  renderSetupPanel,
  refreshSelectionStyles,
  moveSelectionGrid,
  applyPickerStyles,
} from "./picker/index.ts"

// Import commands to register them
import "./commands/giphy/index.ts"
import "./commands/gsp/index.ts"
import "./commands/font/index.ts"
import "./commands/emoji/index.ts"
import "./commands/mention/index.ts"
import "./commands/now/index.ts"

/**
 * Update suggestions for the active command
 */
async function updateSuggestionsForActiveCommand(query: string): Promise<void> {
  const cmd = getCommand(state.activeCommand)
  if (!cmd?.getSuggestions) return

  const q = (query || "").trim()
  if (!q) return
  if (q === state.lastSuggestQuery) return
  state.lastSuggestQuery = q

  if (state.suggestDebounceId) clearTimeout(state.suggestDebounceId)
  state.suggestDebounceId = setTimeout(async () => {
    const res = await cmd.getSuggestions!(q)
    if (res?.items?.length) {
      state.suggestItems = res.items
    } else {
      state.suggestItems = []
    }
    if (isPickerVisible() && state.currentItems?.length) {
      cmd.renderCurrent()
    }
  }, 180)
}

/**
 * Handle command input and show picker
 */
async function handleCommandInput(
  field: HTMLTextAreaElement,
  cmdName: string,
  query: string
): Promise<void> {
  const cmd = getCommand(cmdName)
  if (!cmd) return

  state.activeCommand = cmdName
  setHeader("GitHub Slash Palette", "/" + cmdName + (query ? " " + query : ""))

  showPicker(field)
  positionPickerAtCaret(field)

  // Check if setup is needed
  const pre = await cmd.preflight()
  if (pre?.showSetup && pre.renderSetup) {
    renderSetupPanel(pre.renderSetup, () => {
      // Retry after setup completes (command is responsible for clearing its own cache)
      state.lastQuery = ""
      handleCommandInput(field, cmdName, query || "")
    })
    return
  }

  // Show empty state (trending)
  if (!query) {
    renderLoadingSkeleton()
    const res = await cmd.getEmptyState()
    if (res?.error) {
      renderMessage(res.error)
      return
    }
    state.suggestItems = res?.suggest ?? []
    state.selectedIndex = 0
    cmd.renderItems(res?.items ?? [], res?.suggestTitle ?? "")
    return
  }

  // Update suggestions
  updateSuggestionsForActiveCommand(query)

  // Skip if same query
  if (query === state.lastQuery) return
  state.lastQuery = query

  // Debounce search
  if (state.debounceId) clearTimeout(state.debounceId)
  state.debounceId = setTimeout(async () => {
    showPicker()
    positionPickerAtCaret(field)
    // Only show skeleton if no items are displayed yet (reduces flicker)
    if (!state.currentItems?.length) {
      renderLoadingSkeleton()
    }

    if (state.inFlight) return
    state.inFlight = true
    try {
      const res = await cmd.getResults(query)
      if (res?.error) {
        renderMessage(res.error)
      } else {
        const items = res?.items ?? []
        if (!items.length) {
          renderMessage(cmd.noResultsMessage || "No results found")
        } else {
          state.selectedIndex = 0
          cmd.renderItems(items, res?.suggestTitle ?? "")
        }
      }
    } finally {
      state.inFlight = false
    }
  }, 260)
}

/**
 * Handle keyboard events in the field
 */
function onFieldKeyDown(ev: KeyboardEvent, field: HTMLTextAreaElement): void {
  if (!isPickerVisible()) return

  const info = getCursorInfo(field)
  const parsed = parseSlashCommand(info.line)
  if (!parsed) return

  const cmd = getCommand(parsed.cmd)
  if (!cmd) return

  if (ev.key === "Escape") {
    ev.preventDefault()
    ev.stopPropagation()
    ev.stopImmediatePropagation()
    hidePicker()
    return
  }

  if (ev.key === "Enter") {
    if (state.currentItems?.length) {
      ev.preventDefault()
      ev.stopPropagation()
      ev.stopImmediatePropagation()
      const it = state.currentItems[state.selectedIndex] || state.currentItems[0]
      if (it) cmd.onSelect(it)
      hidePicker()
    }
    return
  }

  if (!state.currentItems.length) return

  if (ev.key === "ArrowRight") {
    ev.preventDefault()
    ev.stopPropagation()
    moveSelectionGrid(1, 0)
    return
  }
  if (ev.key === "ArrowLeft") {
    ev.preventDefault()
    ev.stopPropagation()
    moveSelectionGrid(neg(1), 0)
    return
  }
  if (ev.key === "ArrowDown") {
    ev.preventDefault()
    ev.stopPropagation()
    moveSelectionGrid(0, 1)
    return
  }
  if (ev.key === "ArrowUp") {
    ev.preventDefault()
    ev.stopPropagation()
    moveSelectionGrid(0, neg(1))
    return
  }
}

/**
 * Handle field input changes
 */
async function handleFieldInput(field: HTMLTextAreaElement): Promise<void> {
  const info = getCursorInfo(field)
  const parsed = parseSlashCommand(info.line)

  if (!parsed) {
    if (state.activeField === field) hidePicker()
    return
  }

  const cmd = getCommand(parsed.cmd)
  if (!cmd) {
    if (state.activeField === field) hidePicker()
    return
  }

  state.activeField = field
  state.activeLineStart = info.lineStart
  state.activeCursorPos = info.pos

  await handleCommandInput(field, parsed.cmd, parsed.query || "")
}

/**
 * Attach listeners to a textarea field
 */
function attachToField(field: HTMLTextAreaElement): void {
  if (!isGitHubMarkdownField(field)) return
  if ((field as unknown as { __slashPaletteBound?: boolean }).__slashPaletteBound) return
  ;(field as unknown as { __slashPaletteBound: boolean }).__slashPaletteBound = true

  field.addEventListener("input", () => handleFieldInput(field))
  field.addEventListener("keyup", (ev) => {
    // Avoid re-processing navigation/action keys
    if (ev.key === "Escape") return
    if (ev.key === "ArrowUp" || ev.key === "ArrowDown") return
    if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") return
    if (ev.key === "Enter" || ev.key === "Tab") return
    handleFieldInput(field)
  })
  field.addEventListener("click", () => {
    if (isPickerVisible()) positionPickerAtCaret(field)
  })
  field.addEventListener("scroll", () => {
    if (isPickerVisible()) positionPickerAtCaret(field)
  })
  field.addEventListener("keydown", (ev) => onFieldKeyDown(ev, field))

  field.addEventListener("blur", () => {
    setTimeout(() => {
      if (state.mouseDownInPicker) return
      if (
        state.pickerEl &&
        document.activeElement &&
        state.pickerEl.contains(document.activeElement)
      )
        return
      if (document.activeElement !== field) hidePicker()
    }, 120)
  })
}

/**
 * Scan and attach to all textareas in a root element
 */
function scanAndAttach(root: Element | Document): void {
  const textareas = root.querySelectorAll("textarea")
  textareas.forEach((el) => attachToField(el as HTMLTextAreaElement))
}

/**
 * Bootstrap the extension
 */
function boot(): void {
  scanAndAttach(document)

  // Watch for new textareas added to DOM
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!node || node.nodeType !== 1) return
        scanAndAttach(node as Element)
      })
    })
  })

  mo.observe(document.documentElement, { childList: true, subtree: true })

  // Close picker when clicking outside
  document.addEventListener(
    "mousedown",
    (ev) => {
      if (!isPickerVisible()) return
      const picker = state.pickerEl
      if (!picker) return
      if (picker.contains(ev.target as Node)) return
      const field = state.activeField
      if (field && field.contains(ev.target as Node)) return
      hidePicker()
    },
    true
  )

  // Always allow Escape to close the picker (even if focus moved into the picker).
  // Use window capture so we run before GitHub popover handlers.
  window.addEventListener(
    "keydown",
    (ev) => {
      if (!isPickerVisible()) return
      if (ev.key !== "Escape") return
      ev.preventDefault()
      ev.stopPropagation()
      ev.stopImmediatePropagation()
      hidePicker()
      const field = state.activeField
      if (field) setTimeout(() => field.focus(), 0)
    },
    true
  )

  // Reposition picker on scroll/resize
  window.addEventListener(
    "scroll",
    () => {
      if (isPickerVisible() && state.activeField) {
        positionPickerAtCaret(state.activeField)
      }
    },
    { passive: true }
  )

  window.addEventListener("resize", () => {
    if (isPickerVisible() && state.activeField) {
      positionPickerAtCaret(state.activeField)
    }
  })

  // Handle theme changes
  onThemeChange(() => {
    if (!isPickerVisible()) return
    if (state.pickerEl) applyPickerStyles(state.pickerEl)
    refreshSelectionStyles()
  })
}

// Load theme preference and start the extension
getThemePreference().then((pref) => {
  setThemeOverride(pref)
  boot()
})
