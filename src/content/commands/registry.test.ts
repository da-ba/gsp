/**
 * Tests for command registry
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { registerCommand, getCommand, getCommandMetadata, listCommands } from "./registry.ts"
import type { CommandSpec } from "./registry.ts"

describe("command registry", () => {
  const mockCommand: CommandSpec = {
    preflight: vi.fn().mockResolvedValue({ showSetup: false }),
    getEmptyState: vi.fn().mockResolvedValue({ items: [] }),
    getResults: vi.fn().mockResolvedValue({ items: [] }),
    renderItems: vi.fn(),
    renderCurrent: vi.fn(),
    onSelect: vi.fn(),
  }

  describe("registerCommand", () => {
    it("registers a command", () => {
      registerCommand("test", mockCommand)
      const cmd = getCommand("test")
      expect(cmd).toBe(mockCommand)
    })

    it("registers command metadata", () => {
      registerCommand("test-meta", mockCommand, {
        icon: "🧪",
        description: "test metadata",
      })

      expect(getCommandMetadata("test-meta")).toEqual({
        icon: "🧪",
        description: "test metadata",
      })
    })
  })

  describe("getCommand", () => {
    beforeEach(() => {
      registerCommand("mycommand", mockCommand)
    })

    it("returns registered command", () => {
      const cmd = getCommand("mycommand")
      expect(cmd).toBe(mockCommand)
    })

    it("returns null for unknown command", () => {
      const cmd = getCommand("unknown")
      expect(cmd).toBeNull()
    })

    it("returns null for empty string", () => {
      const cmd = getCommand("")
      expect(cmd).toBeNull()
    })
  })

  describe("listCommands", () => {
    it("returns registered command names", () => {
      registerCommand("list-test", mockCommand)
      expect(listCommands()).toContain("list-test")
    })
  })
})
