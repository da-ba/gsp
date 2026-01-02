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
      expect(result).toEqual({ cmd: "giphy", query: "", commandStart: 0 })
    })

    it("parses command with query", () => {
      const result = parseSlashCommand("/giphy cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats", commandStart: 0 })
    })

    it("parses command with multi-word query", () => {
      const result = parseSlashCommand("/giphy funny cats")
      expect(result).toEqual({ cmd: "giphy", query: "funny cats", commandStart: 0 })
    })

    it("parses command after leading whitespace", () => {
      const result = parseSlashCommand("  /giphy  cats  ")
      expect(result).toEqual({ cmd: "giphy", query: "cats", commandStart: 2 })
    })

    it("returns null for non-slash text", () => {
      expect(parseSlashCommand("hello")).toBeNull()
      expect(parseSlashCommand("")).toBeNull()
      expect(parseSlashCommand("giphy cats")).toBeNull()
    })

    it("converts command to lowercase", () => {
      const result = parseSlashCommand("/GIPHY cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats", commandStart: 0 })
    })

    it("parses command in middle of sentence", () => {
      const result = parseSlashCommand("here is /giphy cats for you")
      expect(result).toEqual({ cmd: "giphy", query: "cats for you", commandStart: 8 })
    })

    it("finds the last command when multiple exist", () => {
      const result = parseSlashCommand("/emoji smile /giphy cat")
      expect(result).toEqual({ cmd: "giphy", query: "cat", commandStart: 13 })
    })

    it("ignores slash not preceded by whitespace", () => {
      const result = parseSlashCommand("http://example.com /giphy test")
      expect(result).toEqual({ cmd: "giphy", query: "test", commandStart: 19 })
    })

    it("parses command at start with preceding text on same line", () => {
      const result = parseSlashCommand("text before /emoji")
      expect(result).toEqual({ cmd: "emoji", query: "", commandStart: 12 })
    })

    it("returns null for just a slash", () => {
      expect(parseSlashCommand("/")).toBeNull()
    })

    it("returns null for slash followed only by whitespace", () => {
      expect(parseSlashCommand("/   ")).toBeNull()
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
