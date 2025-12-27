/**
 * Options page entry point - React version
 */

import React from "react"
import { createRoot } from "react-dom/client"

// Import command modules to trigger options section registration
// This must be done before importing OptionsApp to ensure registrations are complete
import "../content/commands/giphy/index.ts"

import { OptionsApp } from "./components/index.ts"

function renderOptionsPage(): void {
  const container = document.getElementById("sections")
  if (!container) return

  const root = createRoot(container)
  root.render(React.createElement(OptionsApp))
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage)
} else {
  renderOptionsPage()
}
