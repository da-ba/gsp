/**
 * Giphy slash command implementation
 */

import {
  searchGifs,
  getTrendingGifs,
  getTrendingTerms,
  getAutocompleteTags,
  getGiphyKey,
  setGiphyKey,
  getGiphyImageFormat,
  getGiphyCenterImage,
  formatGifInsert,
  type GifItem,
  type GiphyImageFormat,
} from "./api.ts"
import { registerCommand, type CommandSpec } from "../registry.ts"
import {
  renderGrid,
  getCommandCache,
  setCommandCache,
  clearCommandCache,
  getCardStyles,
  applyStyles,
  insertTextAtCursor,
  renderTokenForm,
} from "../../picker/index.ts"
import type { PickerItem } from "../../types.ts"

// Cache keys for Giphy-specific data
const CACHE_TRENDING_TERMS = "giphy:trendingTerms"
const CACHE_TRENDING_GIFS = "giphy:trendingGifs"
const CACHE_IMAGE_FORMAT = "giphy:imageFormat"
const CACHE_CENTER_IMAGE = "giphy:centerImage"

/** Clear Giphy caches */
function clearGiphyCaches(): void {
  clearCommandCache(CACHE_TRENDING_TERMS)
  clearCommandCache(CACHE_TRENDING_GIFS)
}

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
  const { format, center } = await getCachedImageSettings()
  insertTextAtCursor(formatGifInsert(url, format, center))
}

export type GiphyKeyFormOptions = {
  /** Show Clear button (for settings panel) */
  showClear?: boolean
  /** Load and show masked current key */
  showCurrentKey?: boolean
  /** Callback after save completes */
  onSave?: () => void
}

/**
 * Render Giphy API key form using shared token form component.
 */
function renderGiphyKeyForm(container: HTMLElement, options: GiphyKeyFormOptions = {}): void {
  const { showClear = false, showCurrentKey = false, onSave } = options

  renderTokenForm(container, {
    label: "Giphy API Key",
    description:
      'Get a free key at <a href="https://developers.giphy.com/dashboard/" target="_blank" style="color:inherit;text-decoration:underline;">developers.giphy.com</a>',
    placeholder: "Paste API key…",
    saveButtonText: "Save Key",
    showClear,
    loadCurrentValue: showCurrentKey ? getGiphyKey : undefined,
    onSave: async (value) => {
      await setGiphyKey(value)
      clearGiphyCaches()
    },
    onClear: showClear
      ? async () => {
          await setGiphyKey("")
          clearGiphyCaches()
        }
      : undefined,
    onSaveComplete: onSave,
  })
}

/**
 * Render the Giphy API key setup panel (preflight).
 */
function renderGiphySetupPanel(bodyEl: HTMLElement, onComplete: () => void): void {
  const wrap = document.createElement("div")
  applyStyles(wrap, getCardStyles())
  wrap.style.display = "flex"
  wrap.style.flexDirection = "column"
  wrap.style.gap = "10px"

  renderGiphyKeyForm(wrap, {
    showClear: false,
    showCurrentKey: false,
    onSave: onComplete,
  })

  bodyEl.appendChild(wrap)
}

const giphyCommand: CommandSpec = {
  preflight: async () => {
    const key = await getGiphyKey()
    if (!key) {
      return {
        showSetup: true,
        message: "Paste your Giphy API key to enable /giphy",
        renderSetup: renderGiphySetupPanel,
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

  onSelect: (it: PickerItem) => {
    if (!it) return
    insertGifMarkdown(fromPickerItem(it).insertUrl)
  },

  noResultsMessage: "No results. Check your Giphy key in extension settings.",

  renderSettings: (container: HTMLElement) => {
    renderGiphyKeyForm(container, {
      showClear: true,
      showCurrentKey: true,
    })
  },
}

// Register the command
registerCommand("giphy", giphyCommand)

export { giphyCommand }
