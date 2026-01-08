/**
 * /kbd slash command implementation
 *
 * Provides keyboard shortcut formatting with <kbd> tags for GitHub markdown.
 * Handles Win/Mac/Linux key variants and various input formats:
 * - Keys with spaces: ctrl + p
 * - Keys without spaces: Win+alt+shift+p
 * - Platform abbreviations: cmd, opt, arrowLeft
 * - Alternative keys: 1/2/3
 */

import { registerCommand, type CommandSpec } from "../registry.ts"
import { createGridHandlers } from "../grid-handlers.ts"
import { insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { createCategoryTile } from "../../../utils/tile-builder.ts"
import { filterAndSort } from "../../../utils/filter-sort.ts"

/** Key aliases for different platforms */
const KEY_ALIASES: Record<string, string> = {
  // Mac aliases
  cmd: "⌘",
  command: "⌘",
  opt: "⌥",
  option: "⌥",
  ctrl: "⌃",
  control: "⌃",
  shift: "⇧",
  fn: "fn",
  // Windows/Linux aliases
  win: "Win",
  windows: "Win",
  alt: "Alt",
  meta: "Meta",
  // Arrow keys
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  // Special keys
  enter: "Enter",
  return: "Return",
  tab: "Tab",
  esc: "Esc",
  escape: "Esc",
  space: "Space",
  backspace: "⌫",
  delete: "Del",
  del: "Del",
  home: "Home",
  end: "End",
  pageup: "PgUp",
  pagedown: "PgDn",
  pgup: "PgUp",
  pgdn: "PgDn",
  capslock: "Caps Lock",
  caps: "Caps Lock",
  insert: "Ins",
  ins: "Ins",
  printscreen: "PrtSc",
  prtsc: "PrtSc",
  scrolllock: "Scroll Lock",
  pause: "Pause",
  break: "Break",
  numlock: "Num Lock",
}

/** Common keyboard shortcuts for quick access */
export type KeyboardShortcut = {
  id: string
  label: string
  /** Raw input format */
  input: string
  /** Category for grouping */
  category: "editing" | "navigation" | "system" | "custom"
}

const COMMON_SHORTCUTS: KeyboardShortcut[] = [
  // Editing shortcuts
  { id: "copy", label: "Copy", input: "Ctrl+C", category: "editing" },
  { id: "paste", label: "Paste", input: "Ctrl+V", category: "editing" },
  { id: "cut", label: "Cut", input: "Ctrl+X", category: "editing" },
  { id: "undo", label: "Undo", input: "Ctrl+Z", category: "editing" },
  { id: "redo", label: "Redo", input: "Ctrl+Shift+Z", category: "editing" },
  { id: "selectall", label: "Select All", input: "Ctrl+A", category: "editing" },
  { id: "save", label: "Save", input: "Ctrl+S", category: "editing" },
  { id: "find", label: "Find", input: "Ctrl+F", category: "editing" },

  // Navigation shortcuts
  { id: "newtab", label: "New Tab", input: "Ctrl+T", category: "navigation" },
  { id: "closetab", label: "Close Tab", input: "Ctrl+W", category: "navigation" },
  { id: "refresh", label: "Refresh", input: "Ctrl+R", category: "navigation" },
  { id: "back", label: "Go Back", input: "Alt+Left", category: "navigation" },
  { id: "forward", label: "Go Forward", input: "Alt+Right", category: "navigation" },
  { id: "home", label: "Home", input: "Alt+Home", category: "navigation" },

  // System shortcuts
  { id: "taskmanager", label: "Task Manager", input: "Ctrl+Shift+Esc", category: "system" },
  { id: "lock", label: "Lock Screen", input: "Win+L", category: "system" },
  { id: "desktop", label: "Show Desktop", input: "Win+D", category: "system" },
  { id: "run", label: "Run", input: "Win+R", category: "system" },
  { id: "settings", label: "Settings", input: "Win+I", category: "system" },
  { id: "screenshot", label: "Screenshot", input: "Win+Shift+S", category: "system" },
]

/** Category labels for display */
const CATEGORY_LABELS: Record<KeyboardShortcut["category"], string> = {
  editing: "Editing",
  navigation: "Navigation",
  system: "System",
  custom: "Custom",
}

/** Category display order */
const CATEGORY_ORDER: KeyboardShortcut["category"][] = ["editing", "navigation", "system", "custom"]

/**
 * Normalize a single key to its display form
 */
function normalizeKey(key: string): string {
  const trimmed = key.trim()
  const lower = trimmed.toLowerCase()

  // Check if it's an alias
  if (KEY_ALIASES[lower]) {
    return KEY_ALIASES[lower]
  }

  // Check for function keys (F1-F12)
  if (/^f([1-9]|1[0-2])$/i.test(trimmed)) {
    return trimmed.toUpperCase()
  }

  // Single character keys - uppercase
  if (trimmed.length === 1) {
    return trimmed.toUpperCase()
  }

  // Capitalize first letter for other keys
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Parse keyboard shortcut input into individual keys
 * Handles formats like:
 * - "ctrl + p" (with spaces)
 * - "Ctrl+P" (without spaces)
 * - "cmd+opt+arrowLeft" (abbreviations)
 * - "1/2/3" (alternatives)
 */
function parseKeys(input: string): string[] {
  // First normalize spaces around + signs
  const normalized = input.replace(/\s*\+\s*/g, "+")

  // Split by + to get individual keys
  const keys = normalized.split("+").filter((k) => k.trim())

  return keys.map((key) => {
    // Check if this key has alternatives (e.g., "1/2/3")
    if (key.includes("/")) {
      const alts = key.split("/").map((k) => normalizeKey(k.trim()))
      return alts.join("/")
    }
    return normalizeKey(key)
  })
}

/**
 * Format keys as HTML with <kbd> tags
 */
function formatKbdHtml(keys: string[]): string {
  return keys.map((key) => `<kbd>${key}</kbd>`).join("")
}

/**
 * Convert input string to full <kbd> formatted HTML
 */
function inputToKbdHtml(input: string): string {
  const keys = parseKeys(input)
  return formatKbdHtml(keys)
}

/** Category colors for badges */
const CATEGORY_COLORS: Record<KeyboardShortcut["category"], string> = {
  editing: "#3b82f6",
  navigation: "#22c55e",
  system: "#f59e0b",
  custom: "#8b5cf6",
}

/** Create a tile for a keyboard shortcut */
function makeKbdTile(shortcut: KeyboardShortcut): PickerItem {
  const keys = parseKeys(shortcut.input)
  const displayKeys = keys.join(" + ")

  return {
    id: shortcut.id,
    previewUrl: createCategoryTile({
      id: shortcut.id,
      category: CATEGORY_LABELS[shortcut.category],
      categoryColor: CATEGORY_COLORS[shortcut.category] || "#64748b",
      mainText: displayKeys,
      mainMonospace: true,
      label: shortcut.label,
    }),
    data: shortcut,
  }
}

/** Filter and sort shortcuts by query */
function getFilteredShortcuts(query: string): KeyboardShortcut[] {
  return filterAndSort({
    items: COMMON_SHORTCUTS,
    query,
    searchFields: [
      (s) => s.id,
      (s) => s.label,
      (s) => s.category,
      (s) => s.input,
      (s) => CATEGORY_LABELS[s.category],
    ],
    categoryOrder: CATEGORY_ORDER,
    getCategory: (s) => s.category,
  })
}

/** Insert formatted keyboard shortcut into the textarea */
function insertKbdMarkdown(shortcut: KeyboardShortcut): void {
  insertTextAtCursor(inputToKbdHtml(shortcut.input) + " ")
}

/** Get category suggestions */
function getCategorySuggestions(): string[] {
  return ["copy", "paste", "ctrl+s", "ctrl+z", "alt+tab", "win+d"]
}

const kbdCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const shortcuts = getFilteredShortcuts("")
    const items = shortcuts.map(makeKbdTile)
    return {
      items,
      suggest: getCategorySuggestions(),
      suggestTitle: "Common shortcuts",
    }
  },

  getResults: async (query: string) => {
    // Check if query looks like a custom shortcut input
    const hasModifier = /\+/i.test(query)
    const hasKnownKey = Object.keys(KEY_ALIASES).some((alias) =>
      query.toLowerCase().includes(alias)
    )

    // If it looks like a custom shortcut input
    if (hasModifier || hasKnownKey) {
      // Create a custom shortcut item
      const customShortcut: KeyboardShortcut = {
        id: "custom-input",
        label: "Custom: " + query,
        input: query,
        category: "custom",
      }
      const customItem = makeKbdTile(customShortcut)

      // Also show any matching common shortcuts
      const matchingShortcuts = getFilteredShortcuts(query)
      const items = [customItem, ...matchingShortcuts.map(makeKbdTile)]

      return {
        items,
        suggestTitle: "Your shortcut + matches",
      }
    }

    // Otherwise just filter common shortcuts
    const shortcuts = getFilteredShortcuts(query)
    const items = shortcuts.map(makeKbdTile)
    return {
      items,
      suggestTitle: query ? "Matching shortcuts" : "Common shortcuts",
    }
  },

  ...createGridHandlers<KeyboardShortcut>(insertKbdMarkdown),

  noResultsMessage: "No matching shortcuts. Type your own like: ctrl+p, cmd+shift+s",
}

// Register the command
registerCommand("kbd", kbdCommand)

export {
  kbdCommand,
  COMMON_SHORTCUTS,
  KEY_ALIASES,
  normalizeKey,
  parseKeys,
  formatKbdHtml,
  inputToKbdHtml,
}
