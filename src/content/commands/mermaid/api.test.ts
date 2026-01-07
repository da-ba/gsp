/**
 * Tests for mermaid API
 */

import { describe, it, expect } from "vitest"
import {
  DIAGRAM_TEMPLATES,
  DIAGRAM_CATEGORY_LABELS,
  getFilteredTemplates,
  getDiagramSuggestions,
  type DiagramCategory,
} from "./api.ts"

describe("mermaid api", () => {
  describe("DIAGRAM_TEMPLATES", () => {
    it("should have at least 10 templates", () => {
      expect(DIAGRAM_TEMPLATES.length).toBeGreaterThanOrEqual(10)
    })

    it("should have all required properties for each template", () => {
      DIAGRAM_TEMPLATES.forEach((tmpl) => {
        expect(tmpl.id).toBeDefined()
        expect(tmpl.category).toBeDefined()
        expect(tmpl.label).toBeDefined()
        expect(tmpl.description).toBeDefined()
        expect(tmpl.template).toBeDefined()
      })
    })

    it("should have unique ids", () => {
      const ids = DIAGRAM_TEMPLATES.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should have valid categories", () => {
      const validCategories: DiagramCategory[] = ["flow", "sequence", "class", "state", "other"]
      DIAGRAM_TEMPLATES.forEach((tmpl) => {
        expect(validCategories).toContain(tmpl.category)
      })
    })
  })

  describe("DIAGRAM_CATEGORY_LABELS", () => {
    it("should have labels for all categories", () => {
      const categories: DiagramCategory[] = ["flow", "sequence", "class", "state", "other"]
      categories.forEach((cat) => {
        expect(DIAGRAM_CATEGORY_LABELS[cat]).toBeDefined()
        expect(DIAGRAM_CATEGORY_LABELS[cat].length).toBeGreaterThan(0)
      })
    })
  })

  describe("getFilteredTemplates", () => {
    it("should return all templates for empty query", () => {
      const result = getFilteredTemplates("")
      expect(result.length).toBe(DIAGRAM_TEMPLATES.length)
    })

    it("should filter by id", () => {
      const result = getFilteredTemplates("flowchart-basic")
      expect(result.length).toBe(1)
      expect(result[0]?.id).toBe("flowchart-basic")
    })

    it("should filter by label (case insensitive)", () => {
      const result = getFilteredTemplates("BASIC")
      expect(result.length).toBeGreaterThan(0)
      result.forEach((tmpl) => {
        expect(
          tmpl.id.toLowerCase().includes("basic") ||
            tmpl.label.toLowerCase().includes("basic") ||
            tmpl.description.toLowerCase().includes("basic")
        ).toBe(true)
      })
    })

    it("should filter by category", () => {
      const result = getFilteredTemplates("flow")
      expect(result.length).toBeGreaterThan(0)
      // All flow category templates should be included
      const flowTemplates = DIAGRAM_TEMPLATES.filter((t) => t.category === "flow")
      flowTemplates.forEach((flowTmpl) => {
        expect(result.some((r) => r.id === flowTmpl.id)).toBe(true)
      })
    })

    it("should filter by description", () => {
      const result = getFilteredTemplates("authentication")
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]?.id).toBe("sequence-auth")
    })

    it("should return empty array for non-matching query", () => {
      const result = getFilteredTemplates("nonexistent123xyz")
      expect(result).toEqual([])
    })

    it("should sort templates by category order", () => {
      const templates = getFilteredTemplates("")
      const categoryOrder: DiagramCategory[] = ["flow", "sequence", "class", "state", "other"]

      let lastCategoryIdx = -1
      templates.forEach((tmpl) => {
        const categoryIdx = categoryOrder.indexOf(tmpl.category)
        expect(categoryIdx).toBeGreaterThanOrEqual(lastCategoryIdx)
        if (categoryIdx > lastCategoryIdx) {
          lastCategoryIdx = categoryIdx
        }
      })
    })

    it("should preserve original order within categories", () => {
      const flowTemplates = DIAGRAM_TEMPLATES.filter((t) => t.category === "flow")
      const sorted = getFilteredTemplates("")
      const sortedFlowTemplates = sorted.filter((t) => t.category === "flow")

      expect(sortedFlowTemplates.map((t) => t.id)).toEqual(flowTemplates.map((t) => t.id))
    })
  })

  describe("getDiagramSuggestions", () => {
    it("should return an array of suggestions", () => {
      const suggestions = getDiagramSuggestions()
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it("should include common diagram types", () => {
      const suggestions = getDiagramSuggestions()
      expect(suggestions).toContain("flowchart")
      expect(suggestions).toContain("sequence")
    })
  })
})
