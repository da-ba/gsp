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
  moveSelectionList,
  applyPickerStyles,
} from "./picker/index.ts"

// Import commands to register them
import "./commands/giphy/index.ts"
import "./commands/selector/index.ts" // Internal command selector (triggered by "/")
import "./commands/font/index.ts"
import "./commands/emoji/index.ts"
import "./commands/mermaid/index.ts"
import "./commands/mention/index.ts"
import "./commands/now/index.ts"
import "./commands/kbd/index.ts"
import "./commands/link/index.ts"
import { COMMAND_SELECTOR_NAME } from "./commands/selector/command.ts"

/** Commands that use list view (all others use grid) */
const LIST_VIEW_COMMANDS = new Set([COMMAND_SELECTOR_NAME])

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

  // Clear any pending debounce from previous command to prevent stale results
  if (state.debounceId) {
    clearTimeout(state.debounceId)
    state.debounceId = null
  }

  // Reset lastQuery when switching commands to ensure fresh results
  const switchingCommands = state.activeCommand !== cmdName
  if (switchingCommands) {
    state.lastQuery = ""
  }

  state.activeCommand = cmdName

  // Set header subtitle - for command selector show "/" or "/ <filter>", for other commands show "/<cmd> <query>"
  const isSelector = cmdName === COMMAND_SELECTOR_NAME
  const subtitle = isSelector
    ? "/" + (query ? " " + query : "")
    : "/" + cmdName + (query ? " " + query : "")
  setHeader("GitHub Slash Palette", subtitle)

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

  // Determine the active command - either the parsed command or "gsp" for command selector
  let cmdName = parsed.cmd
  if (cmdName === "" || !getCommand(cmdName)) {
    cmdName = "gsp"
  }
  const cmd = getCommand(cmdName)
  if (!cmd) return

  // Check if we're using list view
  const useListView = LIST_VIEW_COMMANDS.has(cmdName)

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
      // For most commands, onSelect inserts content and picker should hide.
      // For gsp command, onSelect changes the textarea text which triggers
      // handleFieldInput to show the selected command's picker.
      // The picker hiding happens via the input event cycle.
    }
    return
  }

  if (!state.currentItems.length) return

  // Navigation - use list view for list commands, grid for others
  if (useListView) {
    // List view: only up/down navigation
    if (ev.key === "ArrowDown") {
      ev.preventDefault()
      ev.stopPropagation()
      moveSelectionList(1)
      return
    }
    if (ev.key === "ArrowUp") {
      ev.preventDefault()
      ev.stopPropagation()
      moveSelectionList(neg(1))
      return
    }
  } else {
    // Grid view: 2D navigation
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

  state.activeField = field
  state.activeLineStart = info.lineStart
  state.activeCursorPos = info.pos

  // If just "/" is typed (empty cmd), show command selector
  if (parsed.cmd === "") {
    await handleCommandInput(field, COMMAND_SELECTOR_NAME, "")
    return
  }

  const cmd = getCommand(parsed.cmd)
  if (!cmd) {
    // Command not found yet - could be partial typing like "/gi"
    // Show command selector filtered by what's typed so far
    await handleCommandInput(field, COMMAND_SELECTOR_NAME, parsed.cmd)
    return
  }

  // Valid command found - switch to that command's picker
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

  // Picker now only closes on Escape or selection - no blur-based closing
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

  // Picker now only closes on Escape or selection - no click-outside closing

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
