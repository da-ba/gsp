/**
 * Giphy Options Section Component - SolidJS version
 */

import { createSignal, onMount } from "solid-js"
import {
  getGiphyKey,
  setGiphyKey,
  testGiphyKey,
  getGiphyImageFormat,
  setGiphyImageFormat,
  getGiphyCenterImage,
  setGiphyCenterImage,
  type GiphyImageFormat,
} from "./api.ts"

/** Styles for the Giphy options section */
const sectionStyles = `
  .giphy-section {
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 14px;
  }
  .giphy-section .section-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .giphy-section .section-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .giphy-section label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
  .giphy-section input[type="text"],
  .giphy-section input[type="password"] {
    width: 100%;
    max-width: 520px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    font-size: 14px;
  }
  .giphy-section button {
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.18);
    background: white;
    cursor: pointer;
    font-size: 14px;
  }
  .giphy-section button:hover {
    background: rgba(0, 0, 0, 0.04);
  }
  .giphy-section .row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .giphy-section .muted {
    opacity: 0.72;
    font-size: 13px;
  }
  .giphy-section .status {
    font-weight: 500;
    min-height: 20px;
  }
  .giphy-section a {
    color: inherit;
  }
`

export function GiphyOptionsSection() {
  const [apiKey, setApiKey] = createSignal("")
  const [showKey, setShowKey] = createSignal(false)
  const [status, setStatus] = createSignal("")
  const [imageFormat, setImageFormatState] = createSignal<GiphyImageFormat>("markdown")
  const [centerImage, setCenterImageState] = createSignal(false)

  // Load current settings on mount
  onMount(() => {
    getGiphyKey().then((key) => setApiKey(key))
    getGiphyImageFormat().then((format) => setImageFormatState(format))
    getGiphyCenterImage().then((center) => setCenterImageState(center))
  })

  const handleSave = async () => {
    const key = apiKey().trim()
    await setGiphyKey(key)
    setStatus(key ? "Saved" : "Saved empty key")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleTest = async () => {
    const key = apiKey().trim()
    if (!key) {
      setStatus("Missing key")
      return
    }

    setStatus("Testing…")
    const result = await testGiphyKey(key)
    if (result.error) {
      setStatus("Test failed: " + result.error)
    } else {
      setStatus("Key ok")
    }
  }

  const handleClear = async () => {
    await setGiphyKey("")
    setApiKey("")
    setStatus("Cleared")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleFormatChange = async (format: GiphyImageFormat) => {
    setImageFormatState(format)
    await setGiphyImageFormat(format)
  }

  const handleCenterChange = async (center: boolean) => {
    setCenterImageState(center)
    await setGiphyCenterImage(center)
  }

  return (
    <>
      <style>{sectionStyles}</style>
      <div class="giphy-section">
        <div class="section-title">/giphy</div>
        <div class="section-content">
          <div class="muted">
            Giphy requires an API key. Get a free key at{" "}
            <a
              href="https://developers.giphy.com/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
            >
              developers.giphy.com
            </a>
          </div>

          <div>
            <label for="giphy-key">API Key</label>
            <input
              type={showKey() ? "text" : "password"}
              id="giphy-key"
              placeholder="Paste your Giphy API key"
              autocomplete="off"
              value={apiKey()}
              onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
            />
          </div>

          <div class="row">
            <label
              style={{ display: "flex", "align-items": "center", gap: "8px", "font-weight": "400" }}
            >
              <input
                type="checkbox"
                id="giphy-show-key"
                checked={showKey()}
                onChange={(e) => setShowKey((e.target as HTMLInputElement).checked)}
              />
              Show key
            </label>
          </div>

          <div class="row">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleTest}>Test</button>
            <button onClick={handleClear}>Clear</button>
          </div>

          <div class="status">{status()}</div>

          <div
            style={{
              "margin-top": "16px",
              "border-top": "1px solid rgba(0, 0, 0, 0.08)",
              "padding-top": "16px",
            }}
          >
            <label style={{ "margin-bottom": "8px" }}>Image Format</label>
            <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
              <label
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "font-weight": "400",
                }}
              >
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat() === "markdown"}
                  onChange={() => handleFormatChange("markdown")}
                />
                <code>![](link)</code> (default)
              </label>
              <label
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "font-weight": "400",
                }}
              >
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat() === "img"}
                  onChange={() => handleFormatChange("img")}
                />
                <code>{'<img src="link" />'}</code>
              </label>
              <label
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "font-weight": "400",
                }}
              >
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat() === "img-fixed"}
                  onChange={() => handleFormatChange("img-fixed")}
                />
                <code>{'<img src="link" width="350" />'}</code> (fixed width)
              </label>
            </div>
          </div>

          <div
            style={{
              "margin-top": "16px",
              "border-top": "1px solid rgba(0, 0, 0, 0.08)",
              "padding-top": "16px",
            }}
          >
            <label style={{ "margin-bottom": "8px" }}>Alignment</label>
            <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
              <label
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  "font-weight": "400",
                }}
              >
                <input
                  type="checkbox"
                  checked={centerImage()}
                  onChange={(e) => handleCenterChange((e.target as HTMLInputElement).checked)}
                />
                Center image (wrap in <code>{'<p align="center">...</p>'}</code>)
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
