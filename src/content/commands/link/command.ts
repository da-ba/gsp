/**
 * /link slash command implementation
 *
 * Provides a popover to quickly insert markdown links with auto-generated titles.
 *
 * Usage:
 * - /link                    - Opens empty link input form
 * - /link google.com         - Prefills URL, auto-generates title
 * - /link google.com "Title" - Prefills URL and title
 * - /link ci                  - Shows recent CI jobs and artifacts
 * - /link ci <query>          - Searches CI jobs/artifacts matching query
 */

import { escapeForSvg } from "../../../utils/svg.ts"
import { createStatusTile, createEmptyTile } from "../../../utils/tile-builder.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import {
  renderGrid,
  showSettings,
  insertTextAtCursor,
  renderTokenForm,
} from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { parseLinkQuery, formatMarkdownLink, type LinkParseResult } from "./api.ts"
import {
  getGitHubToken,
  setGitHubToken,
  getRepoContext,
  searchCIResources,
  type CILinkSuggestion,
} from "../../../options/github/api.ts"

/** Display truncation limits for tile text */
const DISPLAY_LIMITS = {
  URL_LENGTH: 30,
  TITLE_LENGTH: 20,
  CI_NAME_LENGTH: 24,
  CI_RUN_LENGTH: 20,
  ERROR_LENGTH: 40,
} as const

/** Help message for /link command */
const LINK_HELP_MESSAGE =
  'Type a URL like: /link example.com or /link example.com "My Title", or use /link ci to search CI jobs'

/** Create a tile for a link preview */
function makeLinkTile(parsed: LinkParseResult): PickerItem {
  const displayUrl = parsed.url.replace(/^https?:\/\//, "").slice(0, DISPLAY_LIMITS.URL_LENGTH)
  const displayTitle = (parsed.title || "Untitled").slice(0, DISPLAY_LIMITS.TITLE_LENGTH)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#eef2ff" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#bg)"/>
  <rect x="4" y="4" width="232" height="112" rx="10" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.08"/>

  <!-- Link icon -->
  <path d="M24 50 L34 40 Q38 36 42 40 L52 50 Q56 54 52 58 L48 62" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M44 58 L34 68 Q30 72 26 68 L16 58 Q12 54 16 50 L20 46" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- Title -->
  <text x="60" y="52" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="600" fill="#0f172a" fill-opacity="0.86">${escapeForSvg(displayTitle)}</text>

  <!-- URL -->
  <text x="60" y="74" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" fill="#0f172a" fill-opacity="0.55">${escapeForSvg(displayUrl)}</text>

  <!-- Insert hint -->
  <rect x="164" y="88" width="64" height="22" rx="6" fill="#3b82f6" fill-opacity="0.12"/>
  <text x="196" y="103" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="500" fill="#3b82f6">Insert Link</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: "link-preview",
    previewUrl: dataUrl,
    data: parsed,
  }
}

/** Link icon SVG for empty tile */
const LINK_ICON_SVG = `<path d="M104 50 L114 40 Q118 36 122 40 L132 50 Q136 54 132 58 L128 62" stroke="#64748b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M124 58 L114 68 Q110 72 106 68 L96 58 Q92 54 96 50 L100 46" stroke="#64748b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`

/** Create a tile for entering a new link */
function makeEmptyLinkTile(): PickerItem {
  return {
    id: "link-empty",
    previewUrl: createEmptyTile({
      id: "link-empty",
      message: "Type a URL after /link",
      icon: LINK_ICON_SVG,
    }),
    data: null,
  }
}

/** Insert markdown link into the textarea */
function insertLink(parsed: LinkParseResult): void {
  insertTextAtCursor(formatMarkdownLink(parsed.url, parsed.title) + " ")
}

/** Insert a CI link into the textarea */
function insertCILink(suggestion: CILinkSuggestion): void {
  insertTextAtCursor(formatMarkdownLink(suggestion.url, suggestion.name) + " ")
}

