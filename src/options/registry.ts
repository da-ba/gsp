/**
 * Options page registry - commands register their settings UI here
 */

export interface OptionsSection {
  /** Section title displayed in the options page */
  title: string;
  /** Render the section's settings UI into the container */
  render: (container: HTMLElement) => void;
}

const optionsRegistry: OptionsSection[] = [];

/** Register a settings section for the options page */
export function registerOptionsSection(section: OptionsSection): void {
  optionsRegistry.push(section);
}

/** Get all registered options sections */
export function getOptionsSections(): OptionsSection[] {
  return [...optionsRegistry];
}
