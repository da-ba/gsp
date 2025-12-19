/**
 * Giphy slash command implementation
 */

import { getGiphyKey } from "../../utils/storage.ts";
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
import { renderGrid, state } from "../picker/index.ts";

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

const giphyCommand: CommandSpec = {
  preflight: async () => {
    const key = await getGiphyKey();
    if (!key) {
      return { showSetup: true, message: "Paste your Giphy API key to enable /giphy" };
    }
    return { showSetup: false };
  },

  getEmptyState: async () => {
    const key = await getGiphyKey();
    if (!key) return { error: "Missing key" };

    // Load trending terms if not cached
    if (!state.cache.giphyTrendingTerms) {
      const t = await getTrendingTerms(key);
      if (t.error) return { error: t.error };
      state.cache.giphyTrendingTerms = t.data ?? [];
    }

    // Load trending GIFs if not cached
    if (!state.cache.giphyTrendingGifs) {
      const g = await getTrendingGifs(key);
      if (g.error) return { error: g.error };
      state.cache.giphyTrendingGifs = g.data ?? [];
    }

    return {
      items: state.cache.giphyTrendingGifs || [],
      suggest: (state.cache.giphyTrendingTerms || []).slice(0, 8),
      suggestTitle: "Trending searches",
    };
  },

  getResults: async (query: string) => {
    const key = await getGiphyKey();
    if (!key) return { error: "Missing key" };

    const r = await searchGifs(key, query);
    if (r.error) return { error: r.error };
    return { items: r.data ?? [], suggestTitle: "Suggestions" };
  },

  getSuggestions: async (query: string) => {
    const key = await getGiphyKey();
    if (!key) return { items: [] };

    const r = await getAutocompleteTags(key, query);
    if (r.error) return { items: [] };
    return { items: r.data ?? [] };
  },

  renderItems: (items: GifItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(it.insertUrl),
      suggestTitle
    );
  },

  renderCurrent: () => {
    renderGrid(
      state.currentItems || [],
      (it) => it.previewUrl,
      (it) => insertGifMarkdown(it.insertUrl),
      "Suggestions"
    );
  },

  onSelect: (it: GifItem) => {
    if (!it) return;
    insertGifMarkdown(it.insertUrl);
  },
};

// Register the command
registerCommand("giphy", giphyCommand);

export { giphyCommand };
