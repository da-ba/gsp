import { describe, it, expect, vi, beforeEach } from "vitest"
import { colorCommand, DEFAULT_COLOR, normalizeHexColor } from "./command.ts"

const { insertTextAtCursor } = vi.hoisted(() => ({
  insertTextAtCursor: vi.fn(),
}))

vi.mock("../../picker/index.ts", () => ({
  insertTextAtCursor,
  applyStyles: vi.fn(),
  getCardStyles: () => ({}),
  getButtonStyles: () => ({}),
  getInputStyles: () => ({}),
}))

describe("color command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens setup panel in preflight", async () => {
    const result = await colorCommand.preflight()
    expect(result.showSetup).toBe(true)
    expect(result.renderSetup).toBeDefined()
  })

  it("normalizes valid hex colors to uppercase", () => {
    expect(normalizeHexColor("#abc123")).toBe("#ABC123")
  })

  it("falls back to default color for invalid values", () => {
    expect(normalizeHexColor("abc")).toBe(DEFAULT_COLOR)
    expect(normalizeHexColor("#abc")).toBe(DEFAULT_COLOR)
  })

  it("inserts selected color from setup panel", async () => {
    const result = await colorCommand.preflight()
    const body = document.createElement("div")
    const onComplete = vi.fn()

    result.renderSetup?.(body, onComplete)

    const input = body.querySelector('input[type="text"]') as HTMLInputElement | null
    const button = body.querySelector("button") as HTMLButtonElement | null
    expect(input).toBeTruthy()
    expect(button).toBeTruthy()

    if (!input || !button) {
      throw new Error("setup controls not rendered")
    }

    input.value = "#00ff00"
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    expect(insertTextAtCursor).toHaveBeenCalledWith("#00FF00")
    expect(onComplete).toHaveBeenCalled()
  })
})
