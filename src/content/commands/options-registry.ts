/**
 * Options section registry for command-specific settings UI
 */

import type React from "react";

/** Registry of options section components */
const optionsSectionRegistry: Array<{
  name: string;
  component: React.ComponentType;
}> = [];

/**
 * Register an options section component for a command
 */
export function registerOptionsSection(name: string, component: React.ComponentType): void {
  optionsSectionRegistry.push({ name, component });
}

/**
 * Get all registered options sections
 */
export function getOptionsSections(): Array<{
  name: string;
  component: React.ComponentType;
}> {
  return [...optionsSectionRegistry];
}
