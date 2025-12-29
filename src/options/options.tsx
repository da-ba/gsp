/**
 * Options page entry point - SolidJS version
 */

import { render } from "solid-js/web"

// Import command modules to trigger options section registration
// This must be done before importing OptionsApp to ensure registrations are complete
import "../content/commands/giphy/index.ts"

import { OptionsApp } from "./components/index.ts"

function renderOptionsPage(): void {
  const container = document.getElementById("sections")
  if (!container) return

  render(() => <OptionsApp />, container)
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage)
} else {
  renderOptionsPage()
}