/** Create a tile for a CI job or artifact */
function makeCITile(suggestion: CILinkSuggestion): PickerItem {
  const displayName = suggestion.name.slice(0, DISPLAY_LIMITS.CI_NAME_LENGTH)
  const displayRun = suggestion.runName.slice(0, DISPLAY_LIMITS.CI_RUN_LENGTH)
  const typeLabel = suggestion.type === "job" ? "Job" : "Artifact"
  const iconColor = suggestion.type === "job" ? "#22c55e" : "#f59e0b"

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
  <defs>
    <linearGradient id="bg-ci" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f0fdf4" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#bg-ci)"/>
  <rect x="4" y="4" width="232" height="112" rx="10" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.08"/>

  <!-- CI icon (gear/cog for job, package for artifact) -->
  ${
    suggestion.type === "job"
      ? `<circle cx="30" cy="50" r="12" stroke="${iconColor}" stroke-width="2" fill="none"/>
         <circle cx="30" cy="50" r="5" fill="${iconColor}" fill-opacity="0.3"/>
         <line x1="30" y1="35" x2="30" y2="40" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
         <line x1="30" y1="60" x2="30" y2="65" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
         <line x1="15" y1="50" x2="20" y2="50" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
         <line x1="40" y1="50" x2="45" y2="50" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>`
      : `<rect x="18" y="38" width="24" height="24" rx="3" stroke="${iconColor}" stroke-width="2" fill="none"/>
         <path d="M22 38 L22 35 L38 35 L38 38" stroke="${iconColor}" stroke-width="2" fill="none"/>
         <line x1="30" y1="45" x2="30" y2="55" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>`
  }

  <!-- Type label -->
  <rect x="50" y="30" width="40" height="16" rx="4" fill="${iconColor}" fill-opacity="0.15"/>
  <text x="70" y="42" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="500" fill="${iconColor}">${escapeForSvg(typeLabel)}</text>

  <!-- Name -->
  <text x="50" y="60" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="600" fill="#0f172a" fill-opacity="0.86">${escapeForSvg(displayName)}</text>

  <!-- Run name -->
  <text x="50" y="78" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" fill="#0f172a" fill-opacity="0.55">${escapeForSvg(displayRun)}</text>

  <!-- Insert hint -->
  <rect x="164" y="88" width="64" height="22" rx="6" fill="${iconColor}" fill-opacity="0.12"/>
  <text x="196" y="103" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" font-weight="500" fill="${iconColor}">Insert Link</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: `ci-${suggestion.type}-${suggestion.runId}-${suggestion.name}`,
    previewUrl: dataUrl,
    data: { type: "ci", suggestion },
  }
}

/** Create a tile for CI setup/token required */
function makeCISetupTile(): PickerItem {
  return {
    id: "ci-setup",
    previewUrl: createStatusTile({
      id: "ci-setup",
      type: "warning",
      message: "GitHub token required",
      submessage: "Click to configure",
    }),
    data: { type: "setup" },
  }
}

/** Create a tile for CI loading state */
function makeCILoadingTile(): PickerItem {
  return {
    id: "ci-loading",
    previewUrl: createStatusTile({
      id: "ci-loading",
      type: "loading",
      message: "Loading CI resources...",
    }),
    data: { type: "loading" },
  }
}

/** Create a tile for CI error state */
function makeCIErrorTile(error: string): PickerItem {
  const displayError = error.slice(0, DISPLAY_LIMITS.ERROR_LENGTH)
  return {
    id: "ci-error",
    previewUrl: createStatusTile({
      id: "ci-error",
      type: "error",
      message: displayError,
    }),
    data: { type: "error" },
  }
}

/** Create a tile for no CI results */
function makeCINoResultsTile(): PickerItem {
  return {
    id: "ci-noresults",
    previewUrl: createStatusTile({
      id: "ci-noresults",
      type: "empty",
      message: "No matching CI resources",
    }),
    data: { type: "noresults" },
  }
}

/** Check if query is a CI query */
function isCIQuery(query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  return trimmed === "ci" || trimmed.startsWith("ci ")
}

/** Extract search term from CI query */
function extractCISearchTerm(query: string): string {
  const trimmed = query.trim()
  if (trimmed.toLowerCase() === "ci") {
    return ""
  }
  // Remove "ci " prefix
  return trimmed.slice(3).trim()
}

/** Type definitions for picker item data */
type CIItemData = { type: "ci"; suggestion: CILinkSuggestion }
type SetupItemData = { type: "setup" }
type LoadingItemData = { type: "loading" }
type ErrorItemData = { type: "error" }
type NoResultsItemData = { type: "noresults" }
type LinkItemData = LinkParseResult
type ItemData =
  | CIItemData
  | SetupItemData
  | LoadingItemData
  | ErrorItemData
  | NoResultsItemData
  | LinkItemData
  | null

