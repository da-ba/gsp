/**
 * Giphy slash command implementation
 */

import { replaceRange } from "../../../utils/dom.ts"
import { add } from "../../../utils/math.ts"
import {
  searchGifs,
  getTrendingGifs,
  getTrendingTerms,
  getAutocompleteTags,
  getGiphyKey,
  getGiphyImageFormat,
  getGiphyCenterImage,
  formatGifInsert,
  type GifItem,
  type GiphyImageFormat,
} from "./api.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import {
  renderGrid,
  state,
  getCommandCache,
  setCommandCache,
  clearCommandCache,
} from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"
import { GiphyPickerSettings } from "./GiphyPickerSettings.tsx"
import { GiphySetupPanel } from "./GiphySetupPanel.tsx"

// Cache keys for Giphy-specific data
const CACHE_TRENDING_TERMS = "giphy:trendingTerms"
const CACHE_TRENDING_GIFS = "giphy:trendingGifs"
const CACHE_IMAGE_FORMAT = "giphy:imageFormat"
const CACHE_CENTER_IMAGE = "giphy:centerImage"

/** Convert GifItem to PickerItem */
function toPickerItem(gif: GifItem): PickerItem {
  return {
    id: gif.id,
    previewUrl: gif.previewUrl,
    data: gif, // Store original GifItem for insertUrl access
  }
}

/** Get original GifItem from PickerItem */
function fromPickerItem(item: PickerItem): GifItem {
  return item.data as GifItem
}

/** Get cached image format settings, loading from storage if needed */
async function getCachedImageSettings(): Promise<{
  format: GiphyImageFormat
  center: boolean
}> {
  let format = getCommandCache<GiphyImageFormat>(CACHE_IMAGE_FORMAT)
  let center = getCommandCache<boolean>(CACHE_CENTER_IMAGE)

  if (format === null) {
    format = await getGiphyImageFormat()
    setCommandCache(CACHE_IMAGE_FORMAT, format)
  }

  if (center === null) {
    center = await getGiphyCenterImage()
    setCommandCache(CACHE_CENTER_IMAGE, center)
  }

  return { format, center }
}

/** Clear image format settings cache (call when settings change) */
export function clearImageSettingsCache(): void {
  clearCommandCache(CACHE_IMAGE_FORMAT)
  clearCommandCache(CACHE_CENTER_IMAGE)
}

async function insertGifMarkdown(url: string): Promise<void> {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const lineStart = state.activeLineStart

  const { format, center } = await getCachedImageSettings()
  const replacement = formatGifInsert(url, format, center)
  const newValue = replaceRange(value, lineStart, pos, replacement)
  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

const giphyCommand: CommandSpec = {
  preflight: async () => {
    const key = await getGiphyKey()
    if (!key) {
      return {
        showSetup: true,
        message: "Paste your Giphy API key to enable /giphy",
        SetupComponent: GiphySetupPanel,
      }
    }
    return { showSetup: false }
  },

  getEmptyState: async () => {
    const key = await getGiphyKey()
    if (!key) return { error: "Missing key" }

    // Load trending terms if not cached
    let trendingTerms = getCommandCache<string[]>(CACHE_TRENDING_TERMS)
    if (!trendingTerms) {
      const t = await getTrendingTerms(key)
      if (t.error) return { error: t.error }
      trendingTerms = t.data ?? []
      setCommandCache(CACHE_TRENDING_TERMS, trendingTerms)
    }

    // Load trending GIFs if not cached
    let trendingGifs = getCommandCache<GifItem[]>(CACHE_TRENDING_GIFS)
    if (!trendingGifs) {
      const g = await getTrendingGifs(key)
      if (g.error) return { error: g.error }
      trendingGifs = g.data ?? []
      setCommandCache(CACHE_TRENDING_GIFS, trendingGifs)
    }

    return {
      items: trendingGifs.map(toPickerItem),
      suggest: trendingTerms.slice(0, 8),
      suggestTitle: "Trending searches",
    }
  },

  getResults: async (query: string) => {
    const key = await getGiphyKey()
    if (!key) return { error: "Missing key" }

    const r = await searchGifs(key, query)
    if (r.error) return { error: r.error }
    return { items: (r.data ?? []).map(toPickerItem), suggestTitle: "Suggestions" }
  },

  getSuggestions: async (query: string) => {
    const key = await getGiphyKey()
    if (!key) return { items: [] }

    const r = await getAutocompleteTags(key, query)
    if (r.error) return { items: [] }
    return { items: r.data ?? [] }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(fromPickerItem(it).insertUrl),
      suggestTitle
    )
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(fromPickerItem(it).insertUrl),
      "Suggestions"
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertGifMarkdown(fromPickerItem(it).insertUrl)
  },

  noResultsMessage: "No results. Check your Giphy key in extension settings.",

  SettingsComponent: GiphyPickerSettings,
}

// Register the command
registerCommand("giphy", giphyCommand)

export { giphyCommand }
