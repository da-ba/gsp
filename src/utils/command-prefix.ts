/**
 * Command prefix configuration
 *
 * This module provides the command prefix used to trigger Slash Palette.
 * Currently set to "//" to avoid conflicts with GitHub's native "/" commands.
 *
 * Future: This could be made configurable via user settings.
 */

/**
 * The prefix that triggers Slash Palette commands.
 * Default: "//" (double slash)
 */
export const COMMAND_PREFIX = "//"

/**
 * The length of the command prefix
 */
export const COMMAND_PREFIX_LENGTH = COMMAND_PREFIX.length
