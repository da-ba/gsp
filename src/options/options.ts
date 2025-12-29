/**
 * Options page entry point - Preact version
 */

import { render, createElement } from "preact"

// Import command modules to trigger options section registration
// This must be done before importing OptionsApp to ensure registrations are complete
import "../content/commands/giphy/index.ts"

import { OptionsApp } from "./components/index.ts"

function renderOptionsPage(): void {
  const container = document.getElementById("sections")
  if (!container) return

  render(createElement(OptionsApp, null), container)
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage)
} else {
  renderOptionsPage()
}
