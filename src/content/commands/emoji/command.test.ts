/**
 * Tests for emoji command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { emojiCommand, makeEmojiTile } from "./command.ts"
import { type EmojiItem } from "./api.ts"
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
  getCommandCache: vi.fn().mockReturnValue(null),
  setCommandCache: vi.fn(),
  calculateBadgeWidth: (text: string) => text.length * 8 + 16,
}))

// Mock storage
vi.mock("../../../utils/storage.ts", () => ({
  getStorageValue: vi.fn().mockResolvedValue([]),
  setStorageValue: vi.fn().mockResolvedValue(undefined),
}))

describe("emoji command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("makeEmojiTile", () => {
    it("should create a picker item for an emoji", () => {
      const emojiItem: EmojiItem = {
        emoji: "😀",
        name: "grinning face",
        keywords: ["happy", "smile"],
        category: "smileys",
      }
      const tile = makeEmojiTile(emojiItem)
      expect(tile.id).toBe("😀")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBe(emojiItem)
    })

    it("should include category in the SVG", () => {
      const emojiItem: EmojiItem = {
        emoji: "🍕",
        name: "pizza",
        keywords: ["food"],
        category: "food",
      }
      const tile = makeEmojiTile(emojiItem)
      expect(tile.previewUrl).toContain("Food")
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await emojiCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return popular emojis", async () => {
      const result = await emojiCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBeGreaterThan(0)
    })

    it("should include suggest items", async () => {
      const result = await emojiCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
      expect(result.suggest!.length).toBeGreaterThan(0)
    })

    it("should return suggest title", async () => {
      const result = await emojiCommand.getEmptyState()
      expect(result.suggestTitle).toBeDefined()
    })
  })

  describe("getResults", () => {
    it("should filter emojis by name", async () => {
      const result = await emojiCommand.getResults("thumbs")
      expect(result.items).toBeDefined()
      const emojis = result.items!.map((item) => (item.data as EmojiItem).emoji)
      expect(emojis).toContain("👍")
    })

    it("should filter emojis by keyword", async () => {
      const result = await emojiCommand.getResults("love")
      expect(result.items).toBeDefined()
      const emojis = result.items!.map((item) => (item.data as EmojiItem).emoji)
      expect(emojis).toContain("❤️")
    })

    it("should return all emojis for empty query (limited)", async () => {
      const result = await emojiCommand.getResults("")
      expect(result.items!.length).toBeLessThanOrEqual(24)
    })

    it("should return empty array for non-matching query", async () => {
      const result = await emojiCommand.getResults("nonexistent123xyz")
      expect(result.items).toEqual([])
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await emojiCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
        expect(item.data).toBeDefined()
      })
    })

    it("should include emoji data in picker items", async () => {
      const result = await emojiCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        const emojiData = item.data as EmojiItem
        expect(emojiData.emoji).toBeDefined()
        expect(emojiData.name).toBeDefined()
        expect(emojiData.category).toBeDefined()
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(emojiCommand.noResultsMessage).toBeDefined()
      expect(emojiCommand.noResultsMessage).toContain("smile")
      expect(emojiCommand.noResultsMessage).toContain("heart")
    })
  })
})
