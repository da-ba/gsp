/**
 * Hint tooltip shown near qualifying markdown textareas.
 * Displays a small indicator hinting to type "//" to open the command list.
 */

import { isDarkMode, fontSystemUi, fontSansSerif } from "../utils/theme.ts"
import { COMMAND_PREFIX } from "../utils/command-prefix.ts"

let tooltipEl: HTMLElement | null = null

function applyTooltipStyles(el: HTMLElement): void {
  const dark = isDarkMode()
  el.style.position = "fixed"
  el.style.zIndex = "999998"
  el.style.fontSize = "12px"
  el.style.padding = "3px 7px"
  el.style.borderRadius = "4px"
  el.style.pointerEvents = "none"
  el.style.whiteSpace = "nowrap"
  el.style.fontFamily = fontSystemUi() + ", " + fontSansSerif()
  el.style.color = dark ? "#8d96a0" : "#656d76"
  el.style.border = `1px solid ${dark ? "#3d444d" : "#d0d7de"}`
  el.style.backgroundColor = dark ? "#161b22" : "#ffffff"
  el.style.boxShadow = dark
    ? "0 2px 8px rgba(1,4,9,0.4)"
    : "0 2px 8px rgba(140,149,159,0.15)"
}

function ensureTooltip(): HTMLElement {
  if (!tooltipEl || !document.body.contains(tooltipEl)) {
    const el = document.createElement("div")
    el.id = "slashPaletteHint"
    el.textContent = `Type ${COMMAND_PREFIX} for commands`
    el.style.display = "none"
    applyTooltipStyles(el)
    document.body.appendChild(el)
    tooltipEl = el
  }
  return tooltipEl
}

function positionTooltip(field: HTMLTextAreaElement): void {
  const el = tooltipEl
  if (!el) return
  const rect = field.getBoundingClientRect()
  const elWidth = el.offsetWidth || 160
  const left = Math.max(0, rect.right - elWidth)
  const top = rect.bottom + 4
  el.style.left = `${left}px`
  el.style.top = `${top}px`
}

export function showHintTooltip(field: HTMLTextAreaElement): void {
  const el = ensureTooltip()
  applyTooltipStyles(el)
  el.style.display = "block"
  positionTooltip(field)
}

export function hideHintTooltip(): void {
  if (tooltipEl) {
    tooltipEl.style.display = "none"
  }
}

export function repositionHintTooltip(field: HTMLTextAreaElement): void {
  if (!tooltipEl || tooltipEl.style.display === "none") return
  positionTooltip(field)
}

export function refreshHintTooltipTheme(): void {
  if (tooltipEl && tooltipEl.style.display !== "none") {
    applyTooltipStyles(tooltipEl)
  }
}
