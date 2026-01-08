/**
 * /font slash command implementation
 *
 * Provides font styling options (sizes, colors, styles) for text
 * using HTML formatting that works in GitHub markdown.
 */

import { registerCommand, createGridHandlers } from "../registry.ts"
import { insertTextAtCursor } from "../../picker/index.ts"
import { state } from "../../picker/state.ts"
import type { PickerItem } from "../../types.ts"
import { createCategoryTile } from "../../../utils/tile-builder.ts"
import { filterAndSort } from "../../../utils/filter-sort.ts"

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

/** Category colors for badges */
const CATEGORY_COLORS: Record<FontCategory, string> = {
  size: "#6366f1",
  color: "#ec4899",
  style: "#14b8a6",
}

/** Preview colors for color options */
const PREVIEW_COLORS: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  purple: "#a855f7",
  gray: "#6b7280",
}

/** Font size overrides for specific options */
const FONT_SIZE_MAP: Record<string, number> = {
  tiny: 14,
  small: 16,
  large: 28,
  huge: 34,
}

/** Create a tile for a font option */
function makeFontTile(option: FontOption): PickerItem {
  const categoryColor = CATEGORY_COLORS[option.category] || "#64748b"
  const previewColor = option.category === "color" ? PREVIEW_COLORS[option.id] || "#0f172a" : "#0f172a"

  // Font styling for preview
  const isBold = option.id === "bold" || option.id === "bolditalic"
  const isItalic = option.id === "italic" || option.id === "bolditalic"
  const fontSize = FONT_SIZE_MAP[option.id] || 22

  return {
    id: option.id,
    previewUrl: createCategoryTile({
      id: option.id,
      category: CATEGORY_LABELS[option.category],
      categoryColor,
      mainText: option.preview,
      mainFontSize: fontSize,
      mainFontWeight: isBold ? "700" : option.id === "code" ? "400" : "500",
      mainFontStyle: isItalic ? "italic" : undefined,
      mainTextDecoration: option.id === "strikethrough" ? "line-through" : undefined,
      mainColor: previewColor,
      mainMonospace: option.id === "code",
      label: option.label,
    }),
    data: option,
  }
}

/** Filter and sort options by query */
function getFilteredOptions(query: string): FontOption[] {
  return filterAndSort({
    items: FONT_OPTIONS,
    query,
    searchFields: [
      (opt) => opt.id,
      (opt) => opt.label,
      (opt) => opt.category,
      (opt) => CATEGORY_LABELS[opt.category],
    ],
    categoryOrder: CATEGORY_ORDER,
    getCategory: (opt) => opt.category,
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
    const options = getFilteredOptions("")
    const items = options.map(makeFontTile)
    return {
      items,
      suggest: getCategorySuggestions(),
      suggestTitle: "Popular styles",
    }
  },

  getResults: async (query: string) => {
    const options = getFilteredOptions(query)
    const items = options.map(makeFontTile)
    return {
      items,
      suggestTitle: query ? "Matching styles" : "Font styles",
    }
  },

  ...createGridHandlers<FontOption>(insertFontMarkdown),

  noResultsMessage: "No matching font styles found. Try: bold, italic, red, large",
}

// Register the command
registerCommand("font", fontCommand)

export { fontCommand, FONT_OPTIONS }
