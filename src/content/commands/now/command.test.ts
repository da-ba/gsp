/**
 * Tests for now command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { nowCommand, DATE_OPTIONS, makeDateTile, getRelativeTime } from "./command.ts"
import type { PickerItem } from "../../types.ts"
import type { DateOption } from "./command.ts"

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

describe("now command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("DATE_OPTIONS", () => {
    it("should have ISO format options", () => {
      const isoOptions = DATE_OPTIONS.filter((opt) => opt.format.startsWith("iso"))
      expect(isoOptions.length).toBeGreaterThan(0)
      expect(isoOptions.map((o) => o.id)).toContain("iso")
      expect(isoOptions.map((o) => o.id)).toContain("iso-date")
    })

    it("should have local format options", () => {
      const localOptions = DATE_OPTIONS.filter((opt) => opt.format.startsWith("local"))
      expect(localOptions.length).toBeGreaterThan(0)
      expect(localOptions.map((o) => o.id)).toContain("local")
      expect(localOptions.map((o) => o.id)).toContain("local-date")
      expect(localOptions.map((o) => o.id)).toContain("local-time")
    })

    it("should have UTC format options", () => {
      const utcOptions = DATE_OPTIONS.filter((opt) => opt.format.startsWith("utc"))
      expect(utcOptions.length).toBeGreaterThan(0)
      expect(utcOptions.map((o) => o.id)).toContain("utc")
      expect(utcOptions.map((o) => o.id)).toContain("utc-date")
      expect(utcOptions.map((o) => o.id)).toContain("utc-time")
    })

    it("should have relative format option", () => {
      const relativeOption = DATE_OPTIONS.find((opt) => opt.format === "relative")
      expect(relativeOption).toBeDefined()
      expect(relativeOption!.id).toBe("relative")
    })

    it("should have unix timestamp option", () => {
      const unixOption = DATE_OPTIONS.find((opt) => opt.format === "unix")
      expect(unixOption).toBeDefined()
      expect(unixOption!.id).toBe("unix")
    })

    it("should have formatters for all options", () => {
      DATE_OPTIONS.forEach((opt) => {
        expect(typeof opt.formatter).toBe("function")
      })
    })
  })

  describe("formatters", () => {
    const testDate = new Date("2024-06-15T14:30:45.000Z")

    it("should format ISO correctly", () => {
      const isoOption = DATE_OPTIONS.find((opt) => opt.id === "iso")!
      expect(isoOption.formatter(testDate)).toBe("2024-06-15T14:30:45.000Z")
    })

    it("should format ISO date correctly", () => {
      const isoDateOption = DATE_OPTIONS.find((opt) => opt.id === "iso-date")!
      expect(isoDateOption.formatter(testDate)).toBe("2024-06-15")
    })

    it("should format unix timestamp correctly", () => {
      const unixOption = DATE_OPTIONS.find((opt) => opt.id === "unix")!
      expect(unixOption.formatter(testDate)).toBe("1718461845")
    })
  })

  describe("getRelativeTime", () => {
    it("should return 'just now' for recent times", () => {
      const now = new Date()
      expect(getRelativeTime(now)).toBe("just now")
    })

    it("should format minutes ago", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(getRelativeTime(fiveMinutesAgo)).toBe("5 minutes ago")
    })

    it("should format single minute", () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)
      expect(getRelativeTime(oneMinuteAgo)).toBe("1 minute ago")
    })

    it("should format hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(getRelativeTime(twoHoursAgo)).toBe("2 hours ago")
    })

    it("should format single hour", () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000)
      expect(getRelativeTime(oneHourAgo)).toBe("1 hour ago")
    })

    it("should format days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(getRelativeTime(threeDaysAgo)).toBe("3 days ago")
    })

    it("should format future times", () => {
      const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000)
      expect(getRelativeTime(inTwoHours)).toBe("in 2 hours")
    })
  })

  describe("makeDateTile", () => {
    it("should create a picker item for a date option", () => {
      const dateOption = DATE_OPTIONS[0]!
      const testDate = new Date()
      const tile = makeDateTile(dateOption, testDate)
      expect(tile.id).toBe(dateOption.id)
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBe(dateOption)
    })

    it("should include format category in the SVG", () => {
      const isoOption = DATE_OPTIONS.find((opt) => opt.id === "iso")!
      const testDate = new Date()
      const tile = makeDateTile(isoOption, testDate)
      expect(tile.previewUrl).toContain("ISO")
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await nowCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return all date options", async () => {
      const result = await nowCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(DATE_OPTIONS.length)
    })

    it("should include suggest items", async () => {
      const result = await nowCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
      expect(result.suggest!.length).toBeGreaterThan(0)
    })

    it("should return suggest title", async () => {
      const result = await nowCommand.getEmptyState()
      expect(result.suggestTitle).toBe("Date formats")
    })
  })

  describe("getResults", () => {
    it("should filter options by id", async () => {
      const result = await nowCommand.getResults("iso")
      expect(result.items).toBeDefined()
      const ids = result.items!.map((item) => item.id)
      expect(ids).toContain("iso")
      expect(ids).toContain("iso-date")
    })

    it("should filter options by label", async () => {
      const result = await nowCommand.getResults("local")
      expect(result.items).toBeDefined()
      result.items!.forEach((item) => {
        const opt = item.data as DateOption
        expect(opt.label.toLowerCase()).toContain("local")
      })
    })

    it("should return all options for empty query", async () => {
      const result = await nowCommand.getResults("")
      expect(result.items!.length).toBe(DATE_OPTIONS.length)
    })

    it("should return empty array for non-matching query", async () => {
      const result = await nowCommand.getResults("nonexistent123")
      expect(result.items).toEqual([])
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await nowCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
        expect(item.data).toBeDefined()
      })
    })

    it("should include date option data in picker items", async () => {
      const result = await nowCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        const opt = item.data as DateOption
        expect(opt.id).toBeDefined()
        expect(opt.format).toBeDefined()
        expect(opt.label).toBeDefined()
        expect(opt.formatter).toBeDefined()
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(nowCommand.noResultsMessage).toBeDefined()
      expect(nowCommand.noResultsMessage).toContain("iso")
      expect(nowCommand.noResultsMessage).toContain("local")
    })
  })
})
