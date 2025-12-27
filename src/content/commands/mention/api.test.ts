/**
 * Tests for mention API
 */

import { describe, it, expect, vi } from "vitest"
import { searchMentions, getMentionSuggestions, TYPE_LABELS, type MentionItem } from "./api.ts"

// Mock storage
vi.mock("../../../utils/storage.ts", () => ({
  getStorageValue: vi.fn().mockResolvedValue([]),
  setStorageValue: vi.fn().mockResolvedValue(undefined),
}))

describe("mention API", () => {
  const mockMentions: MentionItem[] = [
    { username: "octocat", type: "author", displayName: "The Octocat" },
    { username: "hubot", type: "reviewer" },
    { username: "defunkt", type: "participant" },
    { username: "mojombo", type: "assignee" },
    { username: "github/core-team", type: "team" },
    { username: "jsmith", type: "recent" },
  ]

  describe("TYPE_LABELS", () => {
    it("should have labels for all participant types", () => {
      expect(TYPE_LABELS.author).toBe("Author")
      expect(TYPE_LABELS.participant).toBe("Participant")
      expect(TYPE_LABELS.reviewer).toBe("Reviewer")
      expect(TYPE_LABELS.assignee).toBe("Assignee")
      expect(TYPE_LABELS.team).toBe("Team")
      expect(TYPE_LABELS.recent).toBe("Recent")
    })
  })

  describe("searchMentions", () => {
    it("should return all mentions for empty query", () => {
      const result = searchMentions(mockMentions, "")
      expect(result).toEqual(mockMentions)
    })

    it("should filter by username", () => {
      const result = searchMentions(mockMentions, "octo")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("octocat")
    })

    it("should filter by display name", () => {
      const result = searchMentions(mockMentions, "Octocat")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("octocat")
    })

    it("should filter by type", () => {
      const result = searchMentions(mockMentions, "reviewer")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("hubot")
    })

    it("should filter by type label", () => {
      const result = searchMentions(mockMentions, "Author")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("octocat")
    })

    it("should be case insensitive", () => {
      const result = searchMentions(mockMentions, "OCTOCAT")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("octocat")
    })

    it("should return empty array for non-matching query", () => {
      const result = searchMentions(mockMentions, "nonexistent123xyz")
      expect(result).toEqual([])
    })

    it("should match partial usernames", () => {
      const result = searchMentions(mockMentions, "hubot")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("hubot")
    })

    it("should find teams by partial name", () => {
      const result = searchMentions(mockMentions, "core")
      expect(result.length).toBe(1)
      expect(result[0]?.username).toBe("github/core-team")
    })
  })

  describe("getMentionSuggestions", () => {
    it("should return first usernames as suggestions", () => {
      const result = getMentionSuggestions(mockMentions)
      expect(result.length).toBeLessThanOrEqual(6)
      expect(result).toContain("octocat")
    })

    it("should return empty array for empty mentions", () => {
      const result = getMentionSuggestions([])
      expect(result).toEqual([])
    })

    it("should limit to 6 suggestions", () => {
      const manyMentions: MentionItem[] = Array.from({ length: 20 }, (_, i) => ({
        username: `user${i}`,
        type: "participant" as const,
      }))
      const result = getMentionSuggestions(manyMentions)
      expect(result.length).toBe(6)
    })
  })
})
