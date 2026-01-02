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
  state,
  getCommandCache,
  setCommandCache,
  clearCommandCache,
  getCardStyles,
  getInputStyles,
  getBadgeStyles,
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
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const value = field.value || ""
  const pos = field.selectionStart || 0
  const commandStart = add(state.activeLineStart, state.activeCommandStart)

  const { format, center } = await getCachedImageSettings()
  const replacement = formatGifInsert(url, format, center)
  const newValue = replaceRange(value, commandStart, pos, replacement)
  field.value = newValue

  const newPos = add(commandStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Helper to apply style object to element */
function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && typeof value === "string") {
      el.style.setProperty(
        key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        value
      )
    }
  }
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
 * Render Giphy API key form (shared between setup panel and settings)
 */
function renderGiphyKeyForm(container: HTMLElement, options: GiphyKeyFormOptions = {}): void {
  const { showClear = false, showCurrentKey = false, onSave } = options

  const section = document.createElement("div")
  section.style.display = "flex"
  section.style.flexDirection = "column"
  section.style.gap = "8px"

  const label = document.createElement("div")
  label.textContent = "Giphy API Key"
  label.style.fontWeight = "600"
  section.appendChild(label)

  const desc = document.createElement("div")
  desc.style.fontSize = "12px"
  desc.style.opacity = "0.72"
  desc.innerHTML =
    'Get a free key at <a href="https://developers.giphy.com/dashboard/" target="_blank" style="color:inherit;text-decoration:underline;">developers.giphy.com</a>'
  section.appendChild(desc)

  const input = document.createElement("input")
  input.type = "text"
  input.placeholder = "Paste API key…"
  applyStyles(input, getInputStyles())
  section.appendChild(input)

  // Load current key if requested
  if (showCurrentKey) {
    getGiphyKey().then((key) => {
      if (key) {
        input.value = key.slice(0, 4) + "…" + key.slice(-4)
      }
    })
  }

  const btnRow = document.createElement("div")
  btnRow.style.display = "flex"
  btnRow.style.gap = "8px"

  const saveBtn = document.createElement("button")
  saveBtn.type = "button"
  saveBtn.setAttribute("data-settings-action", "true")
  saveBtn.textContent = "Save Key"
  applyStyles(saveBtn, getBadgeStyles())
  saveBtn.style.cursor = "pointer"
  saveBtn.style.padding = "6px 12px"
  btnRow.appendChild(saveBtn)

  if (showClear) {
    const clearBtn = document.createElement("button")
    clearBtn.type = "button"
    clearBtn.setAttribute("data-settings-action", "true")
    clearBtn.textContent = "Clear"
    applyStyles(clearBtn, getBadgeStyles())
    clearBtn.style.cursor = "pointer"
    clearBtn.style.padding = "6px 12px"
    clearBtn.style.opacity = "0.72"
    btnRow.appendChild(clearBtn)

    clearBtn.addEventListener("click", async (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      await setGiphyKey("")
      clearGiphyCaches()
      input.value = ""
      msg.textContent = "Cleared"
    })
  }

  section.appendChild(btnRow)

  const msg = document.createElement("div")
  msg.style.fontSize = "12px"
  msg.style.opacity = "0.72"
  section.appendChild(msg)

  saveBtn.addEventListener("click", async (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    const val = input.value.trim()
    if (val.includes("…")) {
      msg.textContent = "Enter a new key to save"
      return
    }
    if (!val) {
      msg.textContent = "Please enter a key"
      return
    }
    msg.textContent = "Saving…"
    await setGiphyKey(val)
    clearGiphyCaches()
    msg.textContent = "Saved!"
    input.value = val.slice(0, 4) + "…" + val.slice(-4)
    onSave?.()
  })

  container.appendChild(section)
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
