/**
 * /now slash command implementation
 *
 * Provides date and timestamp options for inserting formatted dates/times
 * into GitHub markdown fields.
 */

import { registerCommand, type CommandSpec } from "../registry.ts"
import { createGridHandlers } from "../grid-handlers.ts"
import { insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { createDetailTile } from "../../../utils/tile-builder.ts"
import { filterItems } from "../../../utils/filter-sort.ts"

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

/** Format category colors */
const FORMAT_COLORS: Record<string, string> = {
  iso: "#6366f1",
  "iso-date": "#6366f1",
  local: "#22c55e",
  "local-date": "#22c55e",
  "local-time": "#22c55e",
  utc: "#3b82f6",
  "utc-date": "#3b82f6",
  "utc-time": "#3b82f6",
  relative: "#f59e0b",
  unix: "#8b5cf6",
}

/** Format category labels */
const FORMAT_CATEGORIES: Record<string, string> = {
  iso: "ISO",
  "iso-date": "ISO",
  local: "Local",
  "local-date": "Local",
  "local-time": "Local",
  utc: "UTC",
  "utc-date": "UTC",
  "utc-time": "UTC",
  relative: "Relative",
  unix: "Unix",
}

/** Create a tile for a date option */
function makeDateTile(option: DateOption, previewDate: Date): PickerItem {
  return {
    id: option.id,
    previewUrl: createDetailTile({
      id: option.id,
      category: FORMAT_CATEGORIES[option.format] || "Other",
      categoryColor: FORMAT_COLORS[option.format] || "#64748b",
      title: option.label,
      preview: option.formatter(previewDate),
      description: option.description,
    }),
    data: option,
  }
}

/** Filter options by query */
function getFilteredOptions(query: string): DateOption[] {
  return filterItems({
    items: DATE_OPTIONS,
    query,
    searchFields: [
      (opt) => opt.id,
      (opt) => opt.label,
      (opt) => opt.description,
      (opt) => opt.format,
    ],
  })
}

/** Insert formatted date into the textarea */
function insertDateString(option: DateOption): void {
  // Generate the date string using current time
  insertTextAtCursor(option.formatter(new Date()))
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
    const options = getFilteredOptions(query)
    const items = options.map((opt) => makeDateTile(opt, previewDate))
    return {
      items,
      suggestTitle: query ? "Matching formats" : "Date formats",
    }
  },

  ...createGridHandlers<DateOption>(insertDateString),

  noResultsMessage: "No matching date formats found. Try: iso, local, utc, relative",
}

// Register the command
registerCommand("now", nowCommand)

export { nowCommand, DATE_OPTIONS, makeDateTile, getRelativeTime }
