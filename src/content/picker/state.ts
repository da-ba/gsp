/**
 * Picker state management
 */

import type { PickerItem } from "../types.ts"

export type PickerState = {
  pickerEl: HTMLElement | null
  headerTitleEl: HTMLElement | null
  headerSubEl: HTMLElement | null
  hintEl: HTMLElement | null
  bodyEl: HTMLElement | null
  footerEl: HTMLElement | null
  activeField: HTMLTextAreaElement | null
  activeLineStart: number
  activeCursorPos: number
  activeCommand: string
  /** Position within the line where the command starts (the "/" character) */
  activeCommandStart: number
  lastQuery: string
  debounceId: ReturnType<typeof setTimeout> | null
  inFlight: boolean
  currentItems: PickerItem[]
  selectedIndex: number
  cols: number
  mouseDownInPicker: boolean
  suggestItems: string[]
  lastSuggestQuery: string
  suggestDebounceId: ReturnType<typeof setTimeout> | null
  /** Generic per-command cache; commands manage their own keys */
  commandCache: Record<string, unknown>
  /** Whether the settings panel is currently shown */
  showingSettings: boolean
}

export function createPickerState(): PickerState {
  return {
    pickerEl: null,
    headerTitleEl: null,
    headerSubEl: null,
    hintEl: null,
    bodyEl: null,
    footerEl: null,
    activeField: null,
    activeLineStart: 0,
    activeCursorPos: 0,
    activeCommand: "",
    activeCommandStart: 0,
    lastQuery: "",
    debounceId: null,
    inFlight: false,
    currentItems: [],
    selectedIndex: 0,
    cols: 3,
    mouseDownInPicker: false,
    suggestItems: [],
    lastSuggestQuery: "",
    suggestDebounceId: null,
    commandCache: {},
    showingSettings: false,
  }
}

// Global state singleton
export const state = createPickerState()

export function resetPickerState(): void {
  state.lastQuery = ""
  state.currentItems = []
  state.selectedIndex = 0
  state.suggestItems = []
  state.lastSuggestQuery = ""
  state.activeCommand = ""
  state.activeCommandStart = 0
  state.showingSettings = false
}

/**
 * Get command-specific cache value
 */
export function getCommandCache<T>(key: string): T | null {
  return (state.commandCache[key] as T) ?? null
}

/**
 * Set command-specific cache value
 */
export function setCommandCache<T>(key: string, value: T): void {
  state.commandCache[key] = value
}

/**
 * Clear command-specific cache key
 */
export function clearCommandCache(key: string): void {
  delete state.commandCache[key]
}
