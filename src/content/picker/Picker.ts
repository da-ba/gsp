/**
 * Picker UI component
 */

import { isDarkMode } from "../../utils/theme.ts";
import { add, sub, clamp } from "../../utils/math.ts";
import { getCaretCoordinates } from "../../utils/dom.ts";
import { setGiphyKey } from "../../utils/storage.ts";
import { searchGifs } from "../../api/giphy.ts";
import type { GifItem } from "../../api/giphy.ts";
import { state, resetPickerState } from "./state.ts";
import {
  applyPickerStyles,
  getBadgeStyles,
  getCardStyles,
  getButtonStyles,
  getInputStyles,
  getSkeletonStyles,
  getGridItemSelectedStyles,
} from "./styles.ts";

// Helper to apply style object
function applyStyles(el: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && typeof value === "string") {
      el.style.setProperty(
        key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()),
        value
      );
    }
  }
}

function createHeader(): HTMLElement {
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";
  header.style.padding = "10px 10px 8px 10px";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.flexDirection = "column";
  left.style.gap = "2px";

  const title = document.createElement("div");
  title.textContent = "GitHub Slash Palette";
  title.style.fontWeight = "700";
  title.style.letterSpacing = "0.4px";
  title.style.fontSize = "12px";
  title.style.opacity = "0.92";

  const sub = document.createElement("div");
  sub.textContent = "Type a slash command";
  sub.style.fontSize = "12px";
  sub.style.opacity = "0.72";

  left.appendChild(title);
  left.appendChild(sub);

  const badge = document.createElement("div");
  badge.textContent = "Esc close";
  applyStyles(badge, getBadgeStyles());

  header.appendChild(left);
  header.appendChild(badge);

  state.headerTitleEl = title;
  state.headerSubEl = sub;

  return header;
}

function createHints(): HTMLElement {
  const hint = document.createElement("div");
  hint.style.display = "flex";
  hint.style.flexWrap = "wrap";
  hint.style.gap = "6px";
  hint.style.padding = "0 10px 10px 10px";

  const hintItems = ["Arrows move", "Enter insert", "Tab insert", "Esc close"];

  hintItems.forEach((t) => {
    const h = document.createElement("div");
    h.textContent = t;
    applyStyles(h, getBadgeStyles());
    h.style.padding = "3px 10px";
    hint.appendChild(h);
  });

  state.hintEl = hint;
  return hint;
}

function createBody(): HTMLElement {
  const body = document.createElement("div");
  body.style.overflow = "auto";
  body.style.padding = "0 10px 10px 10px";
  body.style.maxHeight = "280px";
  state.bodyEl = body;
  return body;
}

function createFooter(): HTMLElement {
  const footer = document.createElement("div");
  footer.style.padding = "10px";
  footer.style.borderTop = isDarkMode()
    ? "1px solid rgba(255,255,255,0.10)"
    : "1px solid rgba(0,0,0,0.10)";
  footer.style.opacity = "0.62";
  footer.style.fontSize = "12px";
  footer.textContent = "Tip: /giphy cats";
  state.footerEl = footer;
  return footer;
}

function createPickerElement(): HTMLElement {
  const el = document.createElement("div");
  el.id = "slashPalettePicker";
  el.style.display = "none";
  applyPickerStyles(el);

  // Keep textarea focus when selecting GIFs with the mouse.
  // Important: do NOT stopPropagation in capture phase, otherwise events won't
  // reach inner buttons/inputs and the picker becomes unusable.
  const shouldPreventFocusSteal = (target: EventTarget | null): boolean => {
    const t = target as HTMLElement | null;
    if (!t) return false;
    const btn = t.closest("button") as HTMLButtonElement | null;
    return !!(btn && btn.hasAttribute("data_item_index"));
  };

  el.addEventListener(
    "pointerdown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault();
    },
    true
  );
  el.addEventListener(
    "mousedown",
    (ev) => {
      if (shouldPreventFocusSteal(ev.target)) ev.preventDefault();
    },
    true
  );

  // Stop bubbling events so GitHub's bubble handlers don't treat picker clicks
  // as interacting with the page.
  const stopBubble = (ev: Event) => {
    ev.stopPropagation();
  };
  el.addEventListener("click", stopBubble);
  el.addEventListener("mousedown", stopBubble);
  el.addEventListener("mouseup", stopBubble);

  el.addEventListener("mousedown", () => {
    state.mouseDownInPicker = true;
  });
  el.addEventListener("mouseup", () => {
    state.mouseDownInPicker = false;
  });

  el.appendChild(createHeader());
  el.appendChild(createHints());
  el.appendChild(createBody());
  el.appendChild(createFooter());

  return el;
}

