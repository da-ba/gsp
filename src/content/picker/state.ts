/**
 * Picker state management
 */

import type { GifItem } from "../../api/giphy.ts";

export interface PickerState {
  pickerEl: HTMLElement | null;
  headerTitleEl: HTMLElement | null;
  headerSubEl: HTMLElement | null;
  hintEl: HTMLElement | null;
  bodyEl: HTMLElement | null;
  footerEl: HTMLElement | null;
  activeField: HTMLTextAreaElement | null;
  activeLineStart: number;
  activeCursorPos: number;
  activeCommand: string;
  lastQuery: string;
  debounceId: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
  currentItems: GifItem[];
  selectedIndex: number;
  cols: number;
  mouseDownInPicker: boolean;
  suggestItems: string[];
  lastSuggestQuery: string;
  suggestDebounceId: ReturnType<typeof setTimeout> | null;
  cache: {
    giphyTrendingTerms: string[] | null;
    giphyTrendingGifs: GifItem[] | null;
  };
}

export function createPickerState(): PickerState {
  return {
    pickerEl: null,
    headerTitleEl: null,
    headerSubEl: null,
    hintEl: null,
    bodyEl: null,
    footerEl: null,
    activeField: null,
    activeLineStart: 0,
    activeCursorPos: 0,
    activeCommand: "",
    lastQuery: "",
    debounceId: null,
    inFlight: false,
    currentItems: [],
    selectedIndex: 0,
    cols: 3,
    mouseDownInPicker: false,
    suggestItems: [],
    lastSuggestQuery: "",
    suggestDebounceId: null,
    cache: {
      giphyTrendingTerms: null,
      giphyTrendingGifs: null,
    },
  };
}

// Global state singleton
export const state = createPickerState();

export function resetPickerState(): void {
  state.lastQuery = "";
  state.currentItems = [];
  state.selectedIndex = 0;
  state.suggestItems = [];
  state.lastSuggestQuery = "";
  state.activeCommand = "";
}
