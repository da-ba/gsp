/**
 * /link slash command implementation
 *
 * Provides a popover to quickly insert markdown links with auto-generated titles.
 *
 * Usage:
 * - /link                    - Opens empty link input form
 * - /link google.com         - Prefills URL, auto-generates title
 * - /link google.com "Title" - Prefills URL and title
 */

import { replaceRange } from "../../../utils/dom.ts"
import { add } from "../../../utils/math.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import { renderGrid, state } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { parseLinkQuery, formatMarkdownLink, type LinkParseResult } from "./api.ts"

function escapeForSvg(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

/** Create a tile for a link preview */
function makeLinkTile(parsed: LinkParseResult): PickerItem {
  const displayUrl = parsed.url.replace(/^https?:\/\//, "").slice(0, 30)
  const displayTitle = (parsed.title || "Untitled").slice(0, 20)

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

/** Create a tile for entering a new link */
function makeEmptyLinkTile(): PickerItem {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
  <defs>
    <linearGradient id="bg-empty" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fafc" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f1f5f9" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#bg-empty)"/>
  <rect x="4" y="4" width="232" height="112" rx="10" fill="#ffffff" fill-opacity="0.55" stroke="#0f172a" stroke-opacity="0.06" stroke-dasharray="4 2"/>

  <!-- Link icon -->
  <path d="M104 50 L114 40 Q118 36 122 40 L132 50 Q136 54 132 58 L128 62" stroke="#64748b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M124 58 L114 68 Q110 72 106 68 L96 58 Q92 54 96 50 L100 46" stroke="#64748b" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- Hint text -->
  <text x="120" y="92" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b">Type a URL after /link</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: "link-empty",
    previewUrl: dataUrl,
    data: null,
  }
}

/** Insert markdown link into the textarea */
function insertLink(parsed: LinkParseResult): void {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const markdown = formatMarkdownLink(parsed.url, parsed.title)
  const replacement = markdown + " "
  const newValue = replaceRange(value, lineStart, pos, replacement)
  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

const linkCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    // Show empty state with hint
    return {
      items: [makeEmptyLinkTile()],
      suggestTitle: "Enter a URL",
    }
  },

  getResults: async (query: string) => {
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
        const data = it.data as LinkParseResult | null
        if (data?.isValid) {
          insertLink(data)
        }
      },
      suggestTitle
    )
  },

  renderCurrent: () => {
    const items = state.currentItems || []
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => {
        const data = it.data as LinkParseResult | null
        if (data?.isValid) {
          insertLink(data)
        }
      },
      "Link"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    const data = it.data as LinkParseResult | null
    if (data?.isValid) {
      insertLink(data)
    }
  },

  noResultsMessage: 'Type a URL like: /link example.com or /link example.com "My Title"',
}

// Register the command
registerCommand("link", linkCommand)

export { linkCommand, makeLinkTile, makeEmptyLinkTile }
