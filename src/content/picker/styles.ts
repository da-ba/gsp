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

const STYLE_TOKENS = {
  dark: {
    pickerText: "#e6edf3",
    pickerBorder: "#3d444d",
    pickerBackground: "#161b22",
    pickerShadow: "0 8px 24px rgba(1,4,9,0.75)",
    cardBackground: "rgba(33,38,45,0.6)",
    cardBorder: "#3d444d",
    badgeText: "#8d96a0",
    buttonBackground: "#21262d",
    inputBackground: "#0d1117",
    skeletonBackground: "rgba(110,118,129,0.1)",
    skeletonBorder: "#3d444d",
    gridSelectedBorder: "#58a6ff",
    gridSelectedShadow: "0 4px 12px rgba(0,0,0,0.4)",
  },
  light: {
    pickerText: "#1f2328",
    pickerBorder: "#d0d7de",
    pickerBackground: "#ffffff",
    pickerShadow: "0 8px 24px rgba(140,149,159,0.2)",
    cardBackground: "rgba(246,248,250,0.8)",
    cardBorder: "rgba(31,35,40,0.15)",
    badgeText: "#656d76",
    buttonBackground: "#f6f8fa",
    inputBackground: "#ffffff",
    skeletonBackground: "rgba(31,35,40,0.04)",
    skeletonBorder: "rgba(31,35,40,0.08)",
    gridSelectedBorder: "#0969da",
    gridSelectedShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
} as const

type StyleTokens = (typeof STYLE_TOKENS)[keyof typeof STYLE_TOKENS]

function getConfig(): StyleConfig {
  return { dark: isDarkMode() }
}

function getTokens(): StyleTokens {
  return getConfig().dark ? STYLE_TOKENS.dark : STYLE_TOKENS.light
}

export function applyPickerStyles(el: HTMLElement): void {
  const tokens = getTokens()

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
  el.style.color = tokens.pickerText
  el.style.border = `1px solid ${tokens.pickerBorder}`
  el.style.backgroundColor = tokens.pickerBackground
  el.style.backgroundImage = "none"
  el.style.boxShadow = tokens.pickerShadow
}

export function getCardStyles(): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    padding: "12px",
    borderRadius: "6px",
    border: `1px solid ${tokens.cardBorder}`,
    backgroundColor: tokens.cardBackground,
  }
}

export function getBadgeStyles(): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "6px",
    padding: "4px 8px",
    border: `1px solid ${tokens.cardBorder}`,
    backgroundColor: tokens.cardBackground,
    color: tokens.badgeText,
  }
}

export function getButtonStyles(): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    border: `1px solid ${tokens.cardBorder}`,
    backgroundColor: tokens.buttonBackground,
    color: tokens.pickerText,
  }
}

export function getInputStyles(): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 12px",
    borderRadius: "6px",
    border: `1px solid ${tokens.cardBorder}`,
    backgroundColor: tokens.inputBackground,
    color: tokens.pickerText,
  }
}

export function getSkeletonStyles(): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    width: "100%",
    height: "88px",
    borderRadius: "6px",
    backgroundColor: tokens.skeletonBackground,
    border: `1px solid ${tokens.skeletonBorder}`,
  }
}

export function getGridItemSelectedStyles(selected: boolean): Partial<CSSStyleDeclaration> {
  const tokens = getTokens()
  return {
    outline: "0",
    transform: selected ? "scale(1.02)" : "scale(1)",
    boxShadow: selected ? tokens.gridSelectedShadow : "none",
    border: selected ? `2px solid ${tokens.gridSelectedBorder}` : "1px solid transparent",
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
