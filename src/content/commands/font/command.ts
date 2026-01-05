/**
 * /font slash command implementation
 *
 * Provides font styling options (sizes, colors, styles) for text
 * using HTML formatting that works in GitHub markdown.
 */

import { escapeForSvg } from "../../../utils/svg.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, state, insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

/** Font option types */
type FontCategory = "size" | "color" | "style"

export type FontOption = {
  id: string
  category: FontCategory
  label: string
  /** HTML template with {text} placeholder */
  template: string
  /** Preview display text */
  preview: string
}

/** Available font options */
const FONT_OPTIONS: FontOption[] = [
  // Sizes (using sup/sub tags and markdown headers)
  { id: "tiny", category: "size", label: "Tiny", template: "<sub>{text}</sub>", preview: "Tiny" },
  {
    id: "small",
    category: "size",
    label: "Small",
    template: "<sup>{text}</sup>",
    preview: "Small",
  },
  { id: "large", category: "size", label: "Large", template: "## {text}", preview: "Large" },
  { id: "huge", category: "size", label: "Huge", template: "# {text}", preview: "Huge" },

  // Colors (using LaTeX \color syntax which works in GitHub markdown)
  {
    id: "red",
    category: "color",
    label: "Red",
    template: "$\\color{red}{\\textsf{{text}}}$",
    preview: "Red",
  },
  {
    id: "blue",
    category: "color",
    label: "Blue",
    template: "$\\color{blue}{\\textsf{{text}}}$",
    preview: "Blue",
  },
  {
    id: "green",
    category: "color",
    label: "Green",
    template: "$\\color{green}{\\textsf{{text}}}$",
    preview: "Green",
  },
  {
    id: "orange",
    category: "color",
    label: "Orange",
    template: "$\\color{orange}{\\textsf{{text}}}$",
    preview: "Orange",
  },
  {
    id: "purple",
    category: "color",
    label: "Purple",
    template: "$\\color{purple}{\\textsf{{text}}}$",
    preview: "Purple",
  },
  {
    id: "gray",
    category: "color",
    label: "Gray",
    template: "$\\color{gray}{\\textsf{{text}}}$",
    preview: "Gray",
  },

  // Styles (using markdown and HTML)
  { id: "bold", category: "style", label: "Bold", template: "**{text}**", preview: "Bold" },
  { id: "italic", category: "style", label: "Italic", template: "*{text}*", preview: "Italic" },
  {
    id: "bolditalic",
    category: "style",
    label: "Bold Italic",
    template: "***{text}***",
    preview: "Bold Italic",
  },
  {
    id: "strikethrough",
    category: "style",
    label: "Strikethrough",
    template: "~~{text}~~",
    preview: "Strikethrough",
  },
  { id: "code", category: "style", label: "Code", template: "`{text}`", preview: "Code" },
  { id: "quote", category: "style", label: "Quote", template: "> {text}", preview: "Quote" },
]

/** Category labels for display */
const CATEGORY_LABELS: Record<FontCategory, string> = {
  size: "Sizes",
  color: "Colors",
  style: "Styles",
}

/** Category display order */
const CATEGORY_ORDER: FontCategory[] = ["style", "color", "size"]

/** Get color for category badge in SVG */
function getCategoryColor(category: FontCategory): string {
  switch (category) {
    case "size":
      return "#6366f1"
    case "color":
      return "#ec4899"
    case "style":
      return "#14b8a6"
    default:
      return "#64748b"
  }
}

/** Get preview color for color options */
function getPreviewColor(id: string): string {
  switch (id) {
    case "red":
      return "#ef4444"
    case "blue":
      return "#3b82f6"
    case "green":
      return "#22c55e"
    case "orange":
      return "#f97316"
    case "purple":
      return "#a855f7"
    case "gray":
      return "#6b7280"
    default:
      return "#0f172a"
  }
}

