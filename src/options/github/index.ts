/**
 * Shared GitHub Options Module
 *
 * This module exports everything needed for shared GitHub API configuration:
 * - API functions for token storage and GitHub API interactions
 * - Options section renderer for the extension options page
 */

import { registerOptionsSection } from "../../content/commands/options-registry.ts"
import { renderGitHubOptionsSection } from "./github-options-section.ts"

// Export API functions and types
export * from "./api.ts"

// Export options section renderer
export { renderGitHubOptionsSection } from "./github-options-section.ts"

// Register options section
registerOptionsSection("github", renderGitHubOptionsSection)
