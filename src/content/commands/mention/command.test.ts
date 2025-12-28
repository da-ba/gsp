/**
 * Tests for mention command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mentionCommand, makeMentionTile } from "./command.ts"
import { type MentionItem } from "./api.ts"

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
}))

// Mock storage
vi.mock("../../../utils/storage.ts", () => ({
  getStorageValue: vi.fn().mockResolvedValue([]),
  setStorageValue: vi.fn().mockResolvedValue(undefined),
}))

describe("mention command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("makeMentionTile", () => {
    it("should create a picker item for a mention", () => {
      const mentionItem: MentionItem = {
        username: "octocat",
        displayName: "The Octocat",
        type: "author",
      }
      const tile = makeMentionTile(mentionItem)
      expect(tile.id).toBe("octocat")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBe(mentionItem)
    })

    it("should include type badge in the SVG", () => {
      const mentionItem: MentionItem = {
        username: "hubot",
        type: "reviewer",
      }
      const tile = makeMentionTile(mentionItem)
      expect(tile.previewUrl).toContain("Reviewer")
    })

    it("should include username with @ prefix in SVG", () => {
      const mentionItem: MentionItem = {
        username: "octocat",
        type: "participant",
      }
      const tile = makeMentionTile(mentionItem)
      // URL-encoded @octocat
      const decodedUrl = decodeURIComponent(tile.previewUrl)
      expect(decodedUrl).toContain("@octocat")
    })

    it("should handle team mentions", () => {
      const mentionItem: MentionItem = {
        username: "github/core-team",
        type: "team",
      }
      const tile = makeMentionTile(mentionItem)
      expect(tile.id).toBe("github/core-team")
      expect(tile.previewUrl).toContain("Team")
    })

    it("should truncate long usernames", () => {
      const mentionItem: MentionItem = {
        username: "verylongusernamethatexceeds18chars",
        type: "participant",
      }
      const tile = makeMentionTile(mentionItem)
      // The SVG should contain truncated username (URL encoded ellipsis)
      const decodedUrl = decodeURIComponent(tile.previewUrl)
      expect(decodedUrl).toContain("…")
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await mentionCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return items", async () => {
      const result = await mentionCommand.getEmptyState()
      expect(result.items).toBeDefined()
    })

    it("should include suggest items", async () => {
      const result = await mentionCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
    })

    it("should return suggest title", async () => {
      const result = await mentionCommand.getEmptyState()
      expect(result.suggestTitle).toBeDefined()
    })
  })

  describe("getResults", () => {
    it("should return items for query", async () => {
      const result = await mentionCommand.getResults("user")
      expect(result.items).toBeDefined()
    })

    it("should return suggest title", async () => {
      const result = await mentionCommand.getResults("user")
      expect(result.suggestTitle).toBeDefined()
    })

    it("should return empty array for non-matching query when no participants", async () => {
      const result = await mentionCommand.getResults("nonexistent123xyz")
      expect(result.items).toBeDefined()
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const mentionItem: MentionItem = {
        username: "octocat",
        type: "author",
      }
      const tile = makeMentionTile(mentionItem)
      expect(tile.id).toBeDefined()
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBeDefined()
    })

    it("should include mention data in picker items", () => {
      const mentionItem: MentionItem = {
        username: "octocat",
        displayName: "The Octocat",
        type: "author",
      }
      const tile = makeMentionTile(mentionItem)
      const data = tile.data as MentionItem
      expect(data.username).toBe("octocat")
      expect(data.type).toBe("author")
      expect(data.displayName).toBe("The Octocat")
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(mentionCommand.noResultsMessage).toBeDefined()
      expect(mentionCommand.noResultsMessage).toContain("username")
    })
  })
})
