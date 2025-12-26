/**
 * Giphy Command Module
 *
 * This module exports everything needed for the /giphy slash command:
 * - API functions for interacting with the Giphy API
 * - Command implementation for the slash command picker
 * - Options section component for the extension options page
 */

// Export API functions and types
export * from "./api.ts";

// Export command implementation
export * from "./command.ts";

// Export options section component
export { GiphyOptionsSection } from "./GiphyOptionsSection.tsx";
