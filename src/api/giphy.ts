/**
 * Giphy API Client
 */

import { getGiphyKey } from "../utils/storage.ts";

// Types
export interface GifItem {
  kind: "gif";
  id: string;
  previewUrl: string;
  insertUrl: string;
}

export interface GiphyResult<T> {
  data?: T;
  error?: string;
}

interface GiphyImage {
  url?: string;
  https_url?: string;
}

interface GiphyGifData {
  id?: string;
  images?: {
    fixed_width?: GiphyImage;
    original?: GiphyImage;
  };
}

interface GiphyMeta {
  status?: number;
  msg?: string;
}

interface GiphyResponse {
  data?: GiphyGifData[] | string[];
  meta?: GiphyMeta;
}

interface GiphyTagItem {
  name?: string;
}

// Helpers

async function redactApiKey(url: string): Promise<string> {
  try {
    const u = new URL(url);
    if (u.searchParams.has("api_key")) {
      u.searchParams.set("api_key", "REDACTED");
    }
    return u.toString();
  } catch {
    return url;
  }
}

function pickHttpsUrl(img: GiphyImage | undefined): string {
  const candidate = String((img && (img.https_url || img.url)) || "").trim();
  if (!candidate) return "";
  if (candidate.startsWith("https://")) return candidate;
  if (candidate.startsWith("http://")) {
    return "https://" + candidate.slice("http://".length);
  }
  return "";
}

function mapGifItems(json: GiphyResponse | null): GifItem[] {
  const items = json && Array.isArray(json.data) ? json.data : [];
  return (items as GiphyGifData[])
    .map((it) => {
      const images = it?.images;
      const fixed = images?.fixed_width;
      const original = images?.original;
      const previewUrl = pickHttpsUrl(fixed);
      const insertUrl = pickHttpsUrl(original) || previewUrl;
      return {
        kind: "gif" as const,
        id: it?.id || "",
        previewUrl,
        insertUrl,
      };
    })
    .filter((g) => g.previewUrl && g.insertUrl);
}

async function giphyGetJson(url: string): Promise<GiphyResult<GiphyResponse>> {
  let res: Response | null = null;

  try {
    res = await fetch(url, { method: "GET" });
  } catch {
    const safeUrl = await redactApiKey(url);
    console.warn("GitHub Slash Palette Giphy fetch error", safeUrl);
    return { error: "Network error while calling Giphy" };
  }

  let json: GiphyResponse | null = null;
  let text = "";

  try {
    json = await res.json();
  } catch {
    try {
      text = await res.text();
    } catch {
      // Ignore
    }
  }

  if (!res.ok) {
    const safeUrl = await redactApiKey(url);
    const meta = json?.meta;
    const msg = meta?.msg ? String(meta.msg) : "";
    const shortText = text ? String(text).slice(0, 160) : "";
    const detail = msg || shortText;
    console.warn("GitHub Slash Palette Giphy error", res.status, safeUrl, detail);
    return { error: "Giphy error " + String(res.status) + (detail ? ": " + detail : "") };
  }

  if (json?.meta?.status !== undefined && json.meta.status >= 400) {
    const meta = json.meta;
    const safeUrl = await redactApiKey(url);
    const msg = meta.msg ? String(meta.msg) : "";
    console.warn("GitHub Slash Palette Giphy meta error", meta.status, safeUrl, msg);
    return { error: "Giphy error " + String(meta.status) + (msg ? ": " + msg : "") };
  }

  return { data: json ?? undefined };
}

// Public API

export async function searchGifs(apiKey: string, query: string): Promise<GiphyResult<GifItem[]>> {
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "12");
  url.searchParams.set("rating", "pg");
  url.searchParams.set("lang", "en");

  const out = await giphyGetJson(url.toString());
  if (out.error) return { error: out.error };
  return { data: mapGifItems(out.data ?? null) };
}

export async function getTrendingGifs(apiKey: string): Promise<GiphyResult<GifItem[]>> {
  const url = new URL("https://api.giphy.com/v1/gifs/trending");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", "12");
  url.searchParams.set("rating", "pg");

  const out = await giphyGetJson(url.toString());
  if (out.error) return { error: out.error };
  return { data: mapGifItems(out.data ?? null) };
}

export async function getTrendingTerms(apiKey: string): Promise<GiphyResult<string[]>> {
  const url = new URL("https://api.giphy.com/v1/trending/searches");
  url.searchParams.set("api_key", apiKey);

  const out = await giphyGetJson(url.toString());
  if (out.error) return { error: out.error };
  const arr = out.data?.data ?? [];
  const terms = (arr as string[]).map((s) => String(s || "")).filter(Boolean);
  return { data: terms };
}

export async function getAutocompleteTags(
  apiKey: string,
  query: string
): Promise<GiphyResult<string[]>> {
  const url = new URL("https://api.giphy.com/v1/gifs/search/tags");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");

  const out = await giphyGetJson(url.toString());
  if (out.error) return { error: out.error };

  const items = out.data?.data ?? [];
  const terms = (items as (GiphyTagItem | string)[])
    .map((it) => {
      if (!it) return "";
      if (typeof it === "string") return it;
      if (typeof it === "object" && "name" in it) return it.name ?? "";
      return "";
    })
    .filter(Boolean);

  return { data: terms };
}

/**
 * Helper to check if we have a valid API key
 */
export async function hasApiKey(): Promise<boolean> {
  const key = await getGiphyKey();
  return Boolean(key);
}
