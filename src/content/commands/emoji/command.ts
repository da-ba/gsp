/**
 * /emoji slash command implementation
 *
 * Provides an emoji picker with search and recently used favorites.
 */

import { registerCommand, type CommandSpec } from "../registry.ts"
import { createGridHandlers } from "../grid-handlers.ts"
import { getCommandCache, setCommandCache, insertTextAtCursor } from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { createSmallTile } from "../../../utils/tile-builder.ts"
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

/** Category colors for badges */
const CATEGORY_COLORS: Record<EmojiCategory, string> = {
  smileys: "#f59e0b",
  people: "#ec4899",
  nature: "#22c55e",
  food: "#f97316",
  activities: "#6366f1",
  travel: "#3b82f6",
  objects: "#8b5cf6",
  symbols: "#ef4444",
}

/** Create a tile for an emoji */
function makeEmojiTile(item: EmojiItem): PickerItem {
  return {
    id: item.emoji,
    previewUrl: createSmallTile({
      id: String(item.emoji.codePointAt(0)),
      mainText: item.emoji,
      mainFontSize: 42,
      category: CATEGORY_LABELS[item.category],
      categoryColor: CATEGORY_COLORS[item.category] || "#64748b",
    }),
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

  ...createGridHandlers<EmojiItem>((item) => insertEmoji(item.emoji)),

  noResultsMessage: "No matching emojis found. Try: smile, heart, fire, star",
}

// Register the command
registerCommand("emoji", emojiCommand)

export { emojiCommand, makeEmojiTile }
