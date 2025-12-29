/**
 * Options section registry for command-specific settings UI
 */

import type { Component } from "solid-js"

/** Registry of options section components */
const optionsSectionRegistry: Array<{
  name: string
  component: Component
}> = []

/**
 * Register an options section component for a command
 */
export function registerOptionsSection(name: string, component: Component): void {
  optionsSectionRegistry.push({ name, component })
}

/**
 * Get all registered options sections
 */
export function getOptionsSections(): Array<{
  name: string
  component: Component
}> {
  return [...optionsSectionRegistry]
}
