/**
 * SVG Tile Builder
 *
 * Provides a reusable system for creating picker tiles with consistent styling.
 * Eliminates duplication across command implementations.
 */

import { escapeForSvg } from "./svg.ts"
import { calculateBadgeWidth } from "../content/picker/styles.ts"

export type TileSize = "standard" | "small" | "wide"

export type TileConfig = {
  /** Tile size preset */
  size?: TileSize
  /** Custom width (overrides size preset) */
  width?: number
  /** Custom height (overrides size preset) */
  height?: number
  /** Background gradient end color (start is always white-ish) */
  bgColor?: string
  /** Unique ID for gradients (to avoid conflicts) */
  id: string
}

export type BadgeConfig = {
  /** Badge label text */
  label: string
  /** Badge color */
  color: string
  /** Position from left edge */
  x?: number
  /** Position from top edge */
  y?: number
}

export type TextContentConfig = {
  /** Text to display */
  text: string
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Font size */
  fontSize?: number
  /** Font weight */
  fontWeight?: string
  /** Font style (italic, normal) */
  fontStyle?: string
  /** Text decoration (line-through, etc) */
  textDecoration?: string
  /** Text color */
  fill?: string
  /** Opacity */
  opacity?: number
  /** Text anchor (start, middle, end) */
  anchor?: "start" | "middle" | "end"
  /** Use monospace font */
  monospace?: boolean
}

export type IconContentConfig = {
  /** SVG path or element content */
  svg: string
}

const SIZE_PRESETS: Record<TileSize, { width: number; height: number; rx: number; innerRx: number; padding: number }> = {
  standard: { width: 240, height: 176, rx: 18, innerRx: 14, padding: 12 },
  small: { width: 120, height: 120, rx: 12, innerRx: 10, padding: 4 },
  wide: { width: 240, height: 120, rx: 12, innerRx: 10, padding: 4 },
}

const FONT_SYSTEM = "system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

/**
 * Build an SVG tile with the standard picker style.
 *
 * @param config - Tile configuration
 * @param badge - Optional badge at top-left
 * @param content - Array of content elements (text, icons, custom SVG)
 * @returns SVG string
 */
