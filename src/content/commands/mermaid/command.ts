/**
 * /mermaid slash command implementation
 *
 * Provides diagram templates that can be inserted into GitHub markdown.
 * GitHub natively renders Mermaid diagrams in markdown code blocks.
 */

import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { createIconTile } from "../../../utils/tile-builder.ts"
import {
  DIAGRAM_TEMPLATES,
  DIAGRAM_CATEGORY_LABELS,
  filterTemplates,
  getSortedTemplates,
  getDiagramSuggestions,
  type DiagramTemplate,
  type DiagramCategory,
} from "./api.ts"

/** Category colors for badges */
const CATEGORY_COLORS: Record<DiagramCategory, string> = {
  flow: "#3b82f6",
  sequence: "#8b5cf6",
  class: "#ec4899",
  state: "#14b8a6",
  other: "#f59e0b",
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

/** Create a tile for a diagram template */
function makeDiagramTile(template: DiagramTemplate): PickerItem {
  const categoryColor = CATEGORY_COLORS[template.category] || "#64748b"

  return {
    id: template.id,
    previewUrl: createIconTile({
      id: template.id,
      category: DIAGRAM_CATEGORY_LABELS[template.category],
      categoryColor,
      iconSvg: getDiagramIcon(template.category),
      label: template.label,
      description: template.description,
    }),
    data: template,
  }
}

/** Insert diagram template into the textarea */
function insertDiagram(template: DiagramTemplate): void {
  // Insert the template with a newline before and after for clean formatting
  insertTextAtCursor("\n" + template.template + "\n")
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

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertDiagram(it.data as DiagramTemplate)
  },

  noResultsMessage: "No matching diagrams found. Try: flowchart, sequence, class, state",
}

// Register the command
registerCommand("mermaid", mermaidCommand)

export { mermaidCommand, makeDiagramTile, DIAGRAM_TEMPLATES }
