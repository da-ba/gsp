/**
 * Giphy slash command implementation
 */

import { getGiphyKey, setGiphyKey } from "../../utils/storage.ts";
import { replaceRange } from "../../utils/dom.ts";
import { add } from "../../utils/math.ts";
import {
  searchGifs,
  getTrendingGifs,
  getTrendingTerms,
  getAutocompleteTags,
  type GifItem,
} from "../../api/giphy.ts";
import { registerCommand, type CommandSpec } from "./registry.ts";
import {
  renderGrid,
  state,
  getCommandCache,
  setCommandCache,
  clearCommandCache,
  getCardStyles,
  getInputStyles,
  getButtonStyles,
} from "../picker/index.ts";
import type { PickerItem } from "../types.ts";

// Cache keys for Giphy-specific data
const CACHE_TRENDING_TERMS = "giphy:trendingTerms";
const CACHE_TRENDING_GIFS = "giphy:trendingGifs";

/** Convert GifItem to PickerItem */
function toPickerItem(gif: GifItem): PickerItem {
  return {
    id: gif.id,
    previewUrl: gif.previewUrl,
    data: gif, // Store original GifItem for insertUrl access
  };
}

/** Get original GifItem from PickerItem */
function fromPickerItem(item: PickerItem): GifItem {
  return item.data as GifItem;
}

function insertGifMarkdown(url: string): void {
  const field = state.activeField;
  if (!field) return;
  if (field.tagName !== "TEXTAREA") return;

  const value = field.value || "";
  const pos = field.selectionStart || 0;
  const lineStart = state.activeLineStart;

  const replacement = "![](" + url + ")";
  const newValue = replaceRange(value, lineStart, pos, replacement);
  field.value = newValue;

  const newPos = add(lineStart, replacement.length);
  field.focus();
  field.setSelectionRange(newPos, newPos);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Helper to apply style object to element */
function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && typeof value === "string") {
      el.style.setProperty(
        key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        value
      );
    }
  }
}

/**
 * Render the Giphy API key setup panel.
 * This is provided to the picker via preflight's renderSetup callback.
 */
function renderGiphySetupPanel(bodyEl: HTMLElement, onComplete: () => void): void {
  const wrap = document.createElement("div");
  applyStyles(wrap, getCardStyles());
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "10px";

  const label = document.createElement("div");
  label.textContent = "Enter your Giphy API key";
  label.style.fontWeight = "600";
  wrap.appendChild(label);

  const desc = document.createElement("div");
  desc.style.fontSize = "12px";
  desc.style.opacity = "0.72";
  desc.innerHTML =
    'Get a free key at <a href="https://developers.giphy.com/dashboard/" target="_blank" style="color:inherit;text-decoration:underline;">developers.giphy.com</a>';
  wrap.appendChild(desc);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Paste API key…";
  applyStyles(input, getInputStyles());
  wrap.appendChild(input);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Save Key";
  applyStyles(btn, getButtonStyles());
  btn.style.marginTop = "4px";
  wrap.appendChild(btn);

  const msg = document.createElement("div");
  msg.style.fontSize = "12px";
  msg.style.opacity = "0.72";
  wrap.appendChild(msg);

  btn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (!val) {
      msg.textContent = "Please enter a key";
      return;
    }
    msg.textContent = "Saving…";
    await setGiphyKey(val);
    // Clear Giphy-specific cache before retrying
    clearCommandCache(CACHE_TRENDING_TERMS);
    clearCommandCache(CACHE_TRENDING_GIFS);
    msg.textContent = "Saved! Loading GIFs…";
    onComplete();
  });

  bodyEl.appendChild(wrap);
}

const giphyCommand: CommandSpec = {
  preflight: async () => {
    const key = await getGiphyKey();
    if (!key) {
      return {
        showSetup: true,
        message: "Paste your Giphy API key to enable /giphy",
        renderSetup: renderGiphySetupPanel,
      };
    }
    return { showSetup: false };
  },

  getEmptyState: async () => {
    const key = await getGiphyKey();
    if (!key) return { error: "Missing key" };

    // Load trending terms if not cached
    let trendingTerms = getCommandCache<string[]>(CACHE_TRENDING_TERMS);
    if (!trendingTerms) {
      const t = await getTrendingTerms(key);
      if (t.error) return { error: t.error };
      trendingTerms = t.data ?? [];
      setCommandCache(CACHE_TRENDING_TERMS, trendingTerms);
    }

    // Load trending GIFs if not cached
    let trendingGifs = getCommandCache<GifItem[]>(CACHE_TRENDING_GIFS);
    if (!trendingGifs) {
      const g = await getTrendingGifs(key);
      if (g.error) return { error: g.error };
      trendingGifs = g.data ?? [];
      setCommandCache(CACHE_TRENDING_GIFS, trendingGifs);
    }

    return {
      items: trendingGifs.map(toPickerItem),
      suggest: trendingTerms.slice(0, 8),
      suggestTitle: "Trending searches",
    };
  },

  getResults: async (query: string) => {
    const key = await getGiphyKey();
    if (!key) return { error: "Missing key" };

    const r = await searchGifs(key, query);
    if (r.error) return { error: r.error };
    return { items: (r.data ?? []).map(toPickerItem), suggestTitle: "Suggestions" };
  },

  getSuggestions: async (query: string) => {
    const key = await getGiphyKey();
    if (!key) return { items: [] };

    const r = await getAutocompleteTags(key, query);
    if (r.error) return { items: [] };
    return { items: r.data ?? [] };
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(fromPickerItem(it).insertUrl),
      suggestTitle
    );
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(fromPickerItem(it).insertUrl),
      "Suggestions"
    );
  },

  onSelect: (it: PickerItem) => {
    if (!it) return;
    insertGifMarkdown(fromPickerItem(it).insertUrl);
  },

  noResultsMessage: "No results. Check your Giphy key in extension settings.",
};

// Register the command
registerCommand("giphy", giphyCommand);

export { giphyCommand };
