/**
 * Picker inline styles
 */

import { isDarkMode, fontSystemUi, fontSansSerif } from "../../utils/theme.ts"

/** SVG badge layout constants */
export const BADGE_CHAR_WIDTH = 8
export const BADGE_PADDING = 16

/**
 * Calculate badge width based on text length.
 * Uses fixed character width approximation for system fonts.
 */
export function calculateBadgeWidth(text: string): number {
  return text.length * BADGE_CHAR_WIDTH + BADGE_PADDING
}

export type StyleConfig = {
  dark: boolean
}

function getConfig(): StyleConfig {
  return { dark: isDarkMode() }
}

export function applyPickerStyles(el: HTMLElement): void {
  const { dark } = getConfig()

  // Use fixed positioning so the picker is stable across scroll containers
  // (GitHub popovers/dialogs) and doesn't depend on page scroll offsets.
  el.style.position = "fixed"
  el.style.zIndex = "999999"
  el.style.width = "320px"
  el.style.maxHeight = "320px"
  el.style.overflow = "hidden"
  el.style.borderRadius = "6px"
  el.style.fontSize = "14px"
  el.style.fontFamily = fontSystemUi() + ", " + fontSansSerif()
  el.style.backdropFilter = "none"

  // GitHub-style colors matching their native slash commands popover
  if (dark) {
    el.style.color = "#e6edf3"
    el.style.border = "1px solid #3d444d"
    el.style.backgroundColor = "#161b22"
    el.style.backgroundImage = "none"
    el.style.boxShadow = "0 8px 24px rgba(1,4,9,0.75)"
  } else {
    el.style.color = "#1f2328"
    el.style.border = "1px solid #d0d7de"
    el.style.backgroundColor = "#ffffff"
    el.style.backgroundImage = "none"
    el.style.boxShadow = "0 8px 24px rgba(140,149,159,0.2)"
  }
}

export function getCardStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    padding: "12px",
    borderRadius: "6px",
    border: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.15)",
    backgroundColor: dark ? "rgba(33,38,45,0.6)" : "rgba(246,248,250,0.8)",
  }
}

export function getBadgeStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "6px",
    padding: "4px 8px",
    border: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.15)",
    backgroundColor: dark ? "rgba(33,38,45,0.6)" : "rgba(246,248,250,0.8)",
    color: dark ? "#8d96a0" : "#656d76",
  }
}

export function getButtonStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    border: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.15)",
    backgroundColor: dark ? "#21262d" : "#f6f8fa",
    color: dark ? "#e6edf3" : "#1f2328",
  }
}

export function getInputStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 12px",
    borderRadius: "6px",
    border: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.15)",
    backgroundColor: dark ? "#0d1117" : "#ffffff",
    color: dark ? "#e6edf3" : "#1f2328",
  }
}

export function getSkeletonStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    width: "100%",
    height: "88px",
    borderRadius: "6px",
    backgroundColor: dark ? "rgba(110,118,129,0.1)" : "rgba(31,35,40,0.04)",
    border: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.08)",
  }
}

export function getGridItemSelectedStyles(selected: boolean): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig()
  return {
    outline: "0",
    transform: selected ? "scale(1.02)" : "scale(1)",
    boxShadow: selected
      ? dark
        ? "0 4px 12px rgba(0,0,0,0.4)"
        : "0 4px 12px rgba(0,0,0,0.15)"
      : "none",
    border: selected ? (dark ? "2px solid #58a6ff" : "2px solid #0969da") : "1px solid transparent",
  }
}

/**
 * Apply a style object to an HTML element.
 * Converts camelCase keys to kebab-case CSS properties.
 */
export function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && typeof value === "string") {
      el.style.setProperty(
        key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        value
      )
    }
  }
}
