/**
 * Picker CSS injection
 *
 * Injects the picker stylesheet into the page as a <style> element.
 * This avoids needing a separate CSS file in manifest.json while
 * keeping styles out of JS object allocations.
 */

const PICKER_CSS = `
/* === Theme tokens via CSS custom properties === */

#slashPalettePickerContainer {
  /* Light theme (default) */
  --sp-text: #1f2328;
  --sp-text-muted: #656d76;
  --sp-border: #d0d7de;
  --sp-bg: #ffffff;
  --sp-shadow: 0 8px 24px rgba(140,149,159,0.2);
  --sp-card-bg: rgba(246,248,250,0.8);
  --sp-card-border: rgba(31,35,40,0.15);
  --sp-badge-text: #656d76;
  --sp-button-bg: #f6f8fa;
  --sp-input-bg: #ffffff;
  --sp-skeleton-bg: rgba(31,35,40,0.04);
  --sp-skeleton-border: rgba(31,35,40,0.08);
  --sp-selected-border: #0969da;
  --sp-selected-shadow: 0 4px 12px rgba(0,0,0,0.15);
  --sp-grid-item-shadow: 0 4px 12px rgba(0,0,0,0.08);
  --sp-header-border: 1px solid #d0d7de;
}

#slashPalettePickerContainer.sp-dark {
  /* Dark theme overrides */
  --sp-text: #e6edf3;
  --sp-text-muted: #8d96a0;
  --sp-border: #3d444d;
  --sp-bg: #161b22;
  --sp-shadow: 0 8px 24px rgba(1,4,9,0.75);
  --sp-card-bg: rgba(33,38,45,0.6);
  --sp-card-border: #3d444d;
  --sp-badge-text: #8d96a0;
  --sp-button-bg: #21262d;
  --sp-input-bg: #0d1117;
  --sp-skeleton-bg: rgba(110,118,129,0.1);
  --sp-skeleton-border: #3d444d;
  --sp-selected-border: #58a6ff;
  --sp-selected-shadow: 0 4px 12px rgba(0,0,0,0.4);
  --sp-grid-item-shadow: 0 4px 12px rgba(0,0,0,0.3);
  --sp-header-border: 1px solid #3d444d;
}

/* === Picker container === */

#slashPalettePicker {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 320px;
  width: 320px;
  max-width: 320px;
  box-sizing: border-box;
  position: fixed;
  z-index: 999999;
  overflow: hidden;
  border-radius: 6px;
  font-size: 14px;
  backdrop-filter: none;
  color: var(--sp-text);
  border: 1px solid var(--sp-border);
  background-color: var(--sp-bg);
  background-image: none;
  box-shadow: var(--sp-shadow);
}

/* === Header === */

.sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: var(--sp-header-border);
}

.sp-header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sp-header-prefix {
  color: var(--sp-text-muted);
  font-size: 16px;
  font-weight: 500;
}

.sp-header-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--sp-text);
}

.sp-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-header-subtitle {
  font-size: 12px;
  color: var(--sp-text-muted);
}

.sp-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sp-text-muted);
}

.sp-icon-btn:hover {
  opacity: 1;
}

/* === Body containers === */

.sp-body-scroll {
  overflow: auto;
  padding: 8px;
  flex: 1 1 auto;
  min-height: 0;
}

.sp-body-pad {
  overflow: auto;
  padding: 12px;
  flex: 1 1 auto;
  min-height: 0;
}

.sp-body-list {
  overflow: auto;
  padding: 0;
  flex: 1 1 auto;
  min-height: 0;
}

/* === Grid === */

.sp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 100%;
  overflow-y: auto;
}

/* === Grid item === */

.sp-grid-item {
  padding: 0;
  margin: 0;
  background-color: transparent;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: transform 80ms ease, box-shadow 80ms ease;
  box-shadow: var(--sp-grid-item-shadow);
  outline: 0;
}

.sp-grid-item img {
  width: 100%;
  height: auto;
  display: block;
}

.sp-grid-item[aria-selected="true"] {
  transform: scale(1.02);
  box-shadow: var(--sp-selected-shadow);
  border: 2px solid var(--sp-selected-border);
}

/* === List item === */

.sp-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  margin: 0;
  background-color: transparent;
  cursor: pointer;
  border-radius: 0;
  overflow: hidden;
  border: none;
  transition: background-color 80ms ease;
  text-align: left;
}

.sp-list-item[aria-selected="true"] {
  background-color: #2f81f7;
}

.sp-list-item-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.sp-list-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.sp-list-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--sp-text);
}

.sp-list-item[aria-selected="true"] .sp-list-item-title {
  color: #ffffff;
}

.sp-list-item-subtitle {
  font-size: 14px;
  color: var(--sp-text-muted);
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.sp-list-item[aria-selected="true"] .sp-list-item-subtitle {
  color: rgba(255,255,255,0.9);
}

/* === Section title === */

.sp-section-title {
  width: 100%;
  font-size: 12px;
  margin-bottom: 4px;
  color: var(--sp-text-muted);
}

.sp-list-section-title {
  width: 100%;
  font-size: 12px;
  padding: 8px 12px 4px 12px;
  color: var(--sp-text-muted);
}

/* === Suggest chips === */

.sp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.sp-chip {
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  padding: 6px 10px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
  color: var(--sp-badge-text);
  cursor: pointer;
  transition: transform 80ms ease;
}

.sp-chip:hover {
  transform: scale(1.03);
}

/* === Message / Card === */

.sp-card {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
}

.sp-message {
  color: var(--sp-text-muted);
}

/* === Skeleton loading === */

.sp-skeleton {
  width: 100%;
  height: 88px;
  border-radius: 6px;
  background-color: var(--sp-skeleton-bg);
  border: 1px solid var(--sp-skeleton-border);
}

@keyframes sp-pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.9; }
}

.sp-skeleton {
  animation: sp-pulse 900ms infinite;
}

/* === Settings panel === */

.sp-back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  opacity: 0.75;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--sp-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.sp-back-btn:hover {
  opacity: 1;
}

.sp-settings-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
}

.sp-settings-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--sp-text);
}

.sp-theme-row {
  display: flex;
  gap: 6px;
}

.sp-badge {
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  padding: 4px 8px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
  color: var(--sp-badge-text);
}

.sp-badge-btn {
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  padding: 6px 12px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
  color: var(--sp-badge-text);
  cursor: pointer;
}

/* === Token form (shared) === */

.sp-token-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-token-label {
  font-weight: 600;
}

.sp-token-desc {
  font-size: 12px;
  opacity: 0.72;
}

.sp-token-desc a {
  color: inherit;
  text-decoration: underline;
}

.sp-token-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-input-bg);
  color: var(--sp-text);
}

.sp-token-btn-row {
  display: flex;
  gap: 8px;
}

.sp-token-btn {
  cursor: pointer;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--sp-card-border);
  background-color: var(--sp-card-bg);
  color: var(--sp-badge-text);
}

.sp-token-msg {
  font-size: 12px;
  opacity: 0.72;
}

/* === List container === */

.sp-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
`

let injected = false

/**
 * Inject the picker CSS into the page.
 * Safe to call multiple times - only injects once.
 */
export function injectPickerCSS(): void {
  if (injected) return
  injected = true
  const style = document.createElement("style")
  style.id = "slashPaletteStyles"
  style.textContent = PICKER_CSS
  document.head.appendChild(style)
}
