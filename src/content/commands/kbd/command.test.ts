/**
 * Tests for kbd command
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  kbdCommand,
  COMMON_SHORTCUTS,
  KEY_ALIASES,
  normalizeKey,
  parseKeys,
  formatKbdHtml,
  inputToKbdHtml,
  type KeyboardShortcut,
} from "./command.ts"
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
  calculateBadgeWidth: (text: string) => text.length * 8 + 16,
}))

describe("kbd command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("KEY_ALIASES", () => {
    it("should have Mac modifier aliases", () => {
      expect(KEY_ALIASES["cmd"]).toBe("⌘")
      expect(KEY_ALIASES["command"]).toBe("⌘")
      expect(KEY_ALIASES["opt"]).toBe("⌥")
      expect(KEY_ALIASES["option"]).toBe("⌥")
    })

    it("should have Windows/Linux modifier aliases", () => {
      expect(KEY_ALIASES["win"]).toBe("Win")
      expect(KEY_ALIASES["windows"]).toBe("Win")
      expect(KEY_ALIASES["alt"]).toBe("Alt")
    })

    it("should have arrow key aliases", () => {
      expect(KEY_ALIASES["arrowleft"]).toBe("←")
      expect(KEY_ALIASES["arrowright"]).toBe("→")
      expect(KEY_ALIASES["arrowup"]).toBe("↑")
      expect(KEY_ALIASES["arrowdown"]).toBe("↓")
    })

    it("should have special key aliases", () => {
      expect(KEY_ALIASES["enter"]).toBe("Enter")
      expect(KEY_ALIASES["tab"]).toBe("Tab")
      expect(KEY_ALIASES["esc"]).toBe("Esc")
      expect(KEY_ALIASES["backspace"]).toBe("⌫")
    })
  })

  describe("normalizeKey", () => {
    it("should normalize alias keys", () => {
      expect(normalizeKey("cmd")).toBe("⌘")
      expect(normalizeKey("CMD")).toBe("⌘")
      expect(normalizeKey("Cmd")).toBe("⌘")
    })

    it("should normalize arrow keys", () => {
      expect(normalizeKey("arrowLeft")).toBe("←")
      expect(normalizeKey("arrowRight")).toBe("→")
      expect(normalizeKey("left")).toBe("←")
      expect(normalizeKey("right")).toBe("→")
    })

    it("should handle function keys", () => {
      expect(normalizeKey("f1")).toBe("F1")
      expect(normalizeKey("F12")).toBe("F12")
    })

    it("should uppercase single characters", () => {
      expect(normalizeKey("p")).toBe("P")
      expect(normalizeKey("a")).toBe("A")
      expect(normalizeKey("1")).toBe("1")
    })

    it("should capitalize first letter of unknown keys", () => {
      expect(normalizeKey("somekey")).toBe("Somekey")
    })

    it("should trim whitespace", () => {
      expect(normalizeKey("  ctrl  ")).toBe("⌃")
      expect(normalizeKey(" p ")).toBe("P")
    })
  })

  describe("parseKeys", () => {
    it("should parse keys without spaces", () => {
      const keys = parseKeys("Ctrl+P")
      expect(keys).toEqual(["⌃", "P"])
    })

    it("should parse keys with spaces around +", () => {
      const keys = parseKeys("ctrl + p")
      expect(keys).toEqual(["⌃", "P"])
    })

    it("should parse multiple modifiers", () => {
      const keys = parseKeys("Ctrl+Shift+Alt+P")
      expect(keys).toEqual(["⌃", "⇧", "Alt", "P"])
    })

    it("should parse Mac modifiers", () => {
      const keys = parseKeys("cmd+opt+arrowLeft")
      expect(keys).toEqual(["⌘", "⌥", "←"])
    })

    it("should parse Windows modifiers", () => {
      const keys = parseKeys("Win+alt+shift+p")
      expect(keys).toEqual(["Win", "Alt", "⇧", "P"])
    })

    it("should handle alternative keys with slash notation", () => {
      const keys = parseKeys("fn+1/2/3")
      expect(keys).toEqual(["fn", "1/2/3"])
    })

    it("should handle command with alternative keys", () => {
      const keys = parseKeys("command+fn+1/2/3")
      expect(keys).toEqual(["⌘", "fn", "1/2/3"])
    })
  })

  describe("formatKbdHtml", () => {
    it("should wrap each key in kbd tags", () => {
      const html = formatKbdHtml(["⌃", "P"])
      expect(html).toBe("<kbd>⌃</kbd><kbd>P</kbd>")
    })

    it("should handle multiple keys", () => {
      const html = formatKbdHtml(["⌘", "⌥", "←"])
      expect(html).toBe("<kbd>⌘</kbd><kbd>⌥</kbd><kbd>←</kbd>")
    })

    it("should handle alternative keys", () => {
      const html = formatKbdHtml(["fn", "1/2/3"])
      expect(html).toBe("<kbd>fn</kbd><kbd>1/2/3</kbd>")
    })
  })

  describe("inputToKbdHtml", () => {
    it("should convert ctrl+p to kbd HTML", () => {
      const html = inputToKbdHtml("ctrl+p")
      expect(html).toBe("<kbd>⌃</kbd><kbd>P</kbd>")
    })

    it("should convert ctrl + p with spaces to kbd HTML", () => {
      const html = inputToKbdHtml("ctrl + p")
      expect(html).toBe("<kbd>⌃</kbd><kbd>P</kbd>")
    })

    it("should convert Mac shortcuts to kbd HTML", () => {
      const html = inputToKbdHtml("cmd+opt+arrowLeft")
      expect(html).toBe("<kbd>⌘</kbd><kbd>⌥</kbd><kbd>←</kbd>")
    })

    it("should convert Windows shortcuts to kbd HTML", () => {
      const html = inputToKbdHtml("Win+alt+shift+p")
      expect(html).toBe("<kbd>Win</kbd><kbd>Alt</kbd><kbd>⇧</kbd><kbd>P</kbd>")
    })

    it("should handle alternative keys", () => {
      const html = inputToKbdHtml("command+fn+1/2/3")
      expect(html).toBe("<kbd>⌘</kbd><kbd>fn</kbd><kbd>1/2/3</kbd>")
    })
  })

  describe("COMMON_SHORTCUTS", () => {
    it("should have editing shortcuts", () => {
      const editing = COMMON_SHORTCUTS.filter((s) => s.category === "editing")
      expect(editing.length).toBeGreaterThan(0)
      expect(editing.map((s) => s.id)).toContain("copy")
      expect(editing.map((s) => s.id)).toContain("paste")
    })

    it("should have navigation shortcuts", () => {
      const navigation = COMMON_SHORTCUTS.filter((s) => s.category === "navigation")
      expect(navigation.length).toBeGreaterThan(0)
      expect(navigation.map((s) => s.id)).toContain("newtab")
    })

    it("should have system shortcuts", () => {
      const system = COMMON_SHORTCUTS.filter((s) => s.category === "system")
      expect(system.length).toBeGreaterThan(0)
      expect(system.map((s) => s.id)).toContain("desktop")
    })

    it("should have valid input formats", () => {
      COMMON_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut.input).toBeDefined()
        expect(shortcut.input.length).toBeGreaterThan(0)
        // Should be parseable
        const keys = parseKeys(shortcut.input)
        expect(keys.length).toBeGreaterThan(0)
      })
    })
  })

  describe("preflight", () => {
    it("should not require setup", async () => {
      const result = await kbdCommand.preflight()
      expect(result.showSetup).toBe(false)
    })
  })

  describe("getEmptyState", () => {
    it("should return all common shortcuts", async () => {
      const result = await kbdCommand.getEmptyState()
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBe(COMMON_SHORTCUTS.length)
    })

    it("should include suggest items", async () => {
      const result = await kbdCommand.getEmptyState()
      expect(result.suggest).toBeDefined()
      expect(result.suggest!.length).toBeGreaterThan(0)
    })

    it("should return suggest title", async () => {
      const result = await kbdCommand.getEmptyState()
      expect(result.suggestTitle).toBe("Common shortcuts")
    })
  })

  describe("getResults", () => {
    it("should filter shortcuts by label", async () => {
      const result = await kbdCommand.getResults("copy")
      expect(result.items).toBeDefined()
      const ids = result.items!.map((item) => item.id)
      expect(ids).toContain("copy")
    })

    it("should filter shortcuts by category", async () => {
      const result = await kbdCommand.getResults("editing")
      expect(result.items).toBeDefined()
      // Should include some editing shortcuts
      const hasEditing = result.items!.some((item) => {
        const shortcut = item.data as KeyboardShortcut
        return shortcut.category === "editing"
      })
      expect(hasEditing).toBe(true)
    })

    it("should return all shortcuts for empty query", async () => {
      const result = await kbdCommand.getResults("")
      expect(result.items!.length).toBe(COMMON_SHORTCUTS.length)
    })

    it("should create custom shortcut for modifier input", async () => {
      const result = await kbdCommand.getResults("ctrl+shift+t")
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBeGreaterThan(0)
      // First item should be custom input
      expect(result.items![0]!.id).toBe("custom-input")
    })

    it("should create custom shortcut for known key input", async () => {
      const result = await kbdCommand.getResults("cmd+p")
      expect(result.items).toBeDefined()
      expect(result.items!.length).toBeGreaterThan(0)
      // Should have custom input as first item
      expect(result.items![0]!.id).toBe("custom-input")
    })
  })

  describe("picker items", () => {
    it("should create picker items with preview URLs", async () => {
      const result = await kbdCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        expect(item.id).toBeDefined()
        expect(item.previewUrl).toContain("data:image/svg+xml")
        expect(item.data).toBeDefined()
      })
    })

    it("should include shortcut data in picker items", async () => {
      const result = await kbdCommand.getEmptyState()
      result.items!.forEach((item: PickerItem) => {
        const shortcut = item.data as KeyboardShortcut
        expect(shortcut.id).toBeDefined()
        expect(shortcut.category).toBeDefined()
        expect(shortcut.label).toBeDefined()
        expect(shortcut.input).toBeDefined()
      })
    })
  })

  describe("noResultsMessage", () => {
    it("should have a helpful no results message", () => {
      expect(kbdCommand.noResultsMessage).toBeDefined()
      expect(kbdCommand.noResultsMessage).toContain("ctrl+p")
    })
  })
})
