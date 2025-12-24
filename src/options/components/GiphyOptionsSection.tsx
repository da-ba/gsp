/**
 * Giphy Options Section Component
 */

import React from "react";
import { getGiphyKey, setGiphyKey, testGiphyKey } from "../../api/giphy.ts";

export function GiphyOptionsSection() {
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [status, setStatus] = React.useState("");

  // Load current key on mount
  React.useEffect(() => {
    getGiphyKey().then((key) => setApiKey(key));
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

  return (
    <div className="section">
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
      </div>
    </div>
  );
}
