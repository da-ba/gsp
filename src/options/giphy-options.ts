/**
 * Giphy command options for the options page
 */

import { getGiphyKey, setGiphyKey, testGiphyKey } from "../api/giphy.ts";
import { registerOptionsSection } from "./registry.ts";

function renderGiphyOptions(container: HTMLElement): void {
  // Description
  const desc = document.createElement("div");
  desc.className = "muted";
  desc.innerHTML =
    'Giphy requires an API key. Get a free key at <a href="https://developers.giphy.com/dashboard/" target="_blank">developers.giphy.com</a>';
  container.appendChild(desc);

  // Input row
  const inputRow = document.createElement("div");

  const label = document.createElement("label");
  label.htmlFor = "giphy-key";
  label.textContent = "API Key";
  inputRow.appendChild(label);

  const input = document.createElement("input");
  input.type = "password";
  input.id = "giphy-key";
  input.placeholder = "Paste your Giphy API key";
  input.autocomplete = "off";
  inputRow.appendChild(input);

  container.appendChild(inputRow);

  // Show key checkbox
  const showRow = document.createElement("div");
  showRow.className = "row";
  const showLabel = document.createElement("label");
  showLabel.style.display = "flex";
  showLabel.style.alignItems = "center";
  showLabel.style.gap = "8px";
  showLabel.style.fontWeight = "400";

  const showCb = document.createElement("input");
  showCb.type = "checkbox";
  showCb.id = "giphy-show-key";
  showLabel.appendChild(showCb);
  showLabel.appendChild(document.createTextNode("Show key"));
  showRow.appendChild(showLabel);
  container.appendChild(showRow);

  // Buttons
  const btnRow = document.createElement("div");
  btnRow.className = "row";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save";
  btnRow.appendChild(saveBtn);

  const testBtn = document.createElement("button");
  testBtn.textContent = "Test";
  btnRow.appendChild(testBtn);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear";
  btnRow.appendChild(clearBtn);

  container.appendChild(btnRow);

  // Status
  const status = document.createElement("div");
  status.className = "status";
  container.appendChild(status);

  function setStatus(text: string): void {
    status.textContent = text;
  }

  // Load current key
  getGiphyKey().then((key) => {
    input.value = key;
  });

  // Wire show/hide
  showCb.addEventListener("change", () => {
    input.type = showCb.checked ? "text" : "password";
  });

  // Save
  saveBtn.addEventListener("click", async () => {
    const key = input.value.trim();
    await setGiphyKey(key);
    setStatus(key ? "Saved" : "Saved empty key");
    setTimeout(() => setStatus(""), 1600);
  });

  // Test
  testBtn.addEventListener("click", async () => {
    const key = input.value.trim();
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
  });

  // Clear
  clearBtn.addEventListener("click", async () => {
    await setGiphyKey("");
    input.value = "";
    setStatus("Cleared");
    setTimeout(() => setStatus(""), 1600);
  });
}

// Register the Giphy options section
registerOptionsSection({
  title: "/giphy",
  render: renderGiphyOptions,
});