function getPickerMountForField(field?: HTMLElement | null): HTMLElement {
  if (!field) return document.body;
  const mount = field.closest(
    [
      "details-dialog",
      "dialog",
      "[role='dialog']",
      ".Overlay",
      ".Popover",
      ".SelectMenu",
      ".SelectMenu-modal",
      ".details-overlay",
      "details",
    ].join(", ")
  ) as HTMLElement | null;
  return mount || document.body;
}

export function ensurePicker(field?: HTMLElement | null): HTMLElement {
  const mount = getPickerMountForField(field);

  if (state.pickerEl) {
    if (state.pickerEl.parentElement !== mount) mount.appendChild(state.pickerEl);
    return state.pickerEl;
  }

  const el = createPickerElement();
  mount.appendChild(el);
  state.pickerEl = el;

  return el;
}

export function isPickerVisible(): boolean {
  return !!(state.pickerEl && state.pickerEl.style.display === "block");
}

export function showPicker(field?: HTMLElement | null): void {
  const picker = ensurePicker(field);
  applyPickerStyles(picker);
  picker.style.display = "block";
  try {
    picker.animate(
      [
        { opacity: 0, transform: "scale(0.98)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      { duration: 120, fill: "both" }
    );
  } catch {
    // Animation not supported
  }
}

export function hidePicker(): void {
  if (!state.pickerEl) return;
  state.pickerEl.style.display = "none";
  if (state.bodyEl) state.bodyEl.textContent = "";
  resetPickerState();
}

export function clearBody(): void {
  ensurePicker();
  if (state.bodyEl) state.bodyEl.textContent = "";
}

export function setHeader(title: string, subtitle: string): void {
  ensurePicker();
  if (state.headerTitleEl) state.headerTitleEl.textContent = title || "GitHub Slash Palette";
  if (state.headerSubEl) state.headerSubEl.textContent = subtitle || "Type a slash command";
}

export function renderMessage(msg: string): void {
  clearBody();
  const body = state.bodyEl;
  if (!body) return;

  const p = document.createElement("div");
  p.textContent = msg;
  applyStyles(p, getCardStyles());
  body.appendChild(p);
}

export function renderLoadingSkeleton(): void {
  clearBody();
  const body = state.bodyEl;
  if (!body) return;

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";
  grid.style.gap = "8px";

  for (let i = 0; i < 12; i = add(i, 1)) {
    const box = document.createElement("div");
    applyStyles(box, getSkeletonStyles());
    try {
      box.animate([{ opacity: 0.55 }, { opacity: 0.9 }, { opacity: 0.55 }], {
        duration: 900,
        iterations: Infinity,
      });
    } catch {
      // Animation not supported
    }
    grid.appendChild(box);
  }

  body.appendChild(grid);
}

export function positionPickerAtCaret(field: HTMLTextAreaElement): void {
  const picker = ensurePicker(field);
  const rect = field.getBoundingClientRect();
  const caret = getCaretCoordinates(field, field.selectionStart || 0);

  // Fixed positioning => viewport coordinates
  let left = add(rect.left, caret.left);
  let top = add(rect.top, add(caret.top, add(caret.height, 10)));

  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const pickerWidth = 400;
  const pickerHeight = 380;

  const maxLeft = sub(sub(vw, pickerWidth), 10);
  if (left > maxLeft) left = maxLeft;
  const minLeft = 10;
  if (left < minLeft) left = minLeft;

  const maxTop = sub(sub(vh, pickerHeight), 10);
  if (top > maxTop) {
    top = sub(add(rect.top, caret.top), add(pickerHeight, 10));
  }
  const minTop = 10;
  if (top < minTop) top = minTop;

  picker.style.left = String(left) + "px";
  picker.style.top = String(top) + "px";
}

export function refreshSelectionStyles(): void {
  const picker = state.pickerEl;
  if (!picker) return;

  const buttons = picker.querySelectorAll("button[data_item_index]");
  buttons.forEach((btn) => {
    const idx = Number((btn as HTMLElement).getAttribute("data_item_index") || "0");
    const selected = idx === state.selectedIndex;
    applyStyles(btn as HTMLElement, getGridItemSelectedStyles(selected));
  });
}

export function scrollSelectedIntoView(): void {
  const picker = state.pickerEl;
  if (!picker) return;
  const btn = picker.querySelector("button[data_item_index='" + String(state.selectedIndex) + "']");
  if (!btn) return;
  btn.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export function renderSuggestChips(
  items: string[],
  title: string,
  onPick: (term: string) => void
): void {
  const body = state.bodyEl;
  if (!body) return;
  if (!items || !items.length) return;

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexWrap = "wrap";
  wrap.style.gap = "6px";
  wrap.style.marginBottom = "10px";

  if (title) {
    const label = document.createElement("div");
    label.textContent = title;
    label.style.width = "100%";
    label.style.opacity = "0.72";
    label.style.fontSize = "12px";
    label.style.marginBottom = "4px";
    wrap.appendChild(label);
  }

  items.slice(0, 8).forEach((term) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = term;
    applyStyles(btn, getBadgeStyles());
    btn.style.cursor = "pointer";
    btn.style.padding = "6px 10px";

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.03)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)";
    });
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      onPick(term);
    });

    wrap.appendChild(btn);
  });

  body.appendChild(wrap);
}

