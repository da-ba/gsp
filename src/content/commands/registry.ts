/**
 * Command registry and types
 */

import type { GifItem } from "../../api/giphy.ts";

export interface PreflightResult {
  showSetup: boolean;
  message?: string;
}

export interface EmptyStateResult {
  items?: GifItem[];
  suggest?: string[];
  suggestTitle?: string;
  error?: string;
}

export interface ResultsResult {
  items?: GifItem[];
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
  renderItems: (items: GifItem[], suggestTitle: string) => void;
  renderCurrent: () => void;
  onSelect: (item: GifItem) => void;
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
