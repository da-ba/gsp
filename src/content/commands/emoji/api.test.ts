/**
 * Tests for emoji API utilities
 */

import { describe, it, expect } from "vitest"
import {
  searchEmojis,
  getPopularEmojis,
  getEmojisByCategory,
  getEmojiSuggestions,
  EMOJIS,
  CATEGORY_LABELS,
} from "./api.ts"

describe("emoji API", () => {
  describe("EMOJIS", () => {
    it("should have emojis in all categories", () => {
      const categories = Object.keys(CATEGORY_LABELS)
      categories.forEach((category) => {
        const emojisInCategory = EMOJIS.filter((e) => e.category === category)
        expect(emojisInCategory.length).toBeGreaterThan(0)
      })
    })

    it("should have emoji, name, keywords, and category for each item", () => {
      EMOJIS.forEach((item) => {
        expect(item.emoji).toBeDefined()
        expect(item.emoji.length).toBeGreaterThan(0)
        expect(item.name).toBeDefined()
        expect(item.name.length).toBeGreaterThan(0)
        expect(item.keywords).toBeDefined()
        expect(Array.isArray(item.keywords)).toBe(true)
        expect(item.category).toBeDefined()
      })
    })

    it("should have common emojis", () => {
      const commonEmojis = ["😀", "😂", "❤️", "👍", "🎉", "🔥"]
      commonEmojis.forEach((emoji) => {
        const found = EMOJIS.find((e) => e.emoji === emoji)
        expect(found).toBeDefined()
      })
    })
  })

  describe("searchEmojis", () => {
    it("should return all emojis for empty query", () => {
      const results = searchEmojis("")
      expect(results.length).toBe(EMOJIS.length)
    })

    it("should find emojis by name", () => {
      const results = searchEmojis("thumbs up")
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((e) => e.emoji === "👍")).toBe(true)
    })

    it("should find emojis by keyword", () => {
      const results = searchEmojis("love")
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((e) => e.emoji === "❤️")).toBe(true)
    })

    it("should find emojis by category", () => {
      const results = searchEmojis("smileys")
      expect(results.length).toBeGreaterThan(0)
      results.forEach((e) => {
        expect(e.category).toBe("smileys")
      })
    })

    it("should be case insensitive", () => {
      const results1 = searchEmojis("HEART")
      const results2 = searchEmojis("heart")
      expect(results1.length).toBe(results2.length)
    })

    it("should return empty array for non-matching query", () => {
      const results = searchEmojis("xyznonexistent123")
      expect(results.length).toBe(0)
    })
  })

  describe("getPopularEmojis", () => {
    it("should return popular emojis", () => {
      const popular = getPopularEmojis()
      expect(popular.length).toBeGreaterThan(0)
      expect(popular.length).toBeLessThanOrEqual(16)
    })

    it("should include common emojis", () => {
      const popular = getPopularEmojis()
      const emojis = popular.map((e) => e.emoji)
      expect(emojis).toContain("😀")
      expect(emojis).toContain("👍")
    })
  })

  describe("getEmojisByCategory", () => {
    it("should return emojis for a specific category", () => {
      const smileys = getEmojisByCategory("smileys")
      expect(smileys.length).toBeGreaterThan(0)
      smileys.forEach((e) => {
        expect(e.category).toBe("smileys")
      })
    })

    it("should return different emojis for different categories", () => {
      const smileys = getEmojisByCategory("smileys")
      const food = getEmojisByCategory("food")
      const smileyEmojis = smileys.map((e) => e.emoji)
      const foodEmojis = food.map((e) => e.emoji)
      // No overlap
      const overlap = smileyEmojis.filter((e) => foodEmojis.includes(e))
      expect(overlap.length).toBe(0)
    })
  })

  describe("getEmojiSuggestions", () => {
    it("should return suggestion strings", () => {
      const suggestions = getEmojiSuggestions()
      expect(suggestions.length).toBeGreaterThan(0)
      suggestions.forEach((s) => {
        expect(typeof s).toBe("string")
        expect(s.length).toBeGreaterThan(0)
      })
    })
  })

  describe("CATEGORY_LABELS", () => {
    it("should have labels for all categories", () => {
      const expectedCategories = [
        "smileys",
        "people",
        "nature",
        "food",
        "activities",
        "travel",
        "objects",
        "symbols",
      ]
      expectedCategories.forEach((cat) => {
        expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]).toBeDefined()
      })
    })
  })
})
