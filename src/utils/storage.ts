/**
 * Chrome storage utilities for API keys
 */

const STORAGE_KEY = "giphyApiKey";

export async function getGiphyKey(): Promise<string> {
  const res = await chrome.storage.local.get({ [STORAGE_KEY]: "" });
  return ((res[STORAGE_KEY] as string) || "").trim();
}

export async function setGiphyKey(value: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: String(value || "").trim() });
}
