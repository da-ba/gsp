/**
 * Shared constants and utilities for Giphy command
 */

import { clearCommandCache } from "../../picker/index.ts"

// Cache keys for Giphy-specific data
export const CACHE_TRENDING_TERMS = "giphy:trendingTerms"
export const CACHE_TRENDING_GIFS = "giphy:trendingGifs"
export const CACHE_IMAGE_FORMAT = "giphy:imageFormat"
export const CACHE_CENTER_IMAGE = "giphy:centerImage"

/** Clear Giphy caches */
export function clearGiphyCaches(): void {
  clearCommandCache(CACHE_TRENDING_TERMS)
  clearCommandCache(CACHE_TRENDING_GIFS)
}
