/**
 * GitHub native slash commands and focus priority logic
 */

import { listCommands } from "../commands/registry.ts"

/**
 * GitHub's native slash commands.
 * These are the commands that GitHub provides in their markdown textareas.
 */
export const GITHUB_COMMANDS = [
  "code",
  "details",
  "saved-replies",
  "table",
  "tasklist",
  "template",
] as const

export type GitHubCommand = (typeof GITHUB_COMMANDS)[number]

/**
 * Which popover currently has logical focus
 */
export type PopoverFocus = "slashPalette" | "github"

/**
 * Check if a query prefix-matches any command in a list
 */
function matchesAnyCommand(query: string, commands: readonly string[]): boolean {
  const q = query.toLowerCase()
  return commands.some((cmd) => cmd.toLowerCase().startsWith(q))
}

/**
 * Determine which popover should have initial focus based on the query.
 *
 * Logic:
 * 1. If query exactly matches one of our commands → slashPalette
 * 2. If query exactly matches a GitHub command → github
 * 3. If query prefix-matches one of our commands but NOT GitHub's → slashPalette
 * 4. If query prefix-matches a GitHub command but NOT ours → github
 * 5. If query matches both or neither → slashPalette (our default)
 */
export function determinePopoverPriority(query: string): PopoverFocus {
  if (!query) {
    // Just "/" with no query - default to our picker
    return "slashPalette"
  }

  const ourCommands = listCommands()
  const q = query.toLowerCase()

  // Check for exact matches first
  const exactOurs = ourCommands.some((cmd) => cmd.toLowerCase() === q)
  const exactGitHub = GITHUB_COMMANDS.some((cmd) => cmd.toLowerCase() === q)

  if (exactOurs && !exactGitHub) return "slashPalette"
  if (exactGitHub && !exactOurs) return "github"

  // Check for prefix matches
  const matchesOurs = matchesAnyCommand(query, ourCommands)
  const matchesGitHub = matchesAnyCommand(query, GITHUB_COMMANDS)

  if (matchesOurs && !matchesGitHub) return "slashPalette"
  if (matchesGitHub && !matchesOurs) return "github"

  // Both match or neither match - default to our picker
  return "slashPalette"
}

/**
 * Get display name for the other popover (for hint text)
 */
export function getOtherPopoverName(current: PopoverFocus): string {
  return current === "slashPalette" ? "GitHub commands" : "Slash Palette"
}
