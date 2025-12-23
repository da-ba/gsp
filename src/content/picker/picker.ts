/**
 * Picker UI component
 */

import { isDarkMode, setThemeOverride } from "../../utils/theme.ts";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../../utils/storage.ts";
import { add, sub, clamp } from "../../utils/math.ts";
import { getCaretCoordinates } from "../../utils/dom.ts";
import type { PickerItem } from "../types.ts";
import { state, resetPickerState } from "./state.ts";
import { listCommands, getCommand } from "../commands/registry.ts";
import {
  applyPickerStyles,
  getBadgeStyles,
  getCardStyles,
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
  header.style.height = "44px"; // Fixed height for header
  header.style.boxSizing = "border-box";

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

  // Settings button
  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.setAttribute("data_settings_btn", "true");
  settingsBtn.title = "Settings";
  settingsBtn.style.background = "none";
  settingsBtn.style.border = "none";
  settingsBtn.style.cursor = "pointer";
  settingsBtn.style.padding = "4px";
  settingsBtn.style.opacity = "0.62";
  settingsBtn.style.display = "flex";
  settingsBtn.style.alignItems = "center";
  settingsBtn.style.justifyContent = "center";
  settingsBtn.style.color = isDarkMode() ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)";
  settingsBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
  </svg>`;
  settingsBtn.addEventListener("mouseenter", () => {
    settingsBtn.style.opacity = "1";
  });
  settingsBtn.addEventListener("mouseleave", () => {
    settingsBtn.style.opacity = "0.62";
  });
  settingsBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    // Show settings panel in the picker body
    state.showingSettings = true;
    updateFooter();
    clearBody();
    const body = state.bodyEl;
    if (!body) return;

    const wrap = document.createElement("div");
    applyStyles(wrap, getCardStyles());
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "14px";

    // Theme section
    const themeSection = document.createElement("div");
    themeSection.style.display = "flex";
    themeSection.style.flexDirection = "column";
    themeSection.style.gap = "8px";

    const themeLabel = document.createElement("div");
    themeLabel.textContent = "Theme";
    themeLabel.style.fontWeight = "600";
    themeSection.appendChild(themeLabel);

    const themeButtons = document.createElement("div");
    themeButtons.style.display = "flex";
    themeButtons.style.gap = "6px";

    // Get current theme preference
    const currentTheme = await getThemePreference();
    const themes: { value: ThemePreference; label: string }[] = [
      { value: "system", label: "System" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ];

    themes.forEach(({ value, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data_settings_action", "true");
      btn.textContent = label;
      applyStyles(btn, getBadgeStyles());
      btn.style.cursor = "pointer";
      btn.style.padding = "6px 12px";
      if (value === currentTheme) {
        btn.style.opacity = "1";
        btn.style.fontWeight = "600";
      }
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await setThemePreference(value);
        setThemeOverride(value);
        // Refresh picker styles
        if (state.pickerEl) applyPickerStyles(state.pickerEl);
        // Re-render settings panel to update selected state
        settingsBtn.click();
      });
      themeButtons.appendChild(btn);
    });

    themeSection.appendChild(themeButtons);
    wrap.appendChild(themeSection);

    // Render settings from each command that provides them
    const commands = listCommands();
    for (const cmdName of commands) {
      const cmd = getCommand(cmdName);
      if (cmd?.renderSettings) {
        cmd.renderSettings(wrap);
      }
    }

    body.appendChild(wrap);
  });

  // Right side: Esc badge and settings
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  const badge = document.createElement("div");
  badge.textContent = "Esc close";
  applyStyles(badge, getBadgeStyles());
  right.appendChild(badge);
  right.appendChild(settingsBtn);

  header.appendChild(left);
  header.appendChild(right);

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
  hint.style.height = "32px"; // Fixed height for hints
  hint.style.boxSizing = "border-box";

  const hintItems = ["Arrows move", "Enter insert", "Esc close"];

  hintItems.forEach((t) => {
    const h = document.createElement("div");
    h.textContent = t;
    // Use badge styles for correct color and background in both modes
    applyStyles(h, getBadgeStyles());
    h.style.padding = "3px 10px";
    h.style.fontWeight = "600";
    hint.appendChild(h);
  });

  state.hintEl = hint;
  return hint;
}

function createBody(): HTMLElement {
  const body = document.createElement("div");
  body.style.overflow = "auto";
  body.style.padding = "0 10px 10px 10px";
  body.style.flex = "1 1 auto";
  body.style.minHeight = "0"; // Required for flex children to be scrollable
  state.bodyEl = body;
  return body;
}

function createFooter(): HTMLElement {
  const footer = document.createElement("div");
  footer.style.padding = "10px";
  footer.style.fontSize = "12px";
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.height = "44px"; // Fixed height for footer
  footer.style.boxSizing = "border-box";

  state.footerEl = footer;
  updateFooter();
  return footer;
}

/** Update footer content based on current state */
function updateFooter(): void {
  const footer = state.footerEl;
  if (!footer) return;

  footer.textContent = "";
  const dark = isDarkMode();
  footer.style.borderTop = dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)";

  // Only show tip in footer now
  const tip = document.createElement("span");
  tip.textContent = "Tip: type /gsp to list commands";
  tip.style.opacity = "0.62";
  tip.style.color = dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)";
  footer.appendChild(tip);
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
    // Prevent focus steal for grid items, suggestion chips, and settings
    return !!(
      btn &&
      (btn.hasAttribute("data_item_index") ||
        btn.hasAttribute("data_suggest_chip") ||
        btn.hasAttribute("data_settings_btn") ||
        btn.hasAttribute("data_settings_action"))
    );
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

  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.height = "380px";
  el.style.maxHeight = "380px";
  el.style.width = "400px";
  el.style.maxWidth = "400px";
  el.style.boxSizing = "border-box";

  // Compose layout: header (44px), hints (32px), body (flex), footer (44px)
  el.appendChild(createHeader());
  el.appendChild(createHints());
  const body = createBody();
  el.appendChild(body);
  const footer = createFooter();
  el.appendChild(footer);

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
  const wasHidden = picker.style.display === "none";
  applyPickerStyles(picker);
  picker.style.display = "block";
  // Only animate on initial show, not on every update
  if (wasHidden) {
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

// Settings panel logic is now only referenced by the footer button and always visible from there.

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
    btn.setAttribute("data_suggest_chip", "true");
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
  items: PickerItem[],
  imgUrlFn: (item: PickerItem) => string,
  onPickItem: (item: PickerItem) => void,
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
  // Ensure grid does not overflow the body, so footer is always visible
  grid.style.maxHeight = "100%";
  grid.style.overflowY = "auto";

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

/**
 * Render a command-provided setup panel.
 * The command's renderSetup callback receives the body element and builds its own UI.
 */
export function renderSetupPanel(
  renderFn: (bodyEl: HTMLElement, onComplete: () => void) => void,
  onComplete: () => void
): void {
  clearBody();
  const body = state.bodyEl;
  if (!body) return;
  renderFn(body, onComplete);
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
