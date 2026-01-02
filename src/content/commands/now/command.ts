/**
 * /now slash command implementation
 *
 * Provides date and timestamp options for inserting formatted dates/times
 * into GitHub markdown fields.
 */

import { replaceRange } from "../../../utils/dom.ts"
import { add } from "../../../utils/math.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, state } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

/** Date format types */
type DateFormat =
  | "iso"
  | "iso-date"
  | "local"
  | "local-date"
  | "local-time"
  | "utc"
  | "utc-date"
  | "utc-time"
  | "relative"
  | "unix"

export type DateOption = {
  id: string
  format: DateFormat
  label: string
  description: string
  /** Function to generate the formatted date string */
  formatter: (date: Date) => string
}

/** Get relative time string */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const absDiff = Math.abs(diff)
  const isPast = diff < 0

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return isPast ? `${days} day${days > 1 ? "s" : ""} ago` : `in ${days} day${days > 1 ? "s" : ""}`
  }
  if (hours > 0) {
    return isPast
      ? `${hours} hour${hours > 1 ? "s" : ""} ago`
      : `in ${hours} hour${hours > 1 ? "s" : ""}`
  }
  if (minutes > 0) {
    return isPast
      ? `${minutes} minute${minutes > 1 ? "s" : ""} ago`
      : `in ${minutes} minute${minutes > 1 ? "s" : ""}`
  }
  return "just now"
}

/** Available date format options */
const DATE_OPTIONS: DateOption[] = [
  {
    id: "iso",
    format: "iso",
    label: "ISO 8601",
    description: "Full ISO timestamp",
    formatter: (date: Date) => date.toISOString(),
  },
  {
    id: "iso-date",
    format: "iso-date",
    label: "ISO Date",
    description: "Date only (YYYY-MM-DD)",
    formatter: (date: Date) => date.toISOString().split("T")[0] as string,
  },
  {
    id: "local",
    format: "local",
    label: "Local DateTime",
    description: "Local date and time",
    formatter: (date: Date) => date.toLocaleString(),
  },
  {
    id: "local-date",
    format: "local-date",
    label: "Local Date",
    description: "Local date only",
    formatter: (date: Date) => date.toLocaleDateString(),
  },
  {
    id: "local-time",
    format: "local-time",
    label: "Local Time",
    description: "Local time only",
    formatter: (date: Date) => date.toLocaleTimeString(),
  },
  {
    id: "utc",
    format: "utc",
    label: "UTC DateTime",
    description: "UTC date and time",
    formatter: (date: Date) => date.toUTCString(),
  },
  {
    id: "utc-date",
    format: "utc-date",
    label: "UTC Date",
    description: "UTC date only",
    formatter: (date: Date) =>
      date.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
  },
  {
    id: "utc-time",
    format: "utc-time",
    label: "UTC Time",
    description: "UTC time only",
    formatter: (date: Date) =>
      date.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
  },
  {
    id: "relative",
    format: "relative",
    label: "Relative",
    description: "Relative time (e.g., just now)",
    formatter: (date: Date) => getRelativeTime(date),
  },
  {
    id: "unix",
    format: "unix",
    label: "Unix Timestamp",
    description: "Seconds since epoch",
    formatter: (date: Date) => Math.floor(date.getTime() / 1000).toString(),
  },
]

/** Get format color for category badge */
function getFormatColor(format: DateFormat): string {
  switch (format) {
    case "iso":
    case "iso-date":
      return "#6366f1"
    case "local":
    case "local-date":
    case "local-time":
      return "#22c55e"
    case "utc":
    case "utc-date":
    case "utc-time":
      return "#3b82f6"
    case "relative":
      return "#f59e0b"
    case "unix":
      return "#8b5cf6"
    default:
      return "#64748b"
  }
}

/** Get format category label */
function getFormatCategory(format: DateFormat): string {
  switch (format) {
    case "iso":
    case "iso-date":
      return "ISO"
    case "local":
    case "local-date":
    case "local-time":
      return "Local"
    case "utc":
    case "utc-date":
    case "utc-time":
      return "UTC"
    case "relative":
      return "Relative"
    case "unix":
      return "Unix"
    default:
      return "Other"
  }
}

