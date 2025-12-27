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

import { replaceRange } from "../../../utils/dom.ts"
import { add } from "../../../utils/math.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, state } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

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

function escapeForSvg(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

/** Get color for category badge in SVG */
function getCategoryColor(category: KeyboardShortcut["category"]): string {
  switch (category) {
    case "editing":
      return "#3b82f6"
    case "navigation":
      return "#22c55e"
    case "system":
      return "#f59e0b"
    case "custom":
      return "#8b5cf6"
    default:
      return "#64748b"
  }
}

/** Create a tile for a keyboard shortcut */
function makeKbdTile(shortcut: KeyboardShortcut): PickerItem {
  const categoryColor = getCategoryColor(shortcut.category)
  const keys = parseKeys(shortcut.input)
  const displayKeys = keys.join(" + ")

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="176" viewBox="0 0 240 176">
  <defs>
    <linearGradient id="bg-${shortcut.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f8fafc" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="176" rx="18" fill="url(#bg-${shortcut.id})"/>
  <rect x="12" y="12" width="216" height="152" rx="14" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.10"/>
  
  <!-- Category badge -->
  <rect x="20" y="20" width="${CATEGORY_LABELS[shortcut.category].length * 8 + 16}" height="24" rx="6" fill="${categoryColor}" fill-opacity="0.15"/>
  <text x="28" y="37" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="${categoryColor}">${escapeForSvg(CATEGORY_LABELS[shortcut.category])}</text>
  
  <!-- Key display -->
  <text x="120" y="90" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="20" font-weight="600" fill="#0f172a" fill-opacity="0.85">${escapeForSvg(displayKeys)}</text>
  
  <!-- Label -->
  <text x="120" y="145" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="500" fill="#0f172a" fill-opacity="0.55">${escapeForSvg(shortcut.label)}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: shortcut.id,
    previewUrl: dataUrl,
    data: shortcut,
  }
}

/** Filter shortcuts by query */
function filterShortcuts(query: string): KeyboardShortcut[] {
  const q = (query || "").toLowerCase().trim()
  if (!q) return COMMON_SHORTCUTS

  return COMMON_SHORTCUTS.filter((shortcut) => {
    return (
      shortcut.id.includes(q) ||
      shortcut.label.toLowerCase().includes(q) ||
      shortcut.category.includes(q) ||
      shortcut.input.toLowerCase().includes(q) ||
      CATEGORY_LABELS[shortcut.category].toLowerCase().includes(q)
    )
  })
}

/** Get shortcuts sorted by category order */
function getSortedShortcuts(shortcuts: KeyboardShortcut[]): KeyboardShortcut[] {
  return [...shortcuts].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.category)
    const bIdx = CATEGORY_ORDER.indexOf(b.category)
    if (aIdx !== bIdx) return aIdx - bIdx
    return COMMON_SHORTCUTS.indexOf(a) - COMMON_SHORTCUTS.indexOf(b)
  })
}

/** Insert formatted keyboard shortcut into the textarea */
function insertKbdMarkdown(shortcut: KeyboardShortcut): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  // Generate the kbd HTML
  const replacement = inputToKbdHtml(shortcut.input) + " "
  const newValue = replaceRange(value, lineStart, pos, replacement)
  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Insert custom keyboard shortcut from user input */
function insertCustomKbd(input: string): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  // Generate the kbd HTML from user input
  const replacement = inputToKbdHtml(input) + " "
  const newValue = replaceRange(value, lineStart, pos, replacement)
  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Get category suggestions */
function getCategorySuggestions(): string[] {
  return ["copy", "paste", "ctrl+s", "ctrl+z", "alt+tab", "win+d"]
}

const kbdCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const shortcuts = getSortedShortcuts(COMMON_SHORTCUTS)
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
    const hasKnownKey = Object.keys(KEY_ALIASES).some((alias) => query.toLowerCase().includes(alias))

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
      const filtered = filterShortcuts(query)
      const sorted = getSortedShortcuts(filtered)
      const items = [customItem, ...sorted.map(makeKbdTile)]

      return {
        items,
        suggestTitle: "Your shortcut + matches",
      }
    }

    // Otherwise just filter common shortcuts
    const filtered = filterShortcuts(query)
    const sorted = getSortedShortcuts(filtered)
    const items = sorted.map(makeKbdTile)
    return {
      items,
      suggestTitle: query ? "Matching shortcuts" : "Common shortcuts",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertKbdMarkdown(it.data as KeyboardShortcut),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertKbdMarkdown(it.data as KeyboardShortcut),
      "Keyboard shortcuts"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    const shortcut = it.data as KeyboardShortcut
    if (shortcut.id === "custom-input") {
      insertCustomKbd(shortcut.input)
    } else {
      insertKbdMarkdown(shortcut)
    }
  },

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
