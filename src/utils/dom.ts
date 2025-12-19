/**
 * DOM utilities and helpers
 */

import { add, sub } from "./math.ts";

export interface CursorInfo {
  value: string;
  pos: number;
  lineStart: number;
  line: string;
}

export interface CaretCoordinates {
  left: number;
  top: number;
  height: number;
}

/**
 * Check if element is a GitHub markdown textarea
 */
export function isGitHubMarkdownField(el: Element | null): el is HTMLTextAreaElement {
  if (!el) return false;
  return el.tagName === "TEXTAREA";
}

/**
 * Get cursor position info from a textarea
 */
export function getCursorInfo(textarea: HTMLTextAreaElement): CursorInfo {
  const value = textarea.value || "";
  const pos = textarea.selectionStart || 0;
  let lineStart = value.lastIndexOf("\n", pos);
  if (lineStart < 0) lineStart = 0;
  else lineStart = add(lineStart, 1);
  const line = value.slice(lineStart, pos);
  return { value, pos, lineStart, line };
}

/**
 * Parse slash command from line text
 */
export function parseSlashCommand(line: string): { cmd: string; query: string } | null {
  const trimmed = (line || "").trim();
  if (!trimmed.startsWith("/")) return null;
  const rest = trimmed.slice(1);
  const parts = rest.split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const cmd = String(parts[0] || "").toLowerCase();
  const q = parts.slice(1).join(" ").trim();
  return { cmd, query: q };
}

/**
 * Replace a range in a string
 */
export function replaceRange(str: string, start: number, end: number, replacement: string): string {
  return str.slice(0, start) + replacement + str.slice(end);
}

/**
 * Get caret coordinates relative to textarea
 */
export function getCaretCoordinates(textarea: HTMLTextAreaElement, pos: number): CaretCoordinates {
  const cs = window.getComputedStyle(textarea);

  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = cs.whiteSpace;
  div.style.wordWrap = cs.wordWrap;
  div.style.overflowWrap = cs.overflowWrap;
  div.style.wordBreak = cs.wordBreak;
  div.style.overflow = "auto";

  div.style.fontFamily = cs.fontFamily;
  div.style.fontSize = cs.fontSize;
  div.style.fontWeight = cs.fontWeight;
  div.style.fontStyle = cs.fontStyle;
  div.style.letterSpacing = cs.letterSpacing;
  div.style.textTransform = cs.textTransform;
  div.style.textAlign = cs.textAlign;
  div.style.lineHeight = cs.lineHeight;

  div.style.paddingTop = cs.paddingTop;
  div.style.paddingRight = cs.paddingRight;
  div.style.paddingBottom = cs.paddingBottom;
  div.style.paddingLeft = cs.paddingLeft;

  div.style.borderTopWidth = cs.borderTopWidth;
  div.style.borderRightWidth = cs.borderRightWidth;
  div.style.borderBottomWidth = cs.borderBottomWidth;
  div.style.borderLeftWidth = cs.borderLeftWidth;
  div.style.borderTopStyle = cs.borderTopStyle;
  div.style.borderRightStyle = cs.borderRightStyle;
  div.style.borderBottomStyle = cs.borderBottomStyle;
  div.style.borderLeftStyle = cs.borderLeftStyle;

  div.style.boxSizing = cs.boxSizing;
  div.style.width = String(textarea.clientWidth) + "px";
  div.style.height = String(textarea.clientHeight) + "px";

  const before = (textarea.value || "").slice(0, pos);
  const after = (textarea.value || "").slice(pos);

  div.textContent = before;

  const span = document.createElement("span");
  span.textContent = after.length ? after : " ";
  div.appendChild(span);

  document.body.appendChild(div);

  div.scrollTop = textarea.scrollTop;
  div.scrollLeft = textarea.scrollLeft;

  const divRect = div.getBoundingClientRect();
  const spanRect = span.getBoundingClientRect();

  const left = add(sub(spanRect.left, divRect.left), div.scrollLeft);
  const top = add(sub(spanRect.top, divRect.top), div.scrollTop);
  const height = spanRect.height || Number.parseFloat(cs.lineHeight || "16") || 16;

  document.body.removeChild(div);
  return { left, top, height };
}
