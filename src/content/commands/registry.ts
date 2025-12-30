/**
 * Command registry and types
 */

import type React from "react"
import type { PickerItem } from "../types.ts"

export type PreflightResult = {
  showSetup: boolean
  message?: string
  /**
   * If showSetup is true, command can provide a custom setup renderer.
   * Receives the picker body element and a callback to invoke after setup completes.
   */
  renderSetup?: (bodyEl: HTMLElement, onComplete: () => void) => void
}

export type EmptyStateResult = {
  items?: PickerItem[]
  suggest?: string[]
  suggestTitle?: string
  error?: string
}

export type ResultsResult = {
  items?: PickerItem[]
  suggestTitle?: string
  error?: string
}

export type SuggestionsResult = {
  items: string[]
}

export type CommandSpec = {
  preflight: () => Promise<PreflightResult>
  getEmptyState: () => Promise<EmptyStateResult>
  getResults: (query: string) => Promise<ResultsResult>
  getSuggestions?: (query: string) => Promise<SuggestionsResult>
  renderItems: (items: PickerItem[], suggestTitle: string) => void
  renderCurrent: () => void
  onSelect: (item: PickerItem) => void
  /** Command-specific "no results" message (optional) */
  noResultsMessage?: string
  /**
   * React component for command-specific settings.
   * Preferred over renderSettings for modern Radix UI integration.
   */
  SettingsComponent?: React.ComponentType
  /**
   * @deprecated Use SettingsComponent instead for Radix UI integration.
   * Render command-specific settings section using imperative DOM manipulation.
   * Receives a container element to append settings UI to.
   */
  renderSettings?: (container: HTMLElement) => void
}

const commandRegistry: Record<string, CommandSpec> = {}

export function registerCommand(name: string, spec: CommandSpec): void {
  commandRegistry[name] = spec
}

export function getCommand(name: string): CommandSpec | null {
  if (!name) return null
  return commandRegistry[name] || null
}

export function listCommands(): string[] {
  return Object.keys(commandRegistry).sort()
}
