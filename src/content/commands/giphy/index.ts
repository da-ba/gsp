/**
 * Giphy Command Module
 *
 * This module exports everything needed for the /giphy slash command:
 * - API functions for interacting with the Giphy API
 * - Command implementation for the slash command picker
 * - Options section renderer for the extension options page
 */

import { registerOptionsSection } from "../options-registry.ts"
import { renderGiphyOptionsSection } from "./giphy-options-section.ts"

// Export API functions and types
export * from "./api.ts"

// Export command implementation
export * from "./command.ts"

// Export options section renderer
export { renderGiphyOptionsSection } from "./giphy-options-section.ts"

// Register options section
registerOptionsSection("giphy", renderGiphyOptionsSection)
