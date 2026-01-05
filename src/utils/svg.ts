/**
 * SVG utility functions
 */

/**
 * Escape a string for safe use in SVG text content.
 * Handles XML special characters that would break SVG parsing.
 */
export function escapeForSvg(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}
