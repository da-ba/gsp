/**
 * Chrome storage utilities for API keys
 */

const STORAGE_KEY = "giphyApiKey";

// Check if chrome.storage is available
function hasStorage(): boolean {
  return typeof chrome !== "undefined" && chrome?.storage?.local !== undefined;
}

export async function getGiphyKey(): Promise<string> {
  if (!hasStorage()) {
    // Fallback to localStorage
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  }
  const res = await chrome.storage.local.get({ [STORAGE_KEY]: "" });
  return ((res[STORAGE_KEY] as string) || "").trim();
}

export async function setGiphyKey(value: string): Promise<void> {
  const trimmed = String(value || "").trim();
  if (!hasStorage()) {
    // Fallback to localStorage
    localStorage.setItem(STORAGE_KEY, trimmed);
    return;
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: trimmed });
}
