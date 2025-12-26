/**
 * Options page entry point - React version
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { OptionsApp } from "./components/index.ts";

// Import command modules to trigger options section registration
import "../content/commands/giphy/index.ts";

function renderOptionsPage(): void {
  const container = document.getElementById("sections");
  if (!container) return;

  const root = createRoot(container);
  root.render(React.createElement(OptionsApp));
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage);
} else {
  renderOptionsPage();
}
