/**
 * DOM utilities and helpers
 */

import { add, sub } from "./math.ts"
import { COMMAND_PREFIX, COMMAND_PREFIX_LENGTH } from "./command-prefix.ts"

export type CursorInfo = {
  value: string
  pos: number
  lineStart: number
  line: string
}

export type CaretCoordinates = {
  left: number
  top: number
  height: number
}

/**
 * Check if element is a GitHub markdown textarea
 */
export function isGitHubMarkdownField(el: Element | null): el is HTMLTextAreaElement {
  if (!el) return false
  return el.tagName === "TEXTAREA"
}

/**
 * Get cursor position info from a textarea
 */
export function getCursorInfo(textarea: HTMLTextAreaElement): CursorInfo {
  const value = textarea.value || ""
  const pos = textarea.selectionStart || 0
  let lineStart = value.lastIndexOf("\n", pos)
  if (lineStart < 0) lineStart = 0
  else lineStart = add(lineStart, 1)
  const line = value.slice(lineStart, pos)
  return { value, pos, lineStart, line }
}

/**
 * Parse slash command from line text.
 * The command prefix (default: "//") can be at the beginning of the line or preceded by a space.
 * Returns the command, query, and the offset within the line where the prefix was found.
 */
export function parseSlashCommand(
  line: string
): { cmd: string; query: string; slashOffset: number } | null {
  const text = line || ""
  if (!text) return null

  const prefixLen = COMMAND_PREFIX_LENGTH

  // Find the last occurrence of the prefix that is either at position 0 or preceded by a space
  let prefixIdx = -1
  for (let i = text.length - 1; i >= prefixLen - 1; i--) {
    const potentialPrefix = text.slice(i - prefixLen + 1, i + 1)
    if (
      potentialPrefix === COMMAND_PREFIX &&
      (i === prefixLen - 1 || text[i - prefixLen] === " ")
    ) {
      // Validate that the character after the prefix (if any) is a letter, whitespace, or end of string
      // This prevents matching patterns like "//>" as slash commands
      const nextChar = text[i + 1]
      if (nextChar === undefined || /[a-zA-Z\s]/.test(nextChar)) {
        prefixIdx = i - prefixLen + 1 // Point to the start of the prefix
        break
      }
    }
  }

  // Also check if line starts with the prefix
  if (prefixIdx === -1 && text.startsWith(COMMAND_PREFIX)) {
    const nextChar = text[prefixLen]
    if (nextChar === undefined || /[a-zA-Z\s]/.test(nextChar)) {
      prefixIdx = 0
    }
  }

  if (prefixIdx === -1) return null

  // Extract the text from the prefix to the end of the line (cursor position)
  const prefixText = text.slice(prefixIdx)
  const rest = prefixText.slice(prefixLen) // Remove the leading prefix
  const parts = rest.split(/\s+/).filter(Boolean)

  // If just the prefix with nothing after, return empty cmd to trigger command list
  if (!parts.length) return { cmd: "", query: "", slashOffset: prefixIdx }

  const cmd = String(parts[0] || "").toLowerCase()
  const q = parts.slice(1).join(" ").trim()
  return { cmd, query: q, slashOffset: prefixIdx }
}

/**
 * Replace a range in a string
 */
export function replaceRange(str: string, start: number, end: number, replacement: string): string {
  return str.slice(0, start) + replacement + str.slice(end)
}

/**
 * Get caret coordinates relative to textarea
 */
export function getCaretCoordinates(textarea: HTMLTextAreaElement, pos: number): CaretCoordinates {
  const cs = window.getComputedStyle(textarea)

  const div = document.createElement("div")
  div.style.position = "absolute"
  div.style.visibility = "hidden"
  const copiedProperties: (keyof CSSStyleDeclaration)[] = [
    "whiteSpace",
    "wordWrap",
    "overflowWrap",
    "wordBreak",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "textTransform",
    "textAlign",
    "lineHeight",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderTopStyle",
    "borderRightStyle",
    "borderBottomStyle",
    "borderLeftStyle",
    "boxSizing",
  ]
  for (const property of copiedProperties) {
    const value = cs[property]
    if (typeof value === "string") {
      div.style[property] = value
    }
  }
  div.style.overflow = "auto"
  div.style.width = String(textarea.clientWidth) + "px"
  div.style.height = String(textarea.clientHeight) + "px"

  const before = (textarea.value || "").slice(0, pos)
  const after = (textarea.value || "").slice(pos)

  div.textContent = before

  const span = document.createElement("span")
  span.textContent = after.length ? after : " "
  div.appendChild(span)

  document.body.appendChild(div)

  div.scrollTop = textarea.scrollTop
  div.scrollLeft = textarea.scrollLeft

  const divRect = div.getBoundingClientRect()
  const spanRect = span.getBoundingClientRect()

  const left = add(sub(spanRect.left, divRect.left), div.scrollLeft)
  const top = add(sub(spanRect.top, divRect.top), div.scrollTop)
  const height = spanRect.height || Number.parseFloat(cs.lineHeight || "16") || 16

  document.body.removeChild(div)
  return { left, top, height }
}