function isCIItemData(data: ItemData): data is CIItemData {
  return data !== null && typeof data === "object" && "type" in data && data.type === "ci"
}

function isSetupItemData(data: ItemData): data is SetupItemData {
  return data !== null && typeof data === "object" && "type" in data && data.type === "setup"
}

function isLinkItemData(data: ItemData): data is LinkItemData {
  return data !== null && typeof data === "object" && "isValid" in data
}

/**
 * Render GitHub Token form using shared token form component.
 */
function renderGitHubTokenForm(container: HTMLElement): void {
  renderTokenForm(container, {
    label: "GitHub Token (for /link ci)",
    description:
      'Create a <a href="https://github.com/settings/tokens/new?description=GitHub%20Slash%20Palette&scopes=public_repo" target="_blank" style="color:inherit;text-decoration:underline;">Personal Access Token</a> with <code style="font-size:11px;">public_repo</code> or <code style="font-size:11px;">repo</code> scope.',
    placeholder: "Paste GitHub token…",
    saveButtonText: "Save Token",
    showClear: true,
    loadCurrentValue: getGitHubToken,
    onSave: async (value) => {
      await setGitHubToken(value)
    },
    onClear: async () => {
      await setGitHubToken("")
    },
  })
}

const linkCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    // Show empty state with hint
    return {
      items: [makeEmptyLinkTile()],
      suggestTitle: "Enter a URL or try /link ci",
    }
  },

  getResults: async (query: string) => {
    // Check if this is a CI query
    if (isCIQuery(query)) {
      const token = await getGitHubToken()
      if (!token) {
        return {
          items: [makeCISetupTile()],
          suggestTitle: "CI Links",
        }
      }

      const context = getRepoContext()
      if (!context) {
        return {
          items: [makeCIErrorTile("Not on a GitHub repository page")],
          suggestTitle: "CI Links",
        }
      }

      const searchTerm = extractCISearchTerm(query)
      const result = await searchCIResources(token, context.owner, context.repo, searchTerm)

      if (result.error) {
        return {
          items: [makeCIErrorTile(result.error)],
          suggestTitle: "CI Links",
        }
      }

      const suggestions = result.data || []
      if (suggestions.length === 0) {
        return {
          items: [makeCINoResultsTile()],
          suggestTitle: searchTerm ? `No CI matches for "${searchTerm}"` : "No recent CI runs",
        }
      }

      const items = suggestions.map(makeCITile)
      return {
        items,
        suggestTitle: searchTerm ? `CI matches for "${searchTerm}"` : "Recent CI jobs & artifacts",
      }
    }

    // Regular URL link handling
    const parsed = parseLinkQuery(query)

    if (parsed.isValid) {
      // Show link preview tile
      return {
        items: [makeLinkTile(parsed)],
        suggestTitle: "Link preview",
      }
    }

    // Not a valid URL yet
    return {
      items: [makeEmptyLinkTile()],
      suggestTitle: "Enter a valid URL",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => {
        const data = it.data as ItemData
        if (isSetupItemData(data)) {
          showSettings()
        } else if (isCIItemData(data)) {
          insertCILink(data.suggestion)
        } else if (isLinkItemData(data) && data.isValid) {
          insertLink(data)
        }
      },
      suggestTitle
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    const data = it.data as ItemData
    if (isSetupItemData(data)) {
      showSettings()
    } else if (isCIItemData(data)) {
      insertCILink(data.suggestion)
    } else if (isLinkItemData(data) && data.isValid) {
      insertLink(data)
    }
  },

  noResultsMessage: LINK_HELP_MESSAGE,

  renderSettings: (container: HTMLElement) => {
    renderGitHubTokenForm(container)
  },
}

// Register the command
registerCommand("link", linkCommand, {
  icon: "🔗",
  description: "Insert formatted links",
})

export {
  linkCommand,
  makeLinkTile,
  makeEmptyLinkTile,
  makeCITile,
  makeCISetupTile,
  makeCILoadingTile,
  makeCIErrorTile,
  makeCINoResultsTile,
}
