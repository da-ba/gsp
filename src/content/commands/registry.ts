/**
 * Command registry and types
 */

import type { PickerItem } from "../types.ts";

export interface PreflightResult {
  showSetup: boolean;
  message?: string;
  /**
   * If showSetup is true, command can provide a custom setup renderer.
   * Receives the picker body element and a callback to invoke after setup completes.
   */
  renderSetup?: (bodyEl: HTMLElement, onComplete: () => void) => void;
}

export interface EmptyStateResult {
  items?: PickerItem[];
  suggest?: string[];
  suggestTitle?: string;
  error?: string;
}

export interface ResultsResult {
  items?: PickerItem[];
  suggestTitle?: string;
  error?: string;
}

export interface SuggestionsResult {
  items: string[];
}

export interface CommandSpec {
  preflight: () => Promise<PreflightResult>;
  getEmptyState: () => Promise<EmptyStateResult>;
  getResults: (query: string) => Promise<ResultsResult>;
  getSuggestions?: (query: string) => Promise<SuggestionsResult>;
  renderItems: (items: PickerItem[], suggestTitle: string) => void;
  renderCurrent: () => void;
  onSelect: (item: PickerItem) => void;
  /** Command-specific "no results" message (optional) */
  noResultsMessage?: string;
  /**
   * Render command-specific settings section.
   * Receives a container element to append settings UI to.
   */
  renderSettings?: (container: HTMLElement) => void;
}

const commandRegistry: Record<string, CommandSpec> = {};

export function registerCommand(name: string, spec: CommandSpec): void {
  commandRegistry[name] = spec;
}

export function getCommand(name: string): CommandSpec | null {
  if (!name) return null;
  return commandRegistry[name] || null;
}

export function listCommands(): string[] {
  return Object.keys(commandRegistry).sort();
}
