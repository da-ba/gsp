/**
 * Picker inline styles
 */

import { isDarkMode, fontSystemUi, fontSansSerif, tokenLinearGradient } from "../../utils/theme.ts";

function getConfig(): { dark: boolean } {
  return { dark: isDarkMode() };
}

export function applyPickerStyles(el: HTMLElement): void {
  const { dark } = getConfig();
  const lg = tokenLinearGradient();

  // Use fixed positioning so the picker is stable across scroll containers
  // (GitHub popovers/dialogs) and doesn't depend on page scroll offsets.
  el.style.position = "fixed";
  el.style.zIndex = "999999";
  el.style.width = "400px";
  el.style.maxHeight = "380px";
  el.style.overflow = "hidden";
  el.style.borderRadius = "14px";
  el.style.fontSize = "13px";
  el.style.fontFamily = fontSystemUi() + ", " + fontSansSerif();
  el.style.backdropFilter = "blur(12px)";

  if (dark) {
    el.style.color = "rgba(255,255,255,0.92)";
    el.style.border = "1px solid rgba(255,255,255,0.14)";
    el.style.backgroundColor = "rgba(18,18,20,0.82)";
    el.style.backgroundImage = lg + "(180deg, rgba(35,35,40,0.92), rgba(14,14,16,0.82))";
    el.style.boxShadow = "0 18px 46px rgba(0,0,0,0.55)";
  } else {
    el.style.color = "rgba(0,0,0,0.88)";
    el.style.border = "1px solid rgba(0,0,0,0.14)";
    el.style.backgroundColor = "rgba(255,255,255,0.86)";
    el.style.backgroundImage = lg + "(180deg, rgba(255,255,255,0.96), rgba(245,247,255,0.86))";
    el.style.boxShadow = "0 18px 46px rgba(0,0,0,0.22)";
  }
}

export function getCardStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig();
  return {
    padding: "10px",
    borderRadius: "12px",
    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.10)",
    backgroundColor: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
  };
}

export function getBadgeStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig();
  return {
    fontSize: "12px",
    opacity: "0.72",
    borderRadius: "999px",
    padding: "4px 10px",
    border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.14)",
    backgroundColor: dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
    color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
  };
}

export function getInputStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig();
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: "10px",
    border: dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.18)",
    backgroundColor: dark ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.85)",
    color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
  };
}

export function getSkeletonStyles(): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig();
  return {
    width: "100%",
    height: "88px",
    borderRadius: "12px",
    backgroundColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    border: dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
  };
}

export function getGridItemSelectedStyles(selected: boolean): Partial<CSSStyleDeclaration> {
  const { dark } = getConfig();
  return {
    outline: "0",
    transform: selected ? "scale(1.03)" : "scale(1)",
    boxShadow: selected
      ? dark
        ? "0 10px 22px rgba(0,0,0,0.55)"
        : "0 10px 22px rgba(0,0,0,0.22)"
      : "0 0 0 rgba(0,0,0,0)",
    border: selected
      ? dark
        ? "1px solid rgba(255,255,255,0.20)"
        : "1px solid rgba(0,0,0,0.18)"
      : "1px solid rgba(0,0,0,0)",
  };
}
