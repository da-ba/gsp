/**
 * //color slash command implementation
 *
 * Opens a native color picker and inserts hex color values.
 */

import { registerCommand, type CommandSpec } from "../registry.ts"
import {
  insertTextAtCursor,
  applyStyles,
  getCardStyles,
  getButtonStyles,
  getInputStyles,
} from "../../picker/index.ts"

const DEFAULT_COLOR = "#EDEDED"

export function normalizeHexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : DEFAULT_COLOR
}

function renderColorSetupPanel(bodyEl: HTMLElement, onComplete: () => void): void {
  const wrap = document.createElement("div")
  applyStyles(wrap, getCardStyles())
  wrap.style.display = "flex"
  wrap.style.flexDirection = "column"
  wrap.style.gap = "10px"

  const title = document.createElement("div")
  title.textContent = "Pick a color to insert as a hex code."

  const controls = document.createElement("div")
  controls.style.display = "flex"
  controls.style.gap = "10px"
  controls.style.alignItems = "center"

  const colorInput = document.createElement("input")
  colorInput.type = "color"
  colorInput.value = DEFAULT_COLOR.toLowerCase()
  colorInput.ariaLabel = "Color picker"
  colorInput.style.width = "44px"
  colorInput.style.height = "36px"
  colorInput.style.padding = "0"
  colorInput.style.border = "none"
  colorInput.style.background = "transparent"
  colorInput.style.cursor = "pointer"

  const hexInput = document.createElement("input")
  hexInput.type = "text"
  hexInput.value = DEFAULT_COLOR
  hexInput.placeholder = "#RRGGBB"
  hexInput.ariaLabel = "Hex color"
  applyStyles(hexInput, getInputStyles())

  colorInput.addEventListener("input", () => {
    hexInput.value = normalizeHexColor(colorInput.value)
  })

  const insert = (): void => {
    const normalized = normalizeHexColor(hexInput.value)
    insertTextAtCursor(normalized)
    onComplete()
  }

  hexInput.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      insert()
    }
  })

  const insertButton = document.createElement("button")
  insertButton.type = "button"
  insertButton.textContent = "Insert"
  insertButton.ariaLabel = "Insert color"
  applyStyles(insertButton, getButtonStyles())
  insertButton.addEventListener("click", insert)

  controls.append(colorInput, hexInput, insertButton)
  wrap.append(title, controls)
  bodyEl.appendChild(wrap)
}

const colorCommand: CommandSpec = {
  preflight: async () => ({
    showSetup: true,
    message: "Pick a color to insert",
    renderSetup: renderColorSetupPanel,
  }),
  getEmptyState: async () => ({ items: [] }),
  getResults: async () => ({ items: [] }),
  renderItems: () => {},
  onSelect: () => {},
}

registerCommand("color", colorCommand, {
  icon: "🎨",
  description: "Pick and insert hex color codes",
})

export { colorCommand, DEFAULT_COLOR }
