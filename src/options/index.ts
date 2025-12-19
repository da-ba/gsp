/**
 * Options page script
 */

import { getGiphyKey, setGiphyKey } from "../utils/storage.ts";

async function loadKey(): Promise<void> {
  const el = document.getElementById("key") as HTMLInputElement | null;
  if (el) {
    el.value = await getGiphyKey();
  }
}

function wireShowHide(): void {
  const input = document.getElementById("key") as HTMLInputElement | null;
  const cb = document.getElementById("showKey") as HTMLInputElement | null;
  if (!input || !cb) return;

  cb.addEventListener("change", () => {
    input.type = cb.checked ? "text" : "password";
  });
}

function setStatus(text: string): void {
  const s = document.getElementById("status");
  if (s) s.textContent = text || "";
}

async function saveKey(): Promise<void> {
  const el = document.getElementById("key") as HTMLInputElement | null;
  const key = (el?.value || "").trim();
  await setGiphyKey(key);
  setStatus(key ? "Saved" : "Saved empty key");
  setTimeout(() => setStatus(""), 1600);
}

async function testKey(): Promise<void> {
  const el = document.getElementById("key") as HTMLInputElement | null;
  const key = (el?.value || "").trim();
  if (!key) {
    setStatus("Missing key");
    return;
  }

  setStatus("Testing");
  try {
    const url = new URL("https://api.giphy.com/v1/gifs/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("q", "ok");
    url.searchParams.set("limit", "1");
    url.searchParams.set("rating", "pg");
    const res = await fetch(url.toString());
    if (!res.ok) {
      setStatus("Test failed: " + String(res.status));
      return;
    }
    setStatus("Key ok");
  } catch {
    setStatus("Test error");
  }
}

// Initialize
document.getElementById("save")?.addEventListener("click", saveKey);
document.getElementById("test")?.addEventListener("click", testKey);
loadKey();
wireShowHide();