/** Create a tile for a font option */
function makeFontTile(option: FontOption): PickerItem {
  const categoryColor = getCategoryColor(option.category)
  const previewColor = option.category === "color" ? getPreviewColor(option.id) : "#0f172a"

  // Font styling for preview
  let fontWeight = "500"
  let fontStyle = "normal"
  let textDecoration = "none"
  let fontSize = "22"

  if (option.id === "bold" || option.id === "bolditalic") fontWeight = "700"
  if (option.id === "italic" || option.id === "bolditalic") fontStyle = "italic"
  if (option.id === "strikethrough") textDecoration = "line-through"
  if (option.id === "tiny") fontSize = "14"
  if (option.id === "small") fontSize = "16"
  if (option.id === "large") fontSize = "28"
  if (option.id === "huge") fontSize = "34"
  if (option.id === "code") {
    fontWeight = "400"
  }

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
  <rect x="20" y="20" width="${CATEGORY_LABELS[option.category].length * 8 + 16}" height="24" rx="6" fill="${categoryColor}" fill-opacity="0.15"/>
  <text x="28" y="37" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="${categoryColor}">${escapeForSvg(CATEGORY_LABELS[option.category])}</text>
  
  <!-- Preview text -->
  <text x="120" y="${option.id === "huge" ? "100" : "95"}" text-anchor="middle" font-family="${option.id === "code" ? "ui-monospace, monospace" : "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}" fill="${previewColor}" fill-opacity="0.92">${escapeForSvg(option.preview)}</text>
  
  <!-- Label -->
  <text x="120" y="145" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="500" fill="#0f172a" fill-opacity="0.55">${escapeForSvg(option.label)}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: option.id,
    previewUrl: dataUrl,
    data: option,
  }
}

/** Filter options by query */
function filterOptions(query: string): FontOption[] {
  const q = (query || "").toLowerCase().trim()
  if (!q) return FONT_OPTIONS

  return FONT_OPTIONS.filter((opt) => {
    return (
      opt.id.includes(q) ||
      opt.label.toLowerCase().includes(q) ||
      opt.category.includes(q) ||
      CATEGORY_LABELS[opt.category].toLowerCase().includes(q)
    )
  })
}

/** Get options sorted by category order */
function getSortedOptions(options: FontOption[]): FontOption[] {
  return [...options].sort((a, b) => {
    const aIdx = CATEGORY_ORDER.indexOf(a.category)
    const bIdx = CATEGORY_ORDER.indexOf(b.category)
    if (aIdx !== bIdx) return aIdx - bIdx
    return FONT_OPTIONS.indexOf(a) - FONT_OPTIONS.indexOf(b)
  })
}

/**
 * Extract user text from the current command line.
 * Returns the text typed after "/font " or "text" as default.
 */
function extractUserText(): string {
  const field = state.activeField
  if (!field) return "text"

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const currentLine = value.slice(lineStart, pos)
  const cmdMatch = currentLine.match(/^\/font\s*(.*)/i)
  return cmdMatch?.[1]?.trim() || "text"
}

/** Insert formatted text into the textarea */
function insertFontMarkdown(option: FontOption): void {
  const userText = extractUserText()
  const replacement = option.template.replace(/{text}/g, userText)
  insertTextAtCursor(replacement)
}

/** Get category suggestions */
function getCategorySuggestions(): string[] {
  return ["bold", "italic", "red", "blue", "large", "code"]
}

const fontCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const options = getSortedOptions(FONT_OPTIONS)
    const items = options.map(makeFontTile)
    return {
      items,
      suggest: getCategorySuggestions(),
      suggestTitle: "Popular styles",
    }
  },

  getResults: async (query: string) => {
    const filtered = filterOptions(query)
    const sorted = getSortedOptions(filtered)
    const items = sorted.map(makeFontTile)
    return {
      items,
      suggestTitle: query ? "Matching styles" : "Font styles",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertFontMarkdown(it.data as FontOption),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertFontMarkdown(it.data as FontOption),
      "Font styles"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertFontMarkdown(it.data as FontOption)
  },

  noResultsMessage: "No matching font styles found. Try: bold, italic, red, large",
}

// Register the command
registerCommand("font", fontCommand)

export { fontCommand, FONT_OPTIONS }
