/**
 * Tests for link command API utilities
 */

import { describe, it, expect } from "vitest"
import {
  extractDomain,
  normalizeUrl,
  isLikelyUrl,
  parseLinkQuery,
  formatMarkdownLink,
} from "./api.ts"

describe("link API", () => {
  describe("extractDomain", () => {
    it("should extract domain from full URL", () => {
      expect(extractDomain("https://example.com/path")).toBe("example.com")
    })

    it("should extract domain from URL with www", () => {
      expect(extractDomain("https://www.example.com/path")).toBe("example.com")
    })

    it("should extract domain from URL without protocol", () => {
      expect(extractDomain("example.com/path")).toBe("example.com")
    })

    it("should extract domain with www without protocol", () => {
      expect(extractDomain("www.example.com")).toBe("example.com")
    })

    it("should handle subdomains", () => {
      expect(extractDomain("https://blog.example.com")).toBe("blog.example.com")
    })

    it("should handle complex URLs", () => {
      expect(extractDomain("https://example.com:8080/path?query=1")).toBe("example.com")
    })

    it("should return input for invalid URLs", () => {
      expect(extractDomain("not-a-url")).toBe("not-a-url")
    })
  })

  describe("normalizeUrl", () => {
    it("should add https:// to bare domain", () => {
      expect(normalizeUrl("example.com")).toBe("https://example.com")
    })

    it("should preserve existing https://", () => {
      expect(normalizeUrl("https://example.com")).toBe("https://example.com")
    })

    it("should preserve existing http://", () => {
      expect(normalizeUrl("http://example.com")).toBe("http://example.com")
    })

    it("should preserve other protocols", () => {
      expect(normalizeUrl("ftp://files.example.com")).toBe("ftp://files.example.com")
    })

    it("should handle empty string", () => {
      expect(normalizeUrl("")).toBe("")
    })

    it("should trim whitespace", () => {
      expect(normalizeUrl("  example.com  ")).toBe("https://example.com")
    })
  })

  describe("isLikelyUrl", () => {
    it("should return true for URL with protocol", () => {
      expect(isLikelyUrl("https://example.com")).toBe(true)
    })

    it("should return true for domain with TLD", () => {
      expect(isLikelyUrl("example.com")).toBe(true)
    })

    it("should return true for domain with path", () => {
      expect(isLikelyUrl("example.com/path")).toBe(true)
    })

    it("should return false for plain text", () => {
      expect(isLikelyUrl("hello world")).toBe(false)
    })

    it("should return false for empty string", () => {
      expect(isLikelyUrl("")).toBe(false)
    })

    it("should return false for text without dots", () => {
      expect(isLikelyUrl("example")).toBe(false)
    })
  })

  describe("parseLinkQuery", () => {
    it("should parse bare URL", () => {
      const result = parseLinkQuery("example.com")
      expect(result.url).toBe("https://example.com")
      expect(result.title).toBe("example.com")
      expect(result.isValid).toBe(true)
    })

    it("should parse URL with protocol", () => {
      const result = parseLinkQuery("https://example.com/path")
      expect(result.url).toBe("https://example.com/path")
      expect(result.title).toBe("example.com")
      expect(result.isValid).toBe(true)
    })

    it("should parse URL with double-quoted title", () => {
      const result = parseLinkQuery('example.com "My Title"')
      expect(result.url).toBe("https://example.com")
      expect(result.title).toBe("My Title")
      expect(result.isValid).toBe(true)
    })

    it("should parse URL with single-quoted title", () => {
      const result = parseLinkQuery("example.com 'My Title'")
      expect(result.url).toBe("https://example.com")
      expect(result.title).toBe("My Title")
      expect(result.isValid).toBe(true)
    })

    it("should handle URL with path and title", () => {
      const result = parseLinkQuery('https://example.com/some/path "Link to Path"')
      expect(result.url).toBe("https://example.com/some/path")
      expect(result.title).toBe("Link to Path")
      expect(result.isValid).toBe(true)
    })

    it("should return invalid for empty query", () => {
      const result = parseLinkQuery("")
      expect(result.isValid).toBe(false)
    })

    it("should return invalid for non-URL text", () => {
      const result = parseLinkQuery("hello world")
      expect(result.isValid).toBe(false)
    })

    it("should handle whitespace in query", () => {
      const result = parseLinkQuery("  example.com  ")
      expect(result.url).toBe("https://example.com")
      expect(result.isValid).toBe(true)
    })
  })

  describe("formatMarkdownLink", () => {
    it("should format basic markdown link", () => {
      expect(formatMarkdownLink("https://example.com", "Example")).toBe(
        "[Example](https://example.com)"
      )
    })

    it("should use domain as title if title is empty", () => {
      expect(formatMarkdownLink("https://example.com", "")).toBe(
        "[example.com](https://example.com)"
      )
    })

    it("should normalize URL without protocol", () => {
      expect(formatMarkdownLink("example.com", "Example")).toBe("[Example](https://example.com)")
    })

    it("should return empty string for empty URL", () => {
      expect(formatMarkdownLink("", "Title")).toBe("")
    })

    it("should handle URL with path", () => {
      expect(formatMarkdownLink("https://example.com/path", "Link")).toBe(
        "[Link](https://example.com/path)"
      )
    })
  })
})
