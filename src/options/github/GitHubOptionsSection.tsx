/**
 * GitHub Options Section Component
 *
 * Provides UI for configuring shared GitHub API settings.
 */

import React from "react"
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

export function GitHubOptionsSection() {
  const [token, setToken] = React.useState("")
  const [showToken, setShowToken] = React.useState(false)
  const [status, setStatus] = React.useState("")

  // Load current settings on mount
  React.useEffect(() => {
    getGitHubToken().then((t) => setToken(t))
  }, [])

  const handleSave = async () => {
    const t = token.trim()
    await setGitHubToken(t)
    setStatus(t ? "Saved" : "Saved empty token")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleTest = async () => {
    const t = token.trim()
    if (!t) {
      setStatus("Missing token")
      return
    }

    setStatus("Testing…")
    const result = await testGitHubToken(t)
    if (result.valid) {
      setStatus("Token valid ✓")
    } else {
      setStatus("Test failed: " + (result.error || "Unknown error"))
    }
  }

  const handleClear = async () => {
    await setGitHubToken("")
    setToken("")
    setStatus("Cleared")
    setTimeout(() => setStatus(""), 1600)
  }

  return (
    <>
      <style>{sectionStyles}</style>
      <div className="github-section">
        <div className="section-title">GitHub API</div>
        <div className="section-content">
          <div className="muted">
            A GitHub Personal Access Token enables advanced features:
            <ul className="feature-list">
              <li>
                <code>/link ci</code> - Link to CI jobs and artifacts
              </li>
            </ul>
            Create a{" "}
            <a
              href="https://github.com/settings/tokens/new?description=GitHub%20Slash%20Palette&scopes=public_repo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Personal Access Token
            </a>{" "}
            with the <code>public_repo</code> scope (for public repos) or <code>repo</code> scope
            (for private repos). The token is stored locally in your browser.
          </div>

          <div>
            <label htmlFor="github-token">Personal Access Token</label>
            <input
              type={showToken ? "text" : "password"}
              id="github-token"
              placeholder="Paste your GitHub Personal Access Token"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="row">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
              <input
                type="checkbox"
                id="github-show-token"
                checked={showToken}
                onChange={(e) => setShowToken(e.target.checked)}
              />
              Show token
            </label>
          </div>

          <div className="row">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleTest}>Test</button>
            <button onClick={handleClear}>Clear</button>
          </div>

          <div className="status">{status}</div>
        </div>
      </div>
    </>
  )
}
