/**
 * /mention slash command implementation
 *
 * Provides context-aware mention autocomplete for PR participants,
 * teams, and recent collaborators.
 */

import { escapeForSvg } from "../../../utils/svg.ts"
import { registerCommand, createGridHandlers, type CommandSpec } from "../registry.ts"
import { getCommandCache, setCommandCache, insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import {
  getAllParticipants,
  getRecentMentions,
  addRecentMention,
  searchMentions,
  getMentionSuggestions,
  TYPE_LABELS,
  type MentionItem,
  type ParticipantType,
} from "./api.ts"

// Cache keys for mention-specific data
const CACHE_RECENT_MENTIONS = "mention:recentMentions"
const CACHE_PARTICIPANTS = "mention:participants"

/** Get type color for badge */
function getTypeColor(type: ParticipantType): string {
  switch (type) {
    case "author":
      return "#8b5cf6" // purple
    case "reviewer":
      return "#3b82f6" // blue
    case "assignee":
      return "#22c55e" // green
    case "participant":
      return "#64748b" // slate
    case "team":
      return "#f59e0b" // amber
    case "recent":
      return "#ec4899" // pink
    default:
      return "#64748b"
  }
}

/** Calculate badge width based on text length */
function calculateBadgeWidth(text: string): number {
  const charWidth = 6
  const padding = 14
  return text.length * charWidth + padding
}

/** Create a tile for a mention item */
function makeMentionTile(item: MentionItem): PickerItem {
  const typeColor = getTypeColor(item.type)
  const displayUsername = `@${item.username}`
  const truncatedUsername =
    displayUsername.length > 18 ? displayUsername.slice(0, 17) + "…" : displayUsername

  // Use a default avatar icon if no avatar URL
  const avatarSvg = item.avatarUrl
    ? ""
    : `<circle cx="60" cy="42" r="24" fill="${typeColor}" fill-opacity="0.15"/>
     <text x="60" y="50" text-anchor="middle" font-family="system-ui" font-size="24" fill="${typeColor}">@</text>`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="bg-${item.username.replace(/[^a-zA-Z0-9]/g, "")}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f8fafc" stop-opacity="0.96"/>
    </linearGradient>
    <clipPath id="avatar-clip-${item.username.replace(/[^a-zA-Z0-9]/g, "")}">
      <circle cx="60" cy="42" r="24"/>
    </clipPath>
  </defs>
  <rect x="0" y="0" width="120" height="120" rx="12" fill="url(#bg-${item.username.replace(/[^a-zA-Z0-9]/g, "")})"/>
  <rect x="4" y="4" width="112" height="112" rx="10" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.08"/>

  <!-- Avatar or placeholder -->
  ${
    item.avatarUrl
      ? `<image href="${escapeForSvg(item.avatarUrl)}" x="36" y="18" width="48" height="48" clip-path="url(#avatar-clip-${item.username.replace(/[^a-zA-Z0-9]/g, "")})"/>`
      : avatarSvg
  }

  <!-- Username -->
  <text x="60" y="88" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="600" fill="#0f172a" fill-opacity="0.9">${escapeForSvg(truncatedUsername)}</text>

  <!-- Type badge -->
  <rect x="${60 - calculateBadgeWidth(TYPE_LABELS[item.type]) / 2}" y="96" width="${calculateBadgeWidth(TYPE_LABELS[item.type])}" height="16" rx="4" fill="${typeColor}" fill-opacity="0.15"/>
  <text x="60" y="107" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="500" fill="${typeColor}">${escapeForSvg(TYPE_LABELS[item.type])}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: item.username,
    previewUrl: dataUrl,
    data: item,
  }
}

/** Insert mention into the textarea */
function insertMention(username: string): void {
  if (!insertTextAtCursor(`@${username} `)) return

  // Add to recently used (fire-and-forget, errors are non-critical)
  addRecentMention(username).catch(() => {
    // Silently ignore storage errors - not critical for UX
  })
}

const mentionCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    // Get participants from page
    let participants = getCommandCache<MentionItem[]>(CACHE_PARTICIPANTS)
    if (!participants) {
      participants = getAllParticipants()
      setCommandCache(CACHE_PARTICIPANTS, participants)
    }

    // Load recently mentioned users if not cached
    let recentMentions = getCommandCache<string[]>(CACHE_RECENT_MENTIONS)
    if (!recentMentions) {
      recentMentions = await getRecentMentions()
      setCommandCache(CACHE_RECENT_MENTIONS, recentMentions)
    }

    // Add recent mentions that are not already in participants
    const existingUsernames = new Set(participants.map((p) => p.username.toLowerCase()))
    const recentItems: MentionItem[] = recentMentions
      .filter((username) => !existingUsernames.has(username.toLowerCase()))
      .slice(0, 6)
      .map((username) => ({
        username,
        type: "recent" as ParticipantType,
      }))

    const allItems = [...participants, ...recentItems]
    const items = allItems.slice(0, 24).map(makeMentionTile)

    return {
      items,
      suggest: getMentionSuggestions(allItems),
      suggestTitle: participants.length > 0 ? "Participants" : "Recent mentions",
    }
  },

  getResults: async (query: string) => {
    // Get cached participants
    let participants = getCommandCache<MentionItem[]>(CACHE_PARTICIPANTS)
    if (!participants) {
      participants = getAllParticipants()
      setCommandCache(CACHE_PARTICIPANTS, participants)
    }

    // Get recent mentions for search
    let recentMentions = getCommandCache<string[]>(CACHE_RECENT_MENTIONS)
    if (!recentMentions) {
      recentMentions = await getRecentMentions()
      setCommandCache(CACHE_RECENT_MENTIONS, recentMentions)
    }

    // Add recent mentions
    const existingUsernames = new Set(participants.map((p) => p.username.toLowerCase()))
    const recentItems: MentionItem[] = recentMentions
      .filter((username) => !existingUsernames.has(username.toLowerCase()))
      .map((username) => ({
        username,
        type: "recent" as ParticipantType,
      }))

    const allItems = [...participants, ...recentItems]
    const filtered = searchMentions(allItems, query)
    const items = filtered.slice(0, 24).map(makeMentionTile)

    return {
      items,
      suggestTitle: query ? "Matching users" : "Participants",
    }
  },

  ...createGridHandlers<MentionItem>((item) => insertMention(item.username)),

  noResultsMessage: "No matching users found. Try typing a username.",
}

// Register the command
registerCommand("mention", mentionCommand)

export { mentionCommand, makeMentionTile }
