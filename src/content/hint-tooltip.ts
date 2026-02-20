/**
 * Hint tooltip that appears near qualifying textareas
 * to inform users they can type "//" to open the command list.
 */

import { COMMAND_PREFIX } from "../utils/command-prefix.ts"
import { getStorageValue, setStorageValue } from "../utils/storage.ts"
import { isDarkMode } from "../utils/theme.ts"
import { fontSystemUi, fontSansSerif } from "../utils/theme.ts"

const DISMISSED_KEY = "hintTooltipDismissed"
const TOOLTIP_ID = "slashPaletteHintTooltip"
const SHOW_DELAY = 600
const AUTO_HIDE_DELAY = 8000

let tooltipEl: HTMLElement | null = null
let activeField: HTMLTextAreaElement | null = null
let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let dismissed = false

/**
 * Load dismissed state from storage
 */
export async function loadDismissedState(): Promise<void> {
  dismissed = await getStorageValue<boolean>(DISMISSED_KEY, false)
}

/**
 * Apply theme-aware styles to the tooltip element
 */
function applyTooltipStyles(el: HTMLElement): void {
  const dark = isDarkMode()

  el.style.position = "absolute"
  el.style.zIndex = "999998"
  el.style.padding = "6px 10px"
  el.style.borderRadius = "6px"
  el.style.fontSize = "12px"
  el.style.fontFamily = fontSystemUi() + ", " + fontSansSerif()
  el.style.pointerEvents = "auto"
  el.style.whiteSpace = "nowrap"
  el.style.display = "flex"
  el.style.alignItems = "center"
  el.style.gap = "6px"
  el.style.transition = "opacity 150ms"

  if (dark) {
    el.style.backgroundColor = "#161b22"
    el.style.color = "#8d96a0"
    el.style.border = "1px solid #3d444d"
    el.style.boxShadow = "0 2px 8px rgba(1,4,9,0.6)"
  } else {
    el.style.backgroundColor = "#ffffff"
    el.style.color = "#656d76"
    el.style.border = "1px solid #d0d7de"
    el.style.boxShadow = "0 2px 8px rgba(140,149,159,0.15)"
  }
}

/**
 * Create the tooltip element
 */
function createTooltip(): HTMLElement {
  const el = document.createElement("div")
  el.id = TOOLTIP_ID
  el.setAttribute("role", "tooltip")

  const text = document.createElement("span")
  text.textContent = `Type ${COMMAND_PREFIX} for commands`

  const closeBtn = document.createElement("button")
  closeBtn.textContent = "\u00D7"
  closeBtn.setAttribute("aria-label", "Dismiss hint")
  closeBtn.style.background = "none"
  closeBtn.style.border = "none"
  closeBtn.style.cursor = "pointer"
  closeBtn.style.padding = "0 2px"
  closeBtn.style.fontSize = "14px"
  closeBtn.style.lineHeight = "1"
  closeBtn.style.color = "inherit"
  closeBtn.style.opacity = "0.6"

  closeBtn.addEventListener("mouseenter", () => {
    closeBtn.style.opacity = "1"
  })
  closeBtn.addEventListener("mouseleave", () => {
    closeBtn.style.opacity = "0.6"
  })
  closeBtn.addEventListener("click", (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    dismissHint()
  })

  // Prevent focus steal from textarea
  el.addEventListener("mousedown", (ev) => {
    ev.preventDefault()
  })

  el.appendChild(text)
  el.appendChild(closeBtn)

  return el
}

/**
 * Position the tooltip near the given textarea
 */
function positionTooltip(el: HTMLElement, field: HTMLTextAreaElement): void {
  const rect = field.getBoundingClientRect()
  const scrollX = window.scrollX || document.documentElement.scrollLeft
  const scrollY = window.scrollY || document.documentElement.scrollTop

  // Position at top-right corner of the textarea
  el.style.top = `${rect.top + scrollY - el.offsetHeight - 4}px`
  el.style.left = `${rect.right + scrollX - el.offsetWidth}px`

  // If tooltip goes above viewport, position below the textarea instead
  const topVal = parseFloat(el.style.top)
  if (topVal < scrollY) {
    el.style.top = `${rect.bottom + scrollY + 4}px`
  }
}

/**
 * Show the hint tooltip for a textarea
 */
export function showHintTooltip(field: HTMLTextAreaElement): void {
  if (dismissed) return

  // Clear any pending timers
  clearTimers()

  activeField = field

  showTimer = setTimeout(() => {
    if (activeField !== field) return

    if (!tooltipEl) {
      tooltipEl = createTooltip()
    }

    applyTooltipStyles(tooltipEl)
    tooltipEl.style.opacity = "0"

    // Mount into the same container strategy as the picker
    const mount = field.closest(
      [
        "details-dialog",
        "dialog",
        "[role='dialog']",
        ".Overlay",
        ".Popover",
        ".SelectMenu",
        ".SelectMenu-modal",
        ".details-overlay",
        "details",
      ].join(", ")
    ) as HTMLElement | null

    const container = mount || document.body
    if (tooltipEl.parentElement !== container) {
      container.appendChild(tooltipEl)
    }

    // Position after appending so we can measure
    positionTooltip(tooltipEl, field)

    // Fade in
    requestAnimationFrame(() => {
      if (tooltipEl) tooltipEl.style.opacity = "1"
    })

    // Auto-hide after delay
    hideTimer = setTimeout(() => {
      hideHintTooltip()
    }, AUTO_HIDE_DELAY)
  }, SHOW_DELAY)
}

/**
 * Hide the hint tooltip
 */
export function hideHintTooltip(): void {
  clearTimers()
  activeField = null

  if (tooltipEl) {
    tooltipEl.style.opacity = "0"
    setTimeout(() => {
      if (tooltipEl && tooltipEl.parentElement) {
        tooltipEl.parentElement.removeChild(tooltipEl)
      }
    }, 150)
  }
}

/**
 * Permanently dismiss the hint tooltip
 */
async function dismissHint(): Promise<void> {
  dismissed = true
  hideHintTooltip()
  await setStorageValue(DISMISSED_KEY, true)
}

/**
 * Update tooltip styles when theme changes
 */
export function refreshHintTooltipStyles(): void {
  if (tooltipEl && tooltipEl.parentElement) {
    applyTooltipStyles(tooltipEl)
  }
}

/**
 * Clear all pending timers
 */
function clearTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}