export function buildTile(
  config: TileConfig,
  badge?: BadgeConfig,
  content: (TextContentConfig | IconContentConfig | string)[] = []
): string {
  const sizePreset = SIZE_PRESETS[config.size || "standard"]
  const width = config.width || sizePreset.width
  const height = config.height || sizePreset.height
  const rx = sizePreset.rx
  const innerRx = sizePreset.innerRx
  const padding = sizePreset.padding
  const bgColor = config.bgColor || "#f8fafc"

  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2

  let contentSvg = ""

  // Render badge if provided
  if (badge) {
    const badgeWidth = calculateBadgeWidth(badge.label)
    const badgeX = badge.x ?? (padding + 8)
    const badgeY = badge.y ?? (padding + 8)
    const fontSize = config.size === "small" ? 9 : 12

    contentSvg += `
  <!-- Category badge -->
  <rect x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${config.size === "small" ? 18 : 24}" rx="${config.size === "small" ? 4 : 6}" fill="${badge.color}" fill-opacity="0.15"/>
  <text x="${badgeX + 8}" y="${badgeY + (config.size === "small" ? 12 : 17)}" font-family="${FONT_SYSTEM}" font-size="${fontSize}" font-weight="${config.size === "small" ? 500 : 600}" fill="${badge.color}">${escapeForSvg(badge.label)}</text>`
  }

  // Render content
  for (const item of content) {
    if (typeof item === "string") {
      // Raw SVG content
      contentSvg += "\n  " + item
    } else if ("svg" in item) {
      // Icon content
      contentSvg += "\n  " + item.svg
    } else {
      // Text content
      const font = item.monospace ? FONT_MONO : FONT_SYSTEM
      const anchor = item.anchor || "start"
      const fill = item.fill || "#0f172a"
      const opacity = item.opacity ?? 0.85
      const fontSize = item.fontSize || 14
      const fontWeight = item.fontWeight || "500"
      const fontStyle = item.fontStyle || "normal"
      const textDecoration = item.textDecoration || "none"

      contentSvg += `
  <text x="${item.x}" y="${item.y}" text-anchor="${anchor}" font-family="${font}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" text-decoration="${textDecoration}" fill="${fill}" fill-opacity="${opacity}">${escapeForSvg(item.text)}</text>`
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg-${config.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="${bgColor}" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="url(#bg-${config.id})"/>
  <rect x="${padding}" y="${padding}" width="${innerWidth}" height="${innerHeight}" rx="${innerRx}" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.10"/>${contentSvg}
</svg>`

  return svg
}

/**
 * Convert SVG string to a data URL for use in img src.
 */
export function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

/**
 * Build a tile and return it as a data URL.
 * Convenience wrapper combining buildTile and svgToDataUrl.
 */
export function buildTileDataUrl(
  config: TileConfig,
  badge?: BadgeConfig,
  content: (TextContentConfig | IconContentConfig | string)[] = []
): string {
  return svgToDataUrl(buildTile(config, badge, content))
}

// ============================================================================
// Pre-built tile templates for common patterns
// ============================================================================

/**
 * Create a standard command tile with badge, centered main text, and bottom label.
 */
export function createCategoryTile(opts: {
  id: string
  category: string
  categoryColor: string
  mainText: string
  mainFontSize?: number
  mainFontWeight?: string
  mainFontStyle?: string
  mainTextDecoration?: string
  mainColor?: string
  mainMonospace?: boolean
  label: string
}): string {
  return buildTileDataUrl(
    { id: opts.id, size: "standard" },
    { label: opts.category, color: opts.categoryColor },
    [
      {
        text: opts.mainText,
        x: 120,
        y: 90,
        anchor: "middle",
        fontSize: opts.mainFontSize || 20,
        fontWeight: opts.mainFontWeight || "600",
        fontStyle: opts.mainFontStyle,
        textDecoration: opts.mainTextDecoration,
        fill: opts.mainColor,
        monospace: opts.mainMonospace,
      },
      {
        text: opts.label,
        x: 120,
        y: 145,
        anchor: "middle",
        fontSize: 13,
        fontWeight: "500",
        opacity: 0.55,
      },
    ]
  )
}

/**
 * Create a small emoji-style tile with centered content and bottom badge.
 */
export function createSmallTile(opts: {
  id: string
  mainText: string
  mainFontSize?: number
  category: string
  categoryColor: string
}): string {
  const badgeWidth = calculateBadgeWidth(opts.category)
  return buildTileDataUrl(
    { id: opts.id, size: "small" },
    { label: opts.category, color: opts.categoryColor, x: 8, y: 90 },
    [
      {
        text: opts.mainText,
        x: 60,
        y: 58,
        anchor: "middle",
        fontSize: opts.mainFontSize || 42,
      },
    ]
  )
}

/**
 * Create an empty/placeholder tile with dashed border.
 */
export function createEmptyTile(opts: {
  id: string
  message: string
  icon?: string
}): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
  <defs>
    <linearGradient id="bg-${opts.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fafc" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#f1f5f9" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#bg-${opts.id})"/>
  <rect x="4" y="4" width="232" height="112" rx="10" fill="#ffffff" fill-opacity="0.55" stroke="#0f172a" stroke-opacity="0.06" stroke-dasharray="4 2"/>
  ${opts.icon || ""}
  <text x="120" y="92" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b">${escapeForSvg(opts.message)}</text>
</svg>`
  return svgToDataUrl(svg)
}

/**
 * Create a tile with custom icon and centered text (for diagrams/templates).
 */
export function createIconTile(opts: {
  id: string
  category: string
  categoryColor: string
  iconSvg: string
  label: string
  description?: string
}): string {
  return buildTileDataUrl(
    { id: opts.id, size: "standard" },
    { label: opts.category, color: opts.categoryColor },
    [
      { svg: `<g transform="translate(60, 35)" fill="${opts.categoryColor}">${opts.iconSvg}</g>` },
      {
        text: opts.label,
        x: 120,
        y: 125,
        anchor: "middle",
        fontSize: 14,
        fontWeight: "600",
        opacity: 0.86,
      },
      ...(opts.description
        ? [
            {
              text: opts.description,
              x: 120,
              y: 145,
              anchor: "middle" as const,
              fontSize: 11,
              fontWeight: "400",
              opacity: 0.55,
            },
          ]
        : []),
    ]
  )
}

/**
 * Create a tile with left-aligned text layout (for date/time options).
 */
export function createDetailTile(opts: {
  id: string
  category: string
  categoryColor: string
  title: string
  preview: string
  description: string
  maxPreviewLength?: number
}): string {
  const maxLen = opts.maxPreviewLength || 28
  const displayPreview =
    opts.preview.length > maxLen ? opts.preview.slice(0, maxLen - 3) + "..." : opts.preview

  return buildTileDataUrl(
    { id: opts.id, size: "standard" },
    { label: opts.category, color: opts.categoryColor },
    [
      {
        text: opts.title,
        x: 24,
        y: 75,
        fontSize: 18,
        fontWeight: "600",
        opacity: 0.86,
      },
      {
        text: displayPreview,
        x: 24,
        y: 105,
        fontSize: 12,
        fontWeight: "400",
        opacity: 0.65,
        monospace: true,
      },
      {
        text: opts.description,
        x: 24,
        y: 145,
        fontSize: 12,
        fontWeight: "500",
        opacity: 0.50,
      },
    ]
  )
}

/**
 * Create a simple tile with a title and subtitle (for command lists).
 */
export function createSimpleTile(opts: {
  id: string
  title: string
  subtitle: string
  bgColor?: string
}): string {
  return buildTileDataUrl(
    { id: opts.id, size: "standard", bgColor: opts.bgColor || "#eef2ff" },
    undefined,
    [
      {
        text: opts.title,
        x: 24,
        y: 86,
        fontSize: 26,
        fontWeight: "700",
        opacity: 0.86,
      },
      {
        text: opts.subtitle,
        x: 24,
        y: 118,
        fontSize: 14,
        fontWeight: "500",
        opacity: 0.55,
      },
    ]
  )
}

/**
 * Create a status tile (loading, error, warning, no results).
 */
export function createStatusTile(opts: {
  id: string
  type: "loading" | "error" | "warning" | "empty"
  message: string
  submessage?: string
}): string {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    loading: { bg: "#f1f5f9", icon: "#94a3b8", text: "#64748b" },
    error: { bg: "#fee2e2", icon: "#ef4444", text: "#dc2626" },
    warning: { bg: "#fef9c3", icon: "#f59e0b", text: "#92400e" },
    empty: { bg: "#f1f5f9", icon: "#94a3b8", text: "#64748b" },
  }

  const c = colors[opts.type]

  const icons: Record<string, string> = {
    loading: `<circle cx="120" cy="50" r="12" stroke="${c.icon}" stroke-width="2" fill="none" stroke-dasharray="18 18" stroke-linecap="round">
    <animateTransform attributeName="transform" type="rotate" from="0 120 50" to="360 120 50" dur="1s" repeatCount="indefinite"/>
  </circle>`,
    error: `<circle cx="120" cy="45" r="12" stroke="${c.icon}" stroke-width="2" fill="none"/>
  <line x1="115" y1="40" x2="125" y2="50" stroke="${c.icon}" stroke-width="2" stroke-linecap="round"/>
  <line x1="125" y1="40" x2="115" y2="50" stroke="${c.icon}" stroke-width="2" stroke-linecap="round"/>`,
    warning: `<path d="M120 35 L135 60 L105 60 Z" stroke="${c.icon}" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <line x1="120" y1="45" x2="120" y2="50" stroke="${c.icon}" stroke-width="2" stroke-linecap="round"/>
  <circle cx="120" cy="55" r="1.5" fill="${c.icon}"/>`,
    empty: `<circle cx="115" cy="45" r="12" stroke="${c.icon}" stroke-width="2" fill="none"/>
  <line x1="123" y1="53" x2="130" y2="60" stroke="${c.icon}" stroke-width="2" stroke-linecap="round"/>`,
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">
  <defs>
    <linearGradient id="bg-${opts.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.bg}" stop-opacity="0.96"/>
      <stop offset="1" stop-color="${c.bg}" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="120" rx="12" fill="url(#bg-${opts.id})"/>
  <rect x="4" y="4" width="232" height="112" rx="10" fill="#ffffff" fill-opacity="0.55" stroke="#0f172a" stroke-opacity="0.06"/>
  ${icons[opts.type]}
  <text x="120" y="${opts.submessage ? "80" : "85"}" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="11" fill="${c.text}">${escapeForSvg(opts.message)}</text>
  ${opts.submessage ? `<text x="120" y="96" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="10" fill="${c.text}" fill-opacity="0.7">${escapeForSvg(opts.submessage)}</text>` : ""}
</svg>`

  return svgToDataUrl(svg)
}
