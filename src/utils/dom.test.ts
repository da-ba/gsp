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
      expect(result).toEqual({ cmd: "giphy", query: "" })
    })

    it("parses command with query", () => {
      const result = parseSlashCommand("/giphy cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats" })
    })

    it("parses command with multi-word query", () => {
      const result = parseSlashCommand("/giphy funny cats")
      expect(result).toEqual({ cmd: "giphy", query: "funny cats" })
    })

    it("trims whitespace", () => {
      const result = parseSlashCommand("  /giphy  cats  ")
      expect(result).toEqual({ cmd: "giphy", query: "cats" })
    })

    it("returns null for non-slash text", () => {
      expect(parseSlashCommand("hello")).toBeNull()
      expect(parseSlashCommand("")).toBeNull()
      expect(parseSlashCommand("giphy cats")).toBeNull()
    })

    it("converts command to lowercase", () => {
      const result = parseSlashCommand("/GIPHY cats")
      expect(result).toEqual({ cmd: "giphy", query: "cats" })
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
