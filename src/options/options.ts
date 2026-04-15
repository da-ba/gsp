/**
 * Options page entry point - vanilla DOM version
 */

// Import command modules to trigger options section registration
// This must be done before rendering to ensure registrations are complete
import "../content/commands/giphy/index.ts"
// Import shared GitHub options module
import "./github/index.ts"

import { getOptionsSections } from "../content/commands/options-registry.ts"

/** Global styles for the options page */
const globalStyles = `
  body {
    font-family: system-ui, sans-serif;
    padding: 18px;
    max-width: 760px;
  }
  h2 {
    margin-bottom: 16px;
  }
`

function renderOptionsPage(): void {
  const container = document.getElementById("sections")
  if (!container) return

  // Inject global styles
  const style = document.createElement("style")
  style.textContent = globalStyles
  document.head.appendChild(style)

  // Title
  const h2 = document.createElement("h2")
  h2.textContent = "GitHub Slash Palette"
  container.appendChild(h2)

  // Render all registered options sections
  const sections = getOptionsSections()
  sections.forEach(({ renderSection }) => {
    const sectionEl = document.createElement("div")
    renderSection(sectionEl)
    container.appendChild(sectionEl)
  })
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOptionsPage)
} else {
  renderOptionsPage()
}
