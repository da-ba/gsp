/**
 * Tests for DOM utilities
 */

import { describe, it, expect, beforeEach } from "vitest"
import { isGitHubMarkdownField, getCursorInfo, parseSlashCommand, replaceRange } from "./dom.ts"

describe("DOM utilities", () => {
  describe("isGitHubMarkdownField", () => {
    it("returns true for textarea", () => {
      const textarea = document.createElement("textarea")
      expect(isGitHubMarkdownField(textarea)).toBe(true)
    })

    it("returns false for input", () => {
      const input = document.createElement("input")
      expect(isGitHubMarkdownField(input)).toBe(false)
    })

    it("returns false for div", () => {
      const div = document.createElement("div")
      expect(isGitHubMarkdownField(div)).toBe(false)
    })

    it("returns false for null", () => {
      expect(isGitHubMarkdownField(null)).toBe(false)
    })
  })

  describe("getCursorInfo", () => {
    let textarea: HTMLTextAreaElement

    beforeEach(() => {
      textarea = document.createElement("textarea")
      document.body.appendChild(textarea)
    })

    it("returns correct info for single line", () => {
      textarea.value = "hello world"
      textarea.selectionStart = 6
      textarea.selectionEnd = 6

      const info = getCursorInfo(textarea)
      expect(info.value).toBe("hello world")
      expect(info.pos).toBe(6)
      expect(info.lineStart).toBe(0)
      expect(info.line).toBe("hello ")
    })

    it("returns correct info for multiline at second line", () => {
      textarea.value = "first line\nsecond line"
      textarea.selectionStart = 18 // "second " position
      textarea.selectionEnd = 18

      const info = getCursorInfo(textarea)
      expect(info.lineStart).toBe(11)
      expect(info.line).toBe("second ")
    })

    it("handles cursor at start of line", () => {
      textarea.value = "first\nsecond"
      textarea.selectionStart = 6
      textarea.selectionEnd = 6

      const info = getCursorInfo(textarea)
      expect(info.lineStart).toBe(6)
      expect(info.line).toBe("")
    })
  })

  describe("parseSlashCommand", () => {
    it("parses simple command", () => {
      const result = parseSlashCommand("/giphy")
      expect(result).toEqual({ cmd: "giphy", query: "", slashOffset: 0 })
    })

    it("parses command with query", () => {
      const result = parseSlashCommand("/giphy cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats", slashOffset: 0 })
    })

    it("parses command with multi-word query", () => {
      const result = parseSlashCommand("/giphy funny cats")
      expect(result).toEqual({ cmd: "giphy", query: "funny cats", slashOffset: 0 })
    })

    it("parses command with leading whitespace", () => {
      const result = parseSlashCommand("  /giphy  cats  ")
      expect(result).toEqual({ cmd: "giphy", query: "cats", slashOffset: 2 })
    })

    it("returns null for non-slash text", () => {
      expect(parseSlashCommand("hello")).toBeNull()
      expect(parseSlashCommand("")).toBeNull()
      expect(parseSlashCommand("giphy cats")).toBeNull()
    })

    it("converts command to lowercase", () => {
      const result = parseSlashCommand("/GIPHY cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats", slashOffset: 0 })
    })

    it("returns empty cmd for just slash", () => {
      const result = parseSlashCommand("/")
      expect(result).toEqual({ cmd: "", query: "", slashOffset: 0 })
    })

    it("returns empty cmd for slash with only whitespace", () => {
      const result = parseSlashCommand("/   ")
      expect(result).toEqual({ cmd: "", query: "", slashOffset: 0 })
    })

    it("parses partial command name (not registered)", () => {
      // When user types "/mermai" (partial of "/mermaid")
      const result = parseSlashCommand("/mermai")
      expect(result).toEqual({ cmd: "mermai", query: "", slashOffset: 0 })
    })

    it("parses partial command name with trailing space", () => {
      // When user types "/mermai " (partial of "/mermaid ")
      const result = parseSlashCommand("/mermai ")
      expect(result).toEqual({ cmd: "mermai", query: "", slashOffset: 0 })
    })

    it("parses mid-sentence slash command", () => {
      const result = parseSlashCommand("Hello /giphy cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats", slashOffset: 6 })
    })

    it("parses mid-sentence slash command at start of word", () => {
      const result = parseSlashCommand("Check this /now")
      expect(result).toEqual({ cmd: "now", query: "", slashOffset: 11 })
    })

    it("parses mid-sentence slash command with just slash", () => {
      const result = parseSlashCommand("Hello /")
      expect(result).toEqual({ cmd: "", query: "", slashOffset: 6 })
    })

    it("parses mid-sentence command after multiple spaces", () => {
      const result = parseSlashCommand("Text   /emoji smile")
      expect(result).toEqual({ cmd: "emoji", query: "smile", slashOffset: 7 })
    })

    it("finds last slash in line with multiple slashes", () => {
      // If user types "path/to/file /giphy", only "/giphy" should be a command
      // because "path/to/file" has slashes not preceded by spaces
      const result = parseSlashCommand("path/to/file /giphy cat")
      expect(result).toEqual({ cmd: "giphy", query: "cat", slashOffset: 13 })
    })

    it("ignores slash not preceded by space (part of URL or path)", () => {
      // "https://example.com" has slashes but none preceded by space
      const result = parseSlashCommand("https://example.com")
      expect(result).toBeNull()
    })

    it("finds command after URL", () => {
      const result = parseSlashCommand("See https://example.com /link")
      expect(result).toEqual({ cmd: "link", query: "", slashOffset: 24 })
    })

    it("ignores HTML self-closing tag pattern", () => {
      // " />" in HTML like '<img src="url" />' should not be parsed as a command
      const result = parseSlashCommand('<img src="test.gif" />')
      expect(result).toBeNull()
    })

    it("ignores slash followed by special characters", () => {
      // Patterns like " />" should not match
      expect(parseSlashCommand("text />")).toBeNull()
      expect(parseSlashCommand("text /)")).toBeNull()
    })

    it("parses command in text with HTML before it", () => {
      // Real command after HTML should still work
      const result = parseSlashCommand('<p align="center"> /giphy cat')
      expect(result).toEqual({ cmd: "giphy", query: "cat", slashOffset: 19 })
    })
  })

  describe("replaceRange", () => {
    it("replaces text in middle", () => {
      const result = replaceRange("hello world", 6, 11, "there")
      expect(result).toBe("hello there")
    })

    it("replaces at start", () => {
      const result = replaceRange("hello world", 0, 5, "hi")
      expect(result).toBe("hi world")
    })

    it("replaces at end", () => {
      const result = replaceRange("hello world", 6, 11, "universe")
      expect(result).toBe("hello universe")
    })

    it("inserts when start equals end", () => {
      const result = replaceRange("hello", 5, 5, " world")
      expect(result).toBe("hello world")
    })
  })
})
