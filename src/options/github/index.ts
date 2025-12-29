/**
 * Shared GitHub Options Module
 *
 * This module exports everything needed for shared GitHub API configuration:
 * - API functions for token storage and GitHub API interactions
 * - Options section component for the extension options page
 */

import { registerOptionsSection } from "../../content/commands/options-registry.ts"
import { GitHubOptionsSection } from "./GitHubOptionsSection.tsx"

// Export API functions and types
export * from "./api.ts"

// Export options section component
export { GitHubOptionsSection } from "./GitHubOptionsSection.tsx"

// Register options section
registerOptionsSection("github", GitHubOptionsSection)
