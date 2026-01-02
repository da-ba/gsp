/**
 * /mermaid slash command implementation
 *
 * Provides diagram templates that can be inserted into GitHub markdown.
 * GitHub natively renders Mermaid diagrams in markdown code blocks.
 */

import { replaceRange } from "../../../utils/dom.ts"
import { add } from "../../../utils/math.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, state } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import {
  DIAGRAM_TEMPLATES,
  DIAGRAM_CATEGORY_LABELS,
  filterTemplates,
  getSortedTemplates,
  getDiagramSuggestions,
  type DiagramTemplate,
  type DiagramCategory,
} from "./api.ts"

/** Get color for category badge */
function getCategoryColor(category: DiagramCategory): string {
  switch (category) {
    case "flow":
      return "#3b82f6"
    case "sequence":
      return "#8b5cf6"
    case "class":
      return "#ec4899"
    case "state":
      return "#14b8a6"
    case "other":
      return "#f59e0b"
    default:
      return "#64748b"
  }
}

/** Get icon for diagram type */
function getDiagramIcon(category: DiagramCategory): string {
  switch (category) {
    case "flow":
      // Flow arrows
      return `<path d="M20 40 L40 40 L40 30 L55 45 L40 60 L40 50 L20 50 Z" fill="currentColor" opacity="0.7"/>
        <path d="M65 40 L85 40 L85 30 L100 45 L85 60 L85 50 L65 50 Z" fill="currentColor" opacity="0.5"/>`
    case "sequence":
      // Vertical lines with arrows
      return `<line x1="35" y1="25" x2="35" y2="65" stroke="currentColor" stroke-width="2" opacity="0.7"/>
        <line x1="85" y1="25" x2="85" y2="65" stroke="currentColor" stroke-width="2" opacity="0.7"/>
        <path d="M37 35 L83 35 M75 30 L83 35 L75 40" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M83 50 L37 50 M45 45 L37 50 L45 55" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="4" opacity="0.5"/>`
    case "class":
      // Box with sections
      return `<rect x="30" y="25" width="60" height="40" rx="2" stroke="currentColor" stroke-width="2" fill="none" opacity="0.7"/>
        <line x1="30" y1="37" x2="90" y2="37" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
        <line x1="30" y1="50" x2="90" y2="50" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>`
    case "state":
      // Rounded state boxes
      return `<rect x="25" y="30" width="30" height="20" rx="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.7"/>
        <rect x="65" y="30" width="30" height="20" rx="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M55 40 L65 40 M60 35 L65 40 L60 45" stroke="currentColor" stroke-width="2" fill="none" opacity="0.6"/>`
    case "other":
      // Pie/chart icon
      return `<circle cx="60" cy="45" r="20" stroke="currentColor" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M60 45 L60 25 A20 20 0 0 1 77 52 Z" fill="currentColor" opacity="0.4"/>
        <path d="M60 45 L77 52 A20 20 0 0 1 43 52 Z" fill="currentColor" opacity="0.25"/>`
    default:
      return ""
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

/** Create a tile for a diagram template */
function makeDiagramTile(template: DiagramTemplate): PickerItem {
  const categoryColor = getCategoryColor(template.category)
  const icon = getDiagramIcon(template.category)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="176" viewBox="0 0 240 176">
  <defs>
    <linearGradient id="bg-${template.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f8fafc" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="176" rx="18" fill="url(#bg-${template.id})"/>
  <rect x="12" y="12" width="216" height="152" rx="14" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.10"/>
  
  <!-- Category badge -->
  <rect x="20" y="20" width="${DIAGRAM_CATEGORY_LABELS[template.category].length * 8 + 16}" height="24" rx="6" fill="${categoryColor}" fill-opacity="0.15"/>
  <text x="28" y="37" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="600" fill="${categoryColor}">${escapeForSvg(DIAGRAM_CATEGORY_LABELS[template.category])}</text>
  
  <!-- Diagram icon -->
  <g transform="translate(60, 35)" fill="${categoryColor}">
    ${icon}
  </g>
  
  <!-- Label -->
  <text x="120" y="125" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="600" fill="#0f172a" fill-opacity="0.86">${escapeForSvg(template.label)}</text>
  
  <!-- Description -->
  <text x="120" y="145" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="400" fill="#0f172a" fill-opacity="0.55">${escapeForSvg(template.description)}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: template.id,
    previewUrl: dataUrl,
    data: template,
  }
}

/** Insert diagram template into the textarea */
function insertDiagram(template: DiagramTemplate): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const commandStart = add(state.activeLineStart, state.activeCommandStart)

  // Insert the template with a newline before and after for clean formatting
  const replacement = "\n" + template.template + "\n"
  const newValue = replaceRange(value, commandStart, pos, replacement)
  field.value = newValue

  const newPos = add(commandStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

const mermaidCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const templates = getSortedTemplates(DIAGRAM_TEMPLATES)
    const items = templates.map(makeDiagramTile)
    return {
      items,
      suggest: getDiagramSuggestions(),
      suggestTitle: "Popular diagrams",
    }
  },

  getResults: async (query: string) => {
    const filtered = filterTemplates(query)
    const sorted = getSortedTemplates(filtered)
    const items = sorted.map(makeDiagramTile)
    return {
      items,
      suggestTitle: query ? "Matching diagrams" : "Diagram templates",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertDiagram(it.data as DiagramTemplate),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertDiagram(it.data as DiagramTemplate),
      "Diagram templates"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertDiagram(it.data as DiagramTemplate)
  },

  noResultsMessage: "No matching diagrams found. Try: flowchart, sequence, class, state",
}

// Register the command
registerCommand("mermaid", mermaidCommand)

export { mermaidCommand, makeDiagramTile, DIAGRAM_TEMPLATES }
