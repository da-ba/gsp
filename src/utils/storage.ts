/**
 * Chrome storage utilities for preferences
 */

const THEME_KEY = "themePreference"

export type ThemePreference = "system" | "dark" | "light"

// Check if chrome.storage is available
function hasStorage(): boolean {
  return typeof chrome !== "undefined" && chrome?.storage?.local !== undefined
}

/**
 * Generic storage get
 */
export async function getStorageValue<T>(key: string, defaultValue: T): Promise<T> {
  if (!hasStorage()) {
    const val = localStorage.getItem(key)
    return val !== null ? (JSON.parse(val) as T) : defaultValue
  }
  const res = await chrome.storage.local.get({ [key]: defaultValue })
  return res[key] as T
}

/**
 * Generic storage set
 */
export async function setStorageValue<T>(key: string, value: T): Promise<void> {
  if (!hasStorage()) {
    localStorage.setItem(key, JSON.stringify(value))
    return
  }
  await chrome.storage.local.set({ [key]: value })
}

export async function getThemePreference(): Promise<ThemePreference> {
  return getStorageValue<ThemePreference>(THEME_KEY, "system")
}

export async function setThemePreference(value: ThemePreference): Promise<void> {
  return setStorageValue(THEME_KEY, value)
}
