/**
 * Link command API utilities
 *
 * Provides URL parsing, title extraction, and markdown link generation.
 */

export type LinkParseResult = {
  url: string
  title: string
  isValid: boolean
}

/**
 * Extract domain name from a URL for use as default title
 * Example: "https://www.example.com/path" -> "example.com"
 */
export function extractDomain(url: string): string {
  try {
    // Add protocol if missing for URL parsing
    let normalizedUrl = url
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = "https://" + normalizedUrl
    }

    const parsed = new URL(normalizedUrl)
    // Remove www. prefix if present
    return parsed.hostname.replace(/^www\./i, "")
  } catch {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i)
    if (match?.[1]) {
      return match[1]
    }
    return url
  }
}

/**
 * Normalize a URL by adding https:// if no protocol is present
 */
export function normalizeUrl(url: string): string {
  if (!url) return ""

  const trimmed = url.trim()
  if (!trimmed) return ""

  // Already has a protocol
  if (trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    return trimmed
  }

  // Add https:// as default protocol
  return "https://" + trimmed
}

/**
 * Check if a string looks like a URL
 */
export function isLikelyUrl(str: string): boolean {
  if (!str) return false

  const trimmed = str.trim()

  // Has protocol
  if (trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    return true
  }

  // Looks like a domain (contains a dot and no spaces)
  if (!trimmed.includes(" ") && trimmed.includes(".")) {
    return true
  }

  return false
}

/**
 * Parse a link query string to extract URL and optional title
 *
 * Supported formats:
 * - "google.com" -> url: "google.com", title: "google.com"
 * - "google.com \"My Title\"" -> url: "google.com", title: "My Title"
 * - "https://example.com/path" -> url: "https://example.com/path", title: "example.com"
 */
export function parseLinkQuery(query: string): LinkParseResult {
  if (!query || !query.trim()) {
    return { url: "", title: "", isValid: false }
  }

  const trimmed = query.trim()

  // Try to match URL followed by optional quoted title
  // Pattern: URL (optional spaces) "title"
  const quotedTitleMatch = trimmed.match(/^(.+?)\s+"([^"]+)"$/s)

  if (quotedTitleMatch) {
    const url = (quotedTitleMatch[1] ?? "").trim()
    const title = (quotedTitleMatch[2] ?? "").trim()

    if (isLikelyUrl(url)) {
      return {
        url: normalizeUrl(url),
        title: title || extractDomain(url),
        isValid: true,
      }
    }
  }

  // Try to match URL followed by optional single-quoted title
  const singleQuotedMatch = trimmed.match(/^(.+?)\s+'([^']+)'$/s)

  if (singleQuotedMatch) {
    const url = (singleQuotedMatch[1] ?? "").trim()
    const title = (singleQuotedMatch[2] ?? "").trim()

    if (isLikelyUrl(url)) {
      return {
        url: normalizeUrl(url),
        title: title || extractDomain(url),
        isValid: true,
      }
    }
  }

  // No quoted title, treat entire string as URL
  if (isLikelyUrl(trimmed)) {
    return {
      url: normalizeUrl(trimmed),
      title: extractDomain(trimmed),
      isValid: true,
    }
  }

  // Not a valid URL
  return { url: trimmed, title: "", isValid: false }
}

/**
 * Format a markdown link
 */
export function formatMarkdownLink(url: string, title: string): string {
  if (!url) return ""

  const safeTitle = title || extractDomain(url) || url
  const normalizedUrl = normalizeUrl(url)

  return `[${safeTitle}](${normalizedUrl})`
}
