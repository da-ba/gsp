/**
 * Tests for hint tooltip
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { resetMockStorage } from "../test/setup.ts"

// Must import after test setup has mocked chrome
import {
  loadDismissedState,
  showHintTooltip,
  hideHintTooltip,
  refreshHintTooltipStyles,
} from "./hint-tooltip.ts"

function createTextarea(): HTMLTextAreaElement {
  const el = document.createElement("textarea")
  document.body.appendChild(el)
  // Give it dimensions so getBoundingClientRect returns values
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () => ({
      top: 100,
      left: 50,
      right: 400,
      bottom: 250,
      width: 350,
      height: 150,
    }),
  })
  return el
}

describe("hint-tooltip", () => {
  beforeEach(() => {
    resetMockStorage()
    // Reset DOM
    const existing = document.getElementById("slashPaletteHintTooltip")
    if (existing) existing.remove()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    hideHintTooltip()
    // Clean up textareas
    document.querySelectorAll("textarea").forEach((el) => el.remove())
  })

  it("shows tooltip after delay when field is focused", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)

    // Not visible immediately
    expect(document.getElementById("slashPaletteHintTooltip")).toBeNull()

    // Advance past show delay
    vi.advanceTimersByTime(700)

    const tooltip = document.getElementById("slashPaletteHintTooltip")
    expect(tooltip).not.toBeNull()
    expect(tooltip!.textContent).toContain("//")
    expect(tooltip!.textContent).toContain("commands")
  })

  it("does not show tooltip when dismissed", async () => {
    // Set dismissed state in storage
    await chrome.storage.local.set({ hintTooltipDismissed: true })
    await loadDismissedState()

    const field = createTextarea()
    showHintTooltip(field)

    vi.advanceTimersByTime(700)

    expect(document.getElementById("slashPaletteHintTooltip")).toBeNull()
  })

  it("hides tooltip when hideHintTooltip is called", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)
    vi.advanceTimersByTime(700)

    expect(document.getElementById("slashPaletteHintTooltip")).not.toBeNull()

    hideHintTooltip()

    // Advance past fade-out
    vi.advanceTimersByTime(200)

    expect(document.getElementById("slashPaletteHintTooltip")).toBeNull()
  })

  it("auto-hides after delay", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)
    vi.advanceTimersByTime(700)

    expect(document.getElementById("slashPaletteHintTooltip")).not.toBeNull()

    // Advance past auto-hide delay
    vi.advanceTimersByTime(8100)

    expect(document.getElementById("slashPaletteHintTooltip")).toBeNull()
  })

  it("tooltip has dismiss button", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)
    vi.advanceTimersByTime(700)

    const tooltip = document.getElementById("slashPaletteHintTooltip")
    expect(tooltip).not.toBeNull()

    const btn = tooltip!.querySelector("button")
    expect(btn).not.toBeNull()
    expect(btn!.getAttribute("aria-label")).toBe("Dismiss hint")
  })

  it("dismiss button stores dismissed state", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)
    vi.advanceTimersByTime(700)

    const tooltip = document.getElementById("slashPaletteHintTooltip")
    const btn = tooltip!.querySelector("button")!
    btn.click()

    // Advance timers for fade-out
    vi.advanceTimersByTime(200)

    // Storage should be updated
    const stored = await chrome.storage.local.get({ hintTooltipDismissed: false })
    expect(stored.hintTooltipDismissed).toBe(true)
  })

  it("refreshHintTooltipStyles does not throw when no tooltip", () => {
    expect(() => refreshHintTooltipStyles()).not.toThrow()
  })

  it("cancels show if hideHintTooltip is called before delay", async () => {
    await loadDismissedState()
    const field = createTextarea()

    showHintTooltip(field)

    // Hide before show delay completes
    vi.advanceTimersByTime(300)
    hideHintTooltip()
    vi.advanceTimersByTime(500)

    expect(document.getElementById("slashPaletteHintTooltip")).toBeNull()
  })
})