export function renderGrid(
  items: GifItem[],
  imgUrlFn: (item: GifItem) => string,
  onPickItem: (item: GifItem) => void,
  suggestTitle: string
): void {
  clearBody();
  const body = state.bodyEl;
  if (!body) return;

  // Render suggestion chips if available
  if (state.suggestItems && state.suggestItems.length) {
    renderSuggestChips(state.suggestItems, suggestTitle, (term) => {
      // This will be handled by the command
      const field = state.activeField;
      if (field) {
        setSlashQueryInField(state.activeCommand, term);
      }
    });
  }

  state.currentItems = items;
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)));

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(3, 1fr)";
  grid.style.gap = "8px";

  const dark = isDarkMode();

  items.forEach((it, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data_item_index", String(idx));
    btn.style.padding = "0";
    btn.style.margin = "0";
    btn.style.backgroundColor = "transparent";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "12px";
    btn.style.overflow = "hidden";
    btn.style.border = "1px solid rgba(0,0,0,0)";
    btn.style.transition = "transform 90ms ease, boxShadow 90ms ease";
    btn.style.boxShadow = dark ? "0 6px 14px rgba(0,0,0,0.40)" : "0 6px 14px rgba(0,0,0,0.12)";

    const img = document.createElement("img");
    img.src = imgUrlFn(it);
    img.alt = "item";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.display = "block";

    btn.appendChild(img);

    btn.addEventListener("mouseenter", () => {
      state.selectedIndex = idx;
      refreshSelectionStyles();
    });

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      // Save field reference before hiding picker
      const field = state.activeField;
      onPickItem(it);
      hidePicker();
      // Re-focus textarea to keep GitHub's popover open
      if (field) {
        setTimeout(() => field.focus(), 0);
      }
    });

    grid.appendChild(btn);
  });

  body.appendChild(grid);
  refreshSelectionStyles();
}

