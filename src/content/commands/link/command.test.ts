/**
 * Tests for link command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  linkCommand,
  makeLinkTile,
  makeEmptyLinkTile,
  makeCITile,
  makeCISetupTile,
  makeCIErrorTile,
  makeCINoResultsTile,
} from "./command.ts"
import type { LinkParseResult } from "./api.ts"
import type { PickerItem } from "../../types.ts"
import type { CILinkSuggestion } from "../../../options/github/api.ts"

// Mock the picker module
vi.mock("../../picker/index.ts", () => ({
  renderGrid: vi.fn(),
  state: {
    activeField: null,
    activeLineStart: 0,
    currentItems: [],
    selectedIndex: 0,
  },
  getCardStyles: vi.fn().mockReturnValue({}),
  getInputStyles: vi.fn().mockReturnValue({}),
  getBadgeStyles: vi.fn().mockReturnValue({}),
}))

// Mock the GitHub API module
vi.mock("../../../options/github/api.ts", () => ({
  getGitHubToken: vi.fn().mockResolvedValue(""),
  getRepoContext: vi.fn().mockReturnValue(null),
  searchCIResources: vi.fn().mockResolvedValue({ data: [] }),
}))

describe("link command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("makeLinkTile", () => {
    it("should create a picker item for a valid link", () => {
      const parsed: LinkParseResult = {
        url: "https://example.com",
        title: "Example",
        isValid: true,
      }
      const tile = makeLinkTile(parsed)
      expect(tile.id).toBe("link-preview")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBe(parsed)
    })

    it("should include title in the SVG", () => {
      const parsed: LinkParseResult = {
        url: "https://example.com",
        title: "My Link",
        isValid: true,
      }
      const tile = makeLinkTile(parsed)
      // The SVG content is URL-encoded, so we decode it to check
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("My Link")
    })

    it("should truncate long URLs in preview", () => {
      const parsed: LinkParseResult = {
        url: "https://example.com/very/long/path/that/should/be/truncated",
        title: "Long URL",
        isValid: true,
      }
      const tile = makeLinkTile(parsed)
      // URL should be truncated in the SVG
      expect(tile.previewUrl).not.toContain("truncated")
    })
  })

  describe("makeEmptyLinkTile", () => {
    it("should create an empty link tile", () => {
      const tile = makeEmptyLinkTile()
      expect(tile.id).toBe("link-empty")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toBeNull()
    })

    it("should include hint text", () => {
      const tile = makeEmptyLinkTile()
      // The SVG content is URL-encoded, so we decode it to check
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("Type a URL")
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await linkCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return empty link tile", async () => {
      const result = await linkCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(1)
      const firstItem = result.items![0]
      expect(firstItem).toBeDefined()
      expect(firstItem!.id).toBe("link-empty")
    })

    it("should return suggest title", async () => {
      const result = await linkCommand.getEmptyState()
      expect(result.suggestTitle).toBeDefined()
      expect(result.suggestTitle).toContain("URL")
    })
  })

  describe("getResults", () => {
    it("should return link preview for valid URL", async () => {
      const result = await linkCommand.getResults("example.com")
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(1)
      const firstItem = result.items![0]
      expect(firstItem).toBeDefined()
      expect(firstItem!.id).toBe("link-preview")

      const data = firstItem!.data as LinkParseResult
      expect(data.url).toBe("https://example.com")
      expect(data.isValid).toBe(true)
    })

    it("should parse URL with title", async () => {
      const result = await linkCommand.getResults('example.com "My Title"')
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(1)

      const firstItem = result.items![0]
      expect(firstItem).toBeDefined()
      const data = firstItem!.data as LinkParseResult
      expect(data.url).toBe("https://example.com")
      expect(data.title).toBe("My Title")
      expect(data.isValid).toBe(true)
    })

    it("should return empty tile for invalid URL", async () => {
      const result = await linkCommand.getResults("not a url")
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(1)
      const firstItem = result.items![0]
      expect(firstItem).toBeDefined()
      expect(firstItem!.id).toBe("link-empty")
    })

    it("should extract domain as default title", async () => {
      const result = await linkCommand.getResults("https://www.github.com/repo/path")
      const firstItem = result.items![0]
      expect(firstItem).toBeDefined()
      const data = firstItem!.data as LinkParseResult
      expect(data.title).toBe("github.com")
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await linkCommand.getResults("example.com")
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(linkCommand.noResultsMessage).toBeDefined()
      expect(linkCommand.noResultsMessage).toContain("/link")
    })

    it("should mention ci option in no results message", () => {
      expect(linkCommand.noResultsMessage).toContain("ci")
    })
  })
})

describe("CI link tiles", () => {
  describe("makeCITile", () => {
    it("should create a job tile", () => {
      const suggestion: CILinkSuggestion = {
        type: "job",
        name: "build",
        url: "https://github.com/owner/repo/actions/runs/123/jobs/456",
        runName: "CI",
        runId: 123,
      }
      const tile = makeCITile(suggestion)
      expect(tile.id).toContain("ci-job")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toEqual({ type: "ci", suggestion })
    })

    it("should create an artifact tile", () => {
      const suggestion: CILinkSuggestion = {
        type: "artifact",
        name: "test-report",
        url: "https://github.com/owner/repo/actions/runs/123/artifacts/789",
        runName: "CI",
        runId: 123,
      }
      const tile = makeCITile(suggestion)
      expect(tile.id).toContain("ci-artifact")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toEqual({ type: "ci", suggestion })
    })

    it("should include job name in SVG", () => {
      const suggestion: CILinkSuggestion = {
        type: "job",
        name: "e2e-tests",
        url: "https://github.com/owner/repo/actions/runs/123/jobs/456",
        runName: "CI Pipeline",
        runId: 123,
      }
      const tile = makeCITile(suggestion)
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("e2e-tests")
    })
  })

  describe("makeCISetupTile", () => {
    it("should create a setup tile", () => {
      const tile = makeCISetupTile()
      expect(tile.id).toBe("ci-setup")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toEqual({ type: "setup" })
    })

    it("should include setup message", () => {
      const tile = makeCISetupTile()
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("GitHub token required")
    })
  })

  describe("makeCIErrorTile", () => {
    it("should create an error tile", () => {
      const tile = makeCIErrorTile("Test error message")
      expect(tile.id).toBe("ci-error")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toEqual({ type: "error" })
    })

    it("should include error message in SVG", () => {
      const tile = makeCIErrorTile("Something went wrong")
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("Something went wrong")
    })

    it("should truncate long error messages", () => {
      const longError = "This is a very long error message that exceeds forty characters"
      const tile = makeCIErrorTile(longError)
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      // Should be truncated to 40 chars
      expect(decodedSvg).not.toContain("forty characters")
    })
  })

  describe("makeCINoResultsTile", () => {
    it("should create a no results tile", () => {
      const tile = makeCINoResultsTile()
      expect(tile.id).toBe("ci-noresults")
      expect(tile.previewUrl).toContain("data:image/svg+xml")
      expect(tile.data).toEqual({ type: "noresults" })
    })

    it("should include no results message", () => {
      const tile = makeCINoResultsTile()
      const decodedSvg = decodeURIComponent(tile.previewUrl)
      expect(decodedSvg).toContain("No matching CI resources")
    })
  })
})
