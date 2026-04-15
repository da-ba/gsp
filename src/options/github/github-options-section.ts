/**
 * GitHub Options Section - vanilla DOM version
 *
 * Provides UI for configuring shared GitHub API settings.
 */

import { getGitHubToken, setGitHubToken, testGitHubToken } from "./api.ts"

/** Styles for the GitHub options section */
const sectionStyles = `
  .github-section {
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 14px;
  }
  .github-section .section-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .github-section .section-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .github-section label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
  .github-section input[type="text"],
  .github-section input[type="password"] {
    width: 100%;
    max-width: 520px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    font-size: 14px;
  }
  .github-section button {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    background: white;
    cursor: pointer;
    font-size: 14px;
  }
  .github-section button:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .github-section .row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .github-section .muted {
    opacity: 0.72;
    font-size: 13px;
  }
  .github-section .status {
    font-weight: 500;
    min-height: 20px;
  }
  .github-section a {
    color: inherit;
  }
  .github-section .feature-list {
    margin: 8px 0;
    padding-left: 20px;
  }
  .github-section .feature-list li {
    margin-bottom: 4px;
    font-size: 13px;
    opacity: 0.85;
  }
`

/**
 * Render the GitHub options section into a container element.
 */
export function renderGitHubOptionsSection(container: HTMLElement): void {
  // Inject styles once
  if (!document.getElementById("github-options-styles")) {
    const style = document.createElement("style")
    style.id = "github-options-styles"
    style.textContent = sectionStyles
    document.head.appendChild(style)
  }

  const section = document.createElement("div")
  section.className = "github-section"

  const titleEl = document.createElement("div")
  titleEl.className = "section-title"
  titleEl.textContent = "GitHub API"
  section.appendChild(titleEl)

  const content = document.createElement("div")
  content.className = "section-content"

  // Description
  const desc = document.createElement("div")
  desc.className = "muted"
  desc.innerHTML = `A GitHub Personal Access Token enables advanced features:
    <ul class="feature-list">
      <li><code>/link ci</code> - Link to CI jobs and artifacts</li>
    </ul>
    Create a <a href="https://github.com/settings/tokens/new?description=GitHub%20Slash%20Palette&scopes=public_repo" target="_blank" rel="noopener noreferrer">Personal Access Token</a> with the <code>public_repo</code> scope (for public repos) or <code>repo</code> scope (for private repos). The token is stored locally in your browser.`
  content.appendChild(desc)

  // Token input
  const tokenGroup = document.createElement("div")
  const tokenLabel = document.createElement("label")
  tokenLabel.htmlFor = "github-token"
  tokenLabel.textContent = "Personal Access Token"
  tokenGroup.appendChild(tokenLabel)

  const tokenInput = document.createElement("input")
  tokenInput.type = "password"
  tokenInput.id = "github-token"
  tokenInput.placeholder = "Paste your GitHub Personal Access Token"
  tokenInput.autocomplete = "off"
  tokenGroup.appendChild(tokenInput)
  content.appendChild(tokenGroup)

  // Show token toggle
  const showRow = document.createElement("div")
  showRow.className = "row"
  const showLabel = document.createElement("label")
  showLabel.style.display = "flex"
  showLabel.style.alignItems = "center"
  showLabel.style.gap = "8px"
  showLabel.style.fontWeight = "400"
  const showCheckbox = document.createElement("input")
  showCheckbox.type = "checkbox"
  showCheckbox.id = "github-show-token"
  showLabel.appendChild(showCheckbox)
  showLabel.appendChild(document.createTextNode("Show token"))
  showRow.appendChild(showLabel)
  content.appendChild(showRow)

  showCheckbox.addEventListener("change", () => {
    tokenInput.type = showCheckbox.checked ? "text" : "password"
  })

  // Status
  const statusEl = document.createElement("div")
  statusEl.className = "status"

  function setStatus(msg: string, autoHide = true): void {
    statusEl.textContent = msg
    if (autoHide && msg) {
      setTimeout(() => {
        statusEl.textContent = ""
      }, 1600)
    }
  }

  // Buttons
  const btnRow = document.createElement("div")
  btnRow.className = "row"

  const saveBtn = document.createElement("button")
  saveBtn.textContent = "Save"
  saveBtn.addEventListener("click", async () => {
    const t = tokenInput.value.trim()
    await setGitHubToken(t)
    setStatus(t ? "Saved" : "Saved empty token")
  })
  btnRow.appendChild(saveBtn)

  const testBtn = document.createElement("button")
  testBtn.textContent = "Test"
  testBtn.addEventListener("click", async () => {
    const t = tokenInput.value.trim()
    if (!t) {
      setStatus("Missing token", false)
      return
    }
    setStatus("Testing…", false)
    const result = await testGitHubToken(t)
    if (result.valid) {
      setStatus("Token valid ✓")
    } else {
      setStatus("Test failed: " + (result.error || "Unknown error"), false)
    }
  })
  btnRow.appendChild(testBtn)

  const clearBtn = document.createElement("button")
  clearBtn.textContent = "Clear"
  clearBtn.addEventListener("click", async () => {
    await setGitHubToken("")
    tokenInput.value = ""
    setStatus("Cleared")
  })
  btnRow.appendChild(clearBtn)

  content.appendChild(btnRow)
  content.appendChild(statusEl)

  section.appendChild(content)
  container.appendChild(section)

  // Load current token
  getGitHubToken().then((t) => {
    tokenInput.value = t
  })
}