export function setSlashQueryInField(cmd: string, term: string): void {
  const field = state.activeField;
  if (!field) return;
  if (field.tagName !== "TEXTAREA") return;

  const value = field.value || "";
  const pos = field.selectionStart || 0;
  const lineStart = state.activeLineStart;

  const replacement = "/" + cmd + " " + term;
  const newValue = value.slice(0, lineStart) + replacement + value.slice(pos);

  field.value = newValue;

  const newPos = add(lineStart, replacement.length);
  field.focus();
  field.setSelectionRange(newPos, newPos);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

export function renderKeySetupPanel(message: string, afterSave: () => void): void {
  clearBody();
  const body = state.bodyEl;
  if (!body) return;

  const card = document.createElement("div");
  applyStyles(card, getCardStyles());
  card.style.padding = "12px";

  const title = document.createElement("div");
  title.textContent = "Giphy API key required";
  title.style.fontWeight = "700";
  title.style.marginBottom = "6px";

  const msg = document.createElement("div");
  msg.textContent = message || "Paste your Giphy API key to enable /giphy";
  msg.style.opacity = "0.82";
  msg.style.fontSize = "12px";
  msg.style.marginBottom = "10px";

  const input = document.createElement("input");
  input.type = "password";
  input.placeholder = "Giphy API key";
  applyStyles(input, getInputStyles());

  const showRow = document.createElement("label");
  showRow.style.display = "flex";
  showRow.style.alignItems = "center";
  showRow.style.gap = "8px";
  showRow.style.marginTop = "10px";
  showRow.style.fontSize = "12px";
  showRow.style.opacity = "0.82";

  const showCb = document.createElement("input");
  showCb.type = "checkbox";
  const showText = document.createElement("span");
  showText.textContent = "Show key";
  showRow.appendChild(showCb);
  showRow.appendChild(showText);

  showCb.addEventListener("change", () => {
    input.type = showCb.checked ? "text" : "password";
  });

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "8px";
  row.style.marginTop = "10px";
  row.style.flexWrap = "wrap";

  const btnSave = document.createElement("button");
  btnSave.type = "button";
  btnSave.textContent = "Save";
  btnSave.setAttribute("data_slash_palette_action", "save");
  applyStyles(btnSave, getButtonStyles());
  btnSave.style.flex = "1";
  btnSave.style.minWidth = "110px";

  const btnTest = document.createElement("button");
  btnTest.type = "button";
  btnTest.textContent = "Test";
  btnTest.setAttribute("data_slash_palette_action", "test");
  applyStyles(btnTest, getButtonStyles());
  btnTest.style.flex = "1";
  btnTest.style.minWidth = "110px";
  btnTest.style.backgroundColor = "transparent";

  const status = document.createElement("div");
  status.style.marginTop = "10px";
  status.style.fontSize = "12px";
  status.style.opacity = "0.82";

  async function doSave(): Promise<void> {
    const v = String(input.value || "").trim();
    if (!v) {
      status.textContent = "Missing key";
      return;
    }
    await setGiphyKey(v);
    status.textContent = "Saved";
    afterSave();
  }

  async function doTest(): Promise<void> {
    const v = String(input.value || "").trim();
    if (!v) {
      status.textContent = "Missing key";
      return;
    }
    status.textContent = "Testing";
    const r = await searchGifs(v, "ok");
    if (r?.error) status.textContent = r.error;
    else status.textContent = "Key ok";
  }

  btnSave.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    doSave();
    const field = state.activeField;
    if (field) setTimeout(() => field.focus(), 0);
  });
  btnTest.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    doTest();
    const field = state.activeField;
    if (field) setTimeout(() => field.focus(), 0);
  });

  card.appendChild(title);
  card.appendChild(msg);
  card.appendChild(input);
  card.appendChild(showRow);
  row.appendChild(btnSave);
  row.appendChild(btnTest);
  card.appendChild(row);
  card.appendChild(status);

  body.appendChild(card);
}

export function moveSelectionGrid(dx: number, dy: number): void {
  const cols = state.cols;
  const maxIdx = Math.max(0, sub(state.currentItems.length, 1));
  const row = Math.floor(state.selectedIndex / cols);
  const col = state.selectedIndex % cols;
  const newRow = add(row, dy);
  const newCol = add(col, dx);
  let next = add(newRow * cols, newCol);
  next = clamp(next, 0, maxIdx);
  state.selectedIndex = next;
  refreshSelectionStyles();
  scrollSelectedIntoView();
}
