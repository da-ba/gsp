/**
 * Command registry and types
 */

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

export type CommandMetadata = {
  icon: string
  description: string
}

export type CommandSpec = {
  preflight: () => Promise<PreflightResult>
  getEmptyState: () => Promise<EmptyStateResult>
  getResults: (query: string) => Promise<ResultsResult>
  getSuggestions?: (query: string) => Promise<SuggestionsResult>
  renderItems: (items: PickerItem[], suggestTitle: string) => void
  /**
   * Re-render current items (e.g., after suggestions update).
   * Optional - defaults to calling renderItems with state.currentItems.
   * @deprecated Commands should generally not need to override this.
   */
  renderCurrent?: () => void
  onSelect: (item: PickerItem) => void
  /** Command-specific "no results" message (optional) */
  noResultsMessage?: string
  /**
   * Render command-specific settings section.
   * Receives a container element to append settings UI to.
   */
  renderSettings?: (container: HTMLElement) => void
}

const commandRegistry: Record<string, CommandSpec> = {}
const commandMetadataRegistry: Partial<Record<string, CommandMetadata>> = {}

export function registerCommand(name: string, spec: CommandSpec, metadata?: CommandMetadata): void {
  commandRegistry[name] = spec
  if (metadata) {
    commandMetadataRegistry[name] = metadata
  }
}

export function getCommand(name: string): CommandSpec | null {
  // Allow empty string for "/" command (command list)
  // Only reject null/undefined, accept empty string
  if (name === null || name === undefined) return null
  return commandRegistry[name] || null
}

export function getCommandMetadata(name: string): CommandMetadata | null {
  if (name === null || name === undefined) return null
  return commandMetadataRegistry[name] || null
}

export function listCommands(): string[] {
  return Object.keys(commandRegistry).sort()
}
