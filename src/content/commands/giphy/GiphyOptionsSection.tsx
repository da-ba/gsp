/**
 * Giphy Options Section Component
 */

import React from "react";
import {
  getGiphyKey,
  setGiphyKey,
  testGiphyKey,
  getGiphyImageFormat,
  setGiphyImageFormat,
  getGiphyCenterImage,
  setGiphyCenterImage,
  type GiphyImageFormat,
} from "./api.ts";

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
`;

export function GiphyOptionsSection() {
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [imageFormat, setImageFormat] = React.useState<GiphyImageFormat>("markdown");
  const [centerImage, setCenterImage] = React.useState(false);

  // Load current settings on mount
  React.useEffect(() => {
    getGiphyKey().then((key) => setApiKey(key));
    getGiphyImageFormat().then((format) => setImageFormat(format));
    getGiphyCenterImage().then((center) => setCenterImage(center));
  }, []);

  const handleSave = async () => {
    const key = apiKey.trim();
    await setGiphyKey(key);
    setStatus(key ? "Saved" : "Saved empty key");
    setTimeout(() => setStatus(""), 1600);
  };

  const handleTest = async () => {
    const key = apiKey.trim();
    if (!key) {
      setStatus("Missing key");
      return;
    }

    setStatus("Testing…");
    const result = await testGiphyKey(key);
    if (result.error) {
      setStatus("Test failed: " + result.error);
    } else {
      setStatus("Key ok");
    }
  };

  const handleClear = async () => {
    await setGiphyKey("");
    setApiKey("");
    setStatus("Cleared");
    setTimeout(() => setStatus(""), 1600);
  };

  const handleFormatChange = async (format: GiphyImageFormat) => {
    setImageFormat(format);
    await setGiphyImageFormat(format);
  };

  const handleCenterChange = async (center: boolean) => {
    setCenterImage(center);
    await setGiphyCenterImage(center);
  };

  return (
    <>
      <style>{sectionStyles}</style>
      <div className="giphy-section">
        <div className="section-title">/giphy</div>
        <div className="section-content">
          <div className="muted">
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
            <label htmlFor="giphy-key">API Key</label>
            <input
              type={showKey ? "text" : "password"}
              id="giphy-key"
              placeholder="Paste your Giphy API key"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="row">
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
              <input
                type="checkbox"
                id="giphy-show-key"
                checked={showKey}
                onChange={(e) => setShowKey(e.target.checked)}
              />
              Show key
            </label>
          </div>

          <div className="row">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleTest}>Test</button>
            <button onClick={handleClear}>Clear</button>
          </div>

          <div className="status">{status}</div>

          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
              paddingTop: "16px",
            }}
          >
            <label style={{ marginBottom: "8px" }}>Image Format</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat === "markdown"}
                  onChange={() => handleFormatChange("markdown")}
                />
                <code>![](link)</code> (default)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat === "img"}
                  onChange={() => handleFormatChange("img")}
                />
                <code>{'<img src="link" />'}</code>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
                <input
                  type="radio"
                  name="giphy-format"
                  checked={imageFormat === "img-fixed"}
                  onChange={() => handleFormatChange("img-fixed")}
                />
                <code>{'<img src="link" width="350" />'}</code> (fixed width)
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
              paddingTop: "16px",
            }}
          >
            <label style={{ marginBottom: "8px" }}>Alignment</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={centerImage}
                  onChange={(e) => handleCenterChange(e.target.checked)}
                />
                Center image (wrap in <code>{'<p align="center">...</p>'}</code>)
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