function escapeForSvg(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

/** SVG layout constants for tile rendering */
const TILE_PREVIEW_MAX_LENGTH = 28
const TILE_PREVIEW_TRUNCATE_AT = 25
const BADGE_CHAR_WIDTH = 8
const BADGE_PADDING = 16

/** Create a tile for a date option */
function makeDateTile(option: DateOption, previewDate: Date): PickerItem {
  const formatColor = getFormatColor(option.format)
  const categoryLabel = getFormatCategory(option.format)
  const previewValue = option.formatter(previewDate)

  // Truncate long preview values
  const displayValue =
    previewValue.length > TILE_PREVIEW_MAX_LENGTH
      ? previewValue.slice(0, TILE_PREVIEW_TRUNCATE_AT) + "..."
      : previewValue

  const badgeWidth = categoryLabel.length * BADGE_CHAR_WIDTH + BADGE_PADDING

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="176" viewBox="0 0 240 176">
  <defs>
    <linearGradient id="bg-${option.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f8fafc" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="176" rx="18" fill="url(#bg-${option.id})"/>
  <rect x="12" y="12" width="216" height="152" rx="14" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.10"/>
  
  <!-- Category badge -->
  <rect x="20" y="20" width="${badgeWidth}" height="24" rx="6" fill="${formatColor}" fill-opacity="0.15"/>
  <text x="28" y="37" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="${formatColor}">${escapeForSvg(categoryLabel)}</text>
  
  <!-- Label -->
  <text x="24" y="75" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="18" font-weight="600" fill="#0f172a" fill-opacity="0.86">${escapeForSvg(option.label)}</text>
  
  <!-- Preview value -->
  <text x="24" y="105" font-family="ui-monospace, monospace" font-size="12" font-weight="400" fill="#0f172a" fill-opacity="0.65">${escapeForSvg(displayValue)}</text>
  
  <!-- Description -->
  <text x="24" y="145" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="500" fill="#0f172a" fill-opacity="0.50">${escapeForSvg(option.description)}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: option.id,
    previewUrl: dataUrl,
    data: option,
  }
}

/** Filter options by query */
function filterOptions(query: string): DateOption[] {
  const q = (query || "").toLowerCase().trim()
  if (!q) return DATE_OPTIONS

  return DATE_OPTIONS.filter((opt) => {
    return (
      opt.id.includes(q) ||
      opt.label.toLowerCase().includes(q) ||
      opt.description.toLowerCase().includes(q) ||
      opt.format.includes(q)
    )
  })
}

/** Insert formatted date into the textarea */
function insertDateString(option: DateOption): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const commandStart = add(state.activeLineStart, state.activeCommandStart)

  // Generate the date string using current time
  const replacement = option.formatter(new Date())
  const newValue = replaceRange(value, commandStart, pos, replacement)
  field.value = newValue

  const newPos = add(commandStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Get format suggestions */
function getFormatSuggestions(): string[] {
  return ["iso", "local", "utc", "relative", "unix"]
}

const nowCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const previewDate = new Date()
    const items = DATE_OPTIONS.map((opt) => makeDateTile(opt, previewDate))
    return {
      items,
      suggest: getFormatSuggestions(),
      suggestTitle: "Date formats",
    }
  },

  getResults: async (query: string) => {
    const previewDate = new Date()
    const filtered = filterOptions(query)
    const items = filtered.map((opt) => makeDateTile(opt, previewDate))
    return {
      items,
      suggestTitle: query ? "Matching formats" : "Date formats",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertDateString(it.data as DateOption),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertDateString(it.data as DateOption),
      "Date formats"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertDateString(it.data as DateOption)
  },

  noResultsMessage: "No matching date formats found. Try: iso, local, utc, relative",
}

// Register the command
registerCommand("now", nowCommand)

export { nowCommand, DATE_OPTIONS, makeDateTile, getRelativeTime }
