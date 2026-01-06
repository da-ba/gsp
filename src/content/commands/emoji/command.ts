/**
 * /emoji slash command implementation
 *
 * Provides an emoji picker with search and recently used favorites.
 */

import { escapeForSvg } from "../../../utils/svg.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import {
  renderGrid,
  state,
  getCommandCache,
  setCommandCache,
  insertTextAtCursor,
  calculateBadgeWidth,
} from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import {
  EMOJIS,
  CATEGORY_LABELS,
  searchEmojis,
  getPopularEmojis,
  getRecentEmojis,
  addRecentEmoji,
  getEmojiSuggestions,
  type EmojiItem,
  type EmojiCategory,
} from "./api.ts"

// Cache keys for emoji-specific data
const CACHE_RECENT_EMOJIS = "emoji:recentEmojis"

/** Get category color for badge */
function getCategoryColor(category: EmojiCategory): string {
  switch (category) {
    case "smileys":
      return "#f59e0b"
    case "people":
      return "#ec4899"
    case "nature":
      return "#22c55e"
    case "food":
      return "#f97316"
    case "activities":
      return "#6366f1"
    case "travel":
      return "#3b82f6"
    case "objects":
      return "#8b5cf6"
    case "symbols":
      return "#ef4444"
    default:
      return "#64748b"
  }
}

/** Create a tile for an emoji */
function makeEmojiTile(item: EmojiItem): PickerItem {
  const categoryColor = getCategoryColor(item.category)

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="bg-${item.emoji.codePointAt(0)}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f8fafc" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="120" height="120" rx="12" fill="url(#bg-${item.emoji.codePointAt(0)})"/>
  <rect x="4" y="4" width="112" height="112" rx="10" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.08"/>

  <!-- Emoji -->
  <text x="60" y="58" text-anchor="middle" dominant-baseline="middle" font-size="42">${escapeForSvg(item.emoji)}</text>

  <!-- Category badge -->
  <rect x="8" y="90" width="${calculateBadgeWidth(CATEGORY_LABELS[item.category])}" height="18" rx="4" fill="${categoryColor}" fill-opacity="0.15"/>
  <text x="14" y="102" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="9" font-weight="500" fill="${categoryColor}">${escapeForSvg(CATEGORY_LABELS[item.category])}</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: item.emoji,
    previewUrl: dataUrl,
    data: item,
  }
}

/** Insert emoji into the textarea */
function insertEmoji(emoji: string): void {
  if (!insertTextAtCursor(emoji + " ")) return

  // Add to recently used (fire-and-forget, errors are non-critical)
  addRecentEmoji(emoji).catch(() => {
    // Silently ignore storage errors - not critical for UX
  })
}

const emojiCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    // Load recently used emojis if not cached
    let recentEmojis = getCommandCache<string[]>(CACHE_RECENT_EMOJIS)
    if (!recentEmojis) {
      recentEmojis = await getRecentEmojis()
      setCommandCache(CACHE_RECENT_EMOJIS, recentEmojis)
    }

    // If we have recent emojis, show them first
    if (recentEmojis.length > 0) {
      const recentItems = recentEmojis
        .map((emoji) => EMOJIS.find((e) => e.emoji === emoji))
        .filter((e): e is EmojiItem => e !== undefined)
        .map(makeEmojiTile)

      // Add some popular emojis if not enough recent ones
      const popularItems = getPopularEmojis()
        .filter((e) => !recentEmojis!.includes(e.emoji))
        .slice(0, Math.max(0, 12 - recentItems.length))
        .map(makeEmojiTile)

      return {
        items: [...recentItems, ...popularItems],
        suggest: getEmojiSuggestions(),
        suggestTitle: "Recent & Popular",
      }
    }

    // Otherwise show popular emojis
    const items = getPopularEmojis().map(makeEmojiTile)
    return {
      items,
      suggest: getEmojiSuggestions(),
      suggestTitle: "Popular emojis",
    }
  },

  getResults: async (query: string) => {
    const filtered = searchEmojis(query)
    const items = filtered.slice(0, 24).map(makeEmojiTile)
    return {
      items,
      suggestTitle: query ? "Matching emojis" : "All emojis",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertEmoji((it.data as EmojiItem).emoji),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertEmoji((it.data as EmojiItem).emoji),
      "Emojis"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertEmoji((it.data as EmojiItem).emoji)
  },

  noResultsMessage: "No matching emojis found. Try: smile, heart, fire, star",
}

// Register the command
registerCommand("emoji", emojiCommand)

export { emojiCommand, makeEmojiTile }
