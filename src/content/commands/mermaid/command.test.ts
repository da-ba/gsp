/**
 * Tests for mermaid command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mermaidCommand, DIAGRAM_TEMPLATES, makeDiagramTile } from "./command.ts"
import type { DiagramTemplate } from "./api.ts"
import type { PickerItem } from "../../types.ts"

// Mock the picker module
vi.mock("../../picker/index.ts", () => ({
  renderGrid: vi.fn(),
  state: {
    activeField: null,
    activeLineStart: 0,
    currentItems: [],
    selectedIndex: 0,
  },
  calculateBadgeWidth: (text: string) => text.length * 8 + 16,
}))

describe("mermaid command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("DIAGRAM_TEMPLATES", () => {
    it("should have flowchart templates", () => {
      const flowcharts = DIAGRAM_TEMPLATES.filter((t) => t.category === "flow")
      expect(flowcharts.length).toBeGreaterThan(0)
      expect(flowcharts.map((t) => t.id)).toContain("flowchart-basic")
    })

    it("should have sequence diagram templates", () => {
      const sequences = DIAGRAM_TEMPLATES.filter((t) => t.category === "sequence")
      expect(sequences.length).toBeGreaterThan(0)
      expect(sequences.map((t) => t.id)).toContain("sequence-basic")
    })

    it("should have class diagram templates", () => {
      const classes = DIAGRAM_TEMPLATES.filter((t) => t.category === "class")
      expect(classes.length).toBeGreaterThan(0)
      expect(classes.map((t) => t.id)).toContain("class-basic")
    })

    it("should have state diagram templates", () => {
      const states = DIAGRAM_TEMPLATES.filter((t) => t.category === "state")
      expect(states.length).toBeGreaterThan(0)
      expect(states.map((t) => t.id)).toContain("state-basic")
    })

    it("should have other diagram templates", () => {
      const others = DIAGRAM_TEMPLATES.filter((t) => t.category === "other")
      expect(others.length).toBeGreaterThan(0)
      expect(others.map((t) => t.id)).toContain("pie-chart")
    })

    it("should have templates with mermaid code blocks", () => {
      DIAGRAM_TEMPLATES.forEach((tmpl) => {
        expect(tmpl.template).toContain("```mermaid")
        expect(tmpl.template).toContain("```")
      })
    })
  })

  describe("makeDiagramTile", () => {
    it("should create a picker item for a diagram template", () => {
      const template = DIAGRAM_TEMPLATES[0]
      expect(template).toBeDefined()
      const tile = makeDiagramTile(template!)
      expect(tile.id).toBe(template!.id)
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBe(template)
    })

    it("should include category label in the SVG", () => {
      const flowTemplate = DIAGRAM_TEMPLATES.find((t) => t.category === "flow")!
      const tile = makeDiagramTile(flowTemplate)
      expect(tile.previewUrl).toContain("Flowchart")
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await mermaidCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return all diagram templates", async () => {
      const result = await mermaidCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(DIAGRAM_TEMPLATES.length)
    })

    it("should include suggest items", async () => {
      const result = await mermaidCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
      expect(result.suggest!.length).toBeGreaterThan(0)
    })

    it("should return suggest title", async () => {
      const result = await mermaidCommand.getEmptyState()
      expect(result.suggestTitle).toBe("Popular diagrams")
    })
  })

  describe("getResults", () => {
    it("should filter templates by id", async () => {
      const result = await mermaidCommand.getResults("flowchart")
      expect(result.items).toBeDefined()
      const ids = result.items!.map((item) => item.id)
      expect(ids).toContain("flowchart-basic")
      expect(ids).toContain("flowchart-lr")
    })

    it("should filter templates by category", async () => {
      const result = await mermaidCommand.getResults("sequence")
      expect(result.items).toBeDefined()
      result.items!.forEach((item) => {
        const tmpl = item.data as DiagramTemplate
        expect(tmpl.category).toBe("sequence")
      })
    })

    it("should filter templates by label", async () => {
      const result = await mermaidCommand.getResults("pie")
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBeGreaterThan(0)
      const ids = result.items!.map((item) => item.id)
      expect(ids).toContain("pie-chart")
    })

    it("should return all templates for empty query", async () => {
      const result = await mermaidCommand.getResults("")
      expect(result.items!.length).toBe(DIAGRAM_TEMPLATES.length)
    })

    it("should return empty array for non-matching query", async () => {
      const result = await mermaidCommand.getResults("nonexistent123xyz")
      expect(result.items).toEqual([])
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await mermaidCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
        expect(item.data).toBeDefined()
      })
    })

    it("should include template data in picker items", async () => {
      const result = await mermaidCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        const tmpl = item.data as DiagramTemplate
        expect(tmpl.id).toBeDefined()
        expect(tmpl.category).toBeDefined()
        expect(tmpl.label).toBeDefined()
        expect(tmpl.template).toBeDefined()
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(mermaidCommand.noResultsMessage).toBeDefined()
      expect(mermaidCommand.noResultsMessage).toContain("flowchart")
      expect(mermaidCommand.noResultsMessage).toContain("sequence")
    })
  })
})
