/**
 * Options section registry for command-specific settings UI
 */

/** A render function that builds settings UI into a container element */
export type OptionsSectionRenderer = (container: HTMLElement) => void

/** Registry of options section renderers */
const optionsSectionRegistry: Array<{
  name: string
  renderSection: OptionsSectionRenderer
}> = []

/**
 * Register an options section renderer for a command
 */
export function registerOptionsSection(name: string, renderSection: OptionsSectionRenderer): void {
  optionsSectionRegistry.push({ name, renderSection })
}

/**
 * Get all registered options sections
 */
export function getOptionsSections(): Array<{
  name: string
  renderSection: OptionsSectionRenderer
}> {
  return [...optionsSectionRegistry]
}
