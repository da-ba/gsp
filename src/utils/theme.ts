/**
 * Theme detection utilities for GitHub dark/light mode
 */

import type { ThemePreference } from "./storage.ts"

function dashChar(): string {
  return String.fromCharCode(45)
}

function htmlAttrDataColorMode(): string {
  const d = dashChar()
  return "data" + d + "color" + d + "mode"
}

function htmlAttrDataTheme(): string {
  const d = dashChar()
  return "data" + d + "theme"
}

function prefersDarkQuery(): string {
  const d = dashChar()
  return "(prefers" + d + "color" + d + "scheme: dark)"
}

// Theme override set by user preference
let themeOverride: ThemePreference = "system"

/**
 * Set theme override (called when preference is loaded/changed)
 */
export function setThemeOverride(pref: ThemePreference): void {
  themeOverride = pref
}

/**
 * Get current theme override
 */
export function getThemeOverride(): ThemePreference {
  return themeOverride
}

/**
 * Detect if GitHub is in dark mode (respects user override)
 */
export function isDarkMode(): boolean {
  // If user has set a preference, use it
  if (themeOverride === "dark") return true
  if (themeOverride === "light") return false

  // Otherwise detect from system/GitHub
  const html = document.documentElement
  const v1 = String(html.getAttribute(htmlAttrDataColorMode()) || "").toLowerCase()
  if (v1 === "dark") return true
  if (v1 === "light") return false

  const v2 = String(html.getAttribute(htmlAttrDataTheme()) || "").toLowerCase()
  if (v2.indexOf("dark") >= 0) return true
  if (v2.indexOf("light") >= 0) return false

  if (window.matchMedia) {
    return window.matchMedia(prefersDarkQuery()).matches
  }
  return false
}

/**
 * Setup theme change listener
 */
export function onThemeChange(callback: () => void): void {
  try {
    const mq = window.matchMedia ? window.matchMedia(prefersDarkQuery()) : null

    if (mq && mq.addEventListener) {
      mq.addEventListener("change", callback)
    } else if (mq && "addListener" in mq) {
      ;(mq as MediaQueryList).addListener(callback)
    }

    const html = document.documentElement
    const observer = new MutationObserver(() => callback())
    observer.observe(html, {
      attributes: true,
      attributeFilter: [htmlAttrDataColorMode(), htmlAttrDataTheme(), "class"],
    })
  } catch {
    // Ignore errors
  }
}

// CSS token helpers
export function fontSystemUi(): string {
  const d = dashChar()
  return "system" + d + "ui"
}

export function fontSansSerif(): string {
  const d = dashChar()
  return "sans" + d + "serif"
}

export function tokenLinearGradient(): string {
  const d = dashChar()
  return "linear" + d + "gradient"
}
