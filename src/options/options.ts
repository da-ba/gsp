/**
 * Options page entry point
 * Imports command options to trigger their registration, then renders all sections.
 */

// Import commands that have options (this triggers their registerOptionsSection calls)
import "./giphy-options.ts";

import { getOptionsSections } from "./registry.ts";

function renderOptionsPage(): void {
  const container = document.getElementById("sections");
  if (!container) return;

  const sections = getOptionsSections();

  for (const section of sections) {
    const sectionEl = document.createElement("div");
    sectionEl.className = "section";

    const titleEl = document.createElement("div");
    titleEl.className = "section-title";
    titleEl.textContent = section.title;
    sectionEl.appendChild(titleEl);

    const contentEl = document.createElement("div");
    contentEl.className = "section-content";
    section.render(contentEl);
    sectionEl.appendChild(contentEl);

    container.appendChild(sectionEl);
  }

  if (sections.length === 0) {
    container.textContent = "No settings available.";
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage);
} else {
  renderOptionsPage();
}
