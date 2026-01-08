/**
 * Generic filter and sort utilities for categorized items.
 *
 * Provides reusable functions that work with any item type
 * that has searchable fields and categories.
 */

/**
 * Configuration for filtering items.
 */
export type FilterConfig<T> = {
  /** The full list of items to filter */
  items: T[]
  /** Query string to filter by */
  query: string
  /** Functions to extract searchable strings from an item */
  searchFields: ((item: T) => string)[]
}

/**
 * Filter items by query string.
 * Returns all items if query is empty.
 * Matches if any search field contains the query (case-insensitive).
 */
export function filterItems<T>(config: FilterConfig<T>): T[] {
  const q = (config.query || "").toLowerCase().trim()
  if (!q) return config.items

  return config.items.filter((item) => {
    return config.searchFields.some((field) => {
      const value = field(item)
      return value.toLowerCase().includes(q)
    })
  })
}

/**
 * Configuration for sorting items by category.
 */
export type SortConfig<T, C extends string> = {
  /** Items to sort */
  items: T[]
  /** Original list for stable sort fallback */
  originalList: T[]
  /** Category order (first = highest priority) */
  categoryOrder: C[]
  /** Function to get category from item */
  getCategory: (item: T) => C
}

/**
 * Sort items by category order, then by original position.
 * Items with categories not in the order list are placed last.
 */
export function sortByCategory<T, C extends string>(config: SortConfig<T, C>): T[] {
  return [...config.items].sort((a, b) => {
    const aCategory = config.getCategory(a)
    const bCategory = config.getCategory(b)
    const aIdx = config.categoryOrder.indexOf(aCategory)
    const bIdx = config.categoryOrder.indexOf(bCategory)

    // Handle categories not in the order list
    const aSortIdx = aIdx === -1 ? config.categoryOrder.length : aIdx
    const bSortIdx = bIdx === -1 ? config.categoryOrder.length : bIdx

    // Primary sort by category order
    if (aSortIdx !== bSortIdx) return aSortIdx - bSortIdx

    // Secondary sort by original position (stable sort)
    return config.originalList.indexOf(a) - config.originalList.indexOf(b)
  })
}

/**
 * Combined filter and sort for categorized items.
 * Convenience function that combines filterItems and sortByCategory.
 */
export function filterAndSort<T, C extends string>(opts: {
  items: T[]
  query: string
  searchFields: ((item: T) => string)[]
  categoryOrder: C[]
  getCategory: (item: T) => C
}): T[] {
  const filtered = filterItems({
    items: opts.items,
    query: opts.query,
    searchFields: opts.searchFields,
  })

  return sortByCategory({
    items: filtered,
    originalList: opts.items,
    categoryOrder: opts.categoryOrder,
    getCategory: opts.getCategory,
  })
}

/**
 * Simple text search that checks if any of the provided strings
 * contain the query (case-insensitive).
 */
export function matchesQuery(query: string, ...searchables: string[]): boolean {
  const q = (query || "").toLowerCase().trim()
  if (!q) return true

  return searchables.some((s) => s.toLowerCase().includes(q))
}
