/**
 * Giphy API Client
 */

import { getStorageValue, setStorageValue } from "../../../utils/storage.ts";

// Storage key for Giphy API key
const STORAGE_KEY_GIPHY_API = "giphyApiKey";
const STORAGE_KEY_IMAGE_FORMAT = "giphyImageFormat";
const STORAGE_KEY_CENTER_IMAGE = "giphyCenterImage";

/** Image format options for inserting GIFs */
export type GiphyImageFormat = "markdown" | "img" | "img-fixed";

/** Default image format (markdown) */
export const DEFAULT_IMAGE_FORMAT: GiphyImageFormat = "markdown";

/** Get Giphy image format setting */
export async function getGiphyImageFormat(): Promise<GiphyImageFormat> {
  return getStorageValue<GiphyImageFormat>(STORAGE_KEY_IMAGE_FORMAT, DEFAULT_IMAGE_FORMAT);
}

/** Set Giphy image format setting */
export async function setGiphyImageFormat(value: GiphyImageFormat): Promise<void> {
  await setStorageValue(STORAGE_KEY_IMAGE_FORMAT, value);
}

/** Get Giphy center image setting */
export async function getGiphyCenterImage(): Promise<boolean> {
  return getStorageValue<boolean>(STORAGE_KEY_CENTER_IMAGE, false);
}

/** Set Giphy center image setting */
export async function setGiphyCenterImage(value: boolean): Promise<void> {
  await setStorageValue(STORAGE_KEY_CENTER_IMAGE, value);
}

/** Format a GIF URL for insertion based on settings */
export function formatGifInsert(url: string, format: GiphyImageFormat, center: boolean): string {
  let imageMarkup: string;

  switch (format) {
    case "img":
      imageMarkup = `<img src="${url}" />`;
      break;
    case "img-fixed":
      imageMarkup = `<img src="${url}" width="350" />`;
      break;
    case "markdown":
    default:
      imageMarkup = `![](${url})`;
      break;
  }

  if (center) {
    return `<p align="center">${imageMarkup}</p>`;
  }

  return imageMarkup;
}

// Build-time injected API key (from environment variable)
// This is replaced at build time by Bun's define feature
declare const process: { env: { GIPHY_API_KEY?: string } };
const BUILD_TIME_GIPHY_KEY =
  typeof process !== "undefined" ? (process.env.GIPHY_API_KEY ?? "") : "";

/** Get Giphy API key from storage, falling back to build-time key */
export async function getGiphyKey(): Promise<string> {
  const storedKey = await getStorageValue<string>(STORAGE_KEY_GIPHY_API, "");
  const key = storedKey.trim();
  // Return stored key if set, otherwise use build-time key
  return key || BUILD_TIME_GIPHY_KEY;
}

/** Set Giphy API key in storage */
export async function setGiphyKey(value: string): Promise<void> {
  await setStorageValue(STORAGE_KEY_GIPHY_API, value.trim());
}

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

/** Test if a Giphy API key is valid */
export async function testGiphyKey(apiKey: string): Promise<GiphyResult<boolean>> {
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", "ok");
  url.searchParams.set("limit", "1");
  url.searchParams.set("rating", "pg");

  const out = await giphyGetJson(url.toString());
  if (out.error) return { error: out.error };
  return { data: true };
}
