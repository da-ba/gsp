/**
 * Shared token/API key input form component.
 *
 * Used by commands that require API keys or tokens (giphy, link, etc.)
 * to provide a consistent UI for configuring credentials.
 */

import { getBadgeStyles, getInputStyles, applyStyles } from "./styles.ts"

export type TokenFormConfig = {
  /** Label text for the form */
  label: string
  /** Description HTML (can include links) */
  description: string
  /** Placeholder text for the input */
  placeholder: string
  /** Button text for save action */
  saveButtonText?: string
  /** Show clear button */
  showClear?: boolean
  /** Load and display current value (masked) */
  loadCurrentValue?: () => Promise<string>
  /** Save handler - receives the new value */
  onSave: (value: string) => Promise<void>
  /** Clear handler */
  onClear?: () => Promise<void>
  /** Optional callback after save completes */
  onSaveComplete?: () => void
}

/**
 * Mask a token/key for display (shows first 4 and last 4 chars).
 */
export function maskToken(value: string): string {
  if (!value || value.length < 10) return value
  return value.slice(0, 4) + "…" + value.slice(-4)
}

/**
 * Render a token input form into a container element.
 */
export function renderTokenForm(container: HTMLElement, config: TokenFormConfig): void {
  const section = document.createElement("div")
  section.style.display = "flex"
  section.style.flexDirection = "column"
  section.style.gap = "8px"

  // Label
  const label = document.createElement("div")
  label.textContent = config.label
  label.style.fontWeight = "600"
  section.appendChild(label)

  // Description
  const desc = document.createElement("div")
  desc.style.fontSize = "12px"
  desc.style.opacity = "0.72"
  desc.innerHTML = config.description
  section.appendChild(desc)

  // Input
  const input = document.createElement("input")
  input.type = "text"
  input.placeholder = config.placeholder
  applyStyles(input, getInputStyles())
  section.appendChild(input)

  // Load current value if requested
  if (config.loadCurrentValue) {
    config.loadCurrentValue().then((value) => {
      if (value) {
        input.value = maskToken(value)
      }
    })
  }

  // Button row
  const btnRow = document.createElement("div")
  btnRow.style.display = "flex"
  btnRow.style.gap = "8px"

  // Save button
  const saveBtn = document.createElement("button")
  saveBtn.type = "button"
  saveBtn.setAttribute("data-settings-action", "true")
  saveBtn.textContent = config.saveButtonText || "Save"
  applyStyles(saveBtn, getBadgeStyles())
  saveBtn.style.cursor = "pointer"
  saveBtn.style.padding = "6px 12px"
  btnRow.appendChild(saveBtn)

  // Clear button (optional)
  if (config.showClear && config.onClear) {
    const clearBtn = document.createElement("button")
    clearBtn.type = "button"
    clearBtn.setAttribute("data-settings-action", "true")
    clearBtn.textContent = "Clear"
    applyStyles(clearBtn, getBadgeStyles())
    clearBtn.style.cursor = "pointer"
    clearBtn.style.padding = "6px 12px"
    clearBtn.style.opacity = "0.72"
    btnRow.appendChild(clearBtn)

    clearBtn.addEventListener("click", async (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      await config.onClear!()
      input.value = ""
      msg.textContent = "Cleared"
    })
  }

  section.appendChild(btnRow)

  // Status message
  const msg = document.createElement("div")
  msg.style.fontSize = "12px"
  msg.style.opacity = "0.72"
  section.appendChild(msg)

  // Save handler
  saveBtn.addEventListener("click", async (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    const val = input.value.trim()

    // Don't save masked values
    if (val.includes("…")) {
      msg.textContent = "Enter a new value to save"
      return
    }

    if (!val) {
      msg.textContent = "Please enter a value"
      return
    }

    msg.textContent = "Saving…"
    try {
      await config.onSave(val)
      msg.textContent = "Saved!"
      input.value = maskToken(val)
      config.onSaveComplete?.()
    } catch (err) {
      msg.textContent = "Error saving"
    }
  })

  container.appendChild(section)
}
