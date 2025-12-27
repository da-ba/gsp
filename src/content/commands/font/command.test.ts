/**
 * Tests for font command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { fontCommand, FONT_OPTIONS, type FontOption } from "./command.ts"
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
}))

describe("font command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("FONT_OPTIONS", () => {
    it("should have size options", () => {
      const sizes = FONT_OPTIONS.filter((opt) => opt.category === "size")
      expect(sizes.length).toBeGreaterThan(0)
      expect(sizes.map((s) => s.id)).toContain("tiny")
      expect(sizes.map((s) => s.id)).toContain("huge")
    })

    it("should have color options", () => {
      const colors = FONT_OPTIONS.filter((opt) => opt.category === "color")
      expect(colors.length).toBeGreaterThan(0)
      expect(colors.map((c) => c.id)).toContain("red")
      expect(colors.map((c) => c.id)).toContain("blue")
    })

    it("should have style options", () => {
      const styles = FONT_OPTIONS.filter((opt) => opt.category === "style")
      expect(styles.length).toBeGreaterThan(0)
      expect(styles.map((s) => s.id)).toContain("bold")
      expect(styles.map((s) => s.id)).toContain("italic")
    })

    it("should have templates with {text} placeholder", () => {
      FONT_OPTIONS.forEach((opt) => {
        expect(opt.template).toContain("{text}")
      })
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await fontCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return all font options", async () => {
      const result = await fontCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(FONT_OPTIONS.length)
    })

    it("should include suggest items", async () => {
      const result = await fontCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
      expect(result.suggest!.length).toBeGreaterThan(0)
    })

    it("should return suggest title", async () => {
      const result = await fontCommand.getEmptyState()
      expect(result.suggestTitle).toBe("Popular styles")
    })
  })

  describe("getResults", () => {
    it("should filter options by id", async () => {
      const result = await fontCommand.getResults("bold")
      expect(result.items).toBeDefined()
      const ids = result.items!.map((item) => item.id)
      expect(ids).toContain("bold")
      expect(ids).toContain("bolditalic")
    })

    it("should filter options by category", async () => {
      const result = await fontCommand.getResults("color")
      expect(result.items).toBeDefined()
      result.items!.forEach((item) => {
        const opt = item.data as FontOption
        expect(opt.category).toBe("color")
      })
    })

    it("should return all options for empty query", async () => {
      const result = await fontCommand.getResults("")
      expect(result.items!.length).toBe(FONT_OPTIONS.length)
    })

    it("should return empty array for non-matching query", async () => {
      const result = await fontCommand.getResults("nonexistent123")
      expect(result.items).toEqual([])
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await fontCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
        expect(item.data).toBeDefined()
      })
    })

    it("should include font option data in picker items", async () => {
      const result = await fontCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        const opt = item.data as FontOption
        expect(opt.id).toBeDefined()
        expect(opt.category).toBeDefined()
        expect(opt.label).toBeDefined()
        expect(opt.template).toBeDefined()
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(fontCommand.noResultsMessage).toBeDefined()
      expect(fontCommand.noResultsMessage).toContain("bold")
      expect(fontCommand.noResultsMessage).toContain("italic")
    })
  })
})
