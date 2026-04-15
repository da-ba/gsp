/**
 * Giphy Options Section - vanilla DOM version
 *
 * Renders giphy settings UI into a container element.
 * Used both in the picker settings panel and the options page.
 */

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
import { clearImageSettingsCache } from "./command.ts"

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

/**
 * Render the Giphy options section into a container element.
 */
export function renderGiphyOptionsSection(container: HTMLElement): void {
  // Inject styles once
  if (!document.getElementById("giphy-options-styles")) {
    const style = document.createElement("style")
    style.id = "giphy-options-styles"
    style.textContent = sectionStyles
    document.head.appendChild(style)
  }

  const section = document.createElement("div")
  section.className = "giphy-section"

  const titleEl = document.createElement("div")
  titleEl.className = "section-title"
  titleEl.textContent = "/giphy"
  section.appendChild(titleEl)

  const content = document.createElement("div")
  content.className = "section-content"

  // Description
  const desc = document.createElement("div")
  desc.className = "muted"
  desc.innerHTML =
    'Giphy requires an API key. Get a free key at <a href="https://developers.giphy.com/dashboard/" target="_blank" rel="noopener noreferrer">developers.giphy.com</a>'
  content.appendChild(desc)

  // API Key input
  const keyGroup = document.createElement("div")
  const keyLabel = document.createElement("label")
  keyLabel.htmlFor = "giphy-key"
  keyLabel.textContent = "API Key"
  keyGroup.appendChild(keyLabel)

  const keyInput = document.createElement("input")
  keyInput.type = "password"
  keyInput.id = "giphy-key"
  keyInput.placeholder = "Paste your Giphy API key"
  keyInput.autocomplete = "off"
  keyGroup.appendChild(keyInput)
  content.appendChild(keyGroup)

  // Show key toggle
  const showKeyRow = document.createElement("div")
  showKeyRow.className = "row"
  const showKeyLabel = document.createElement("label")
  showKeyLabel.style.display = "flex"
  showKeyLabel.style.alignItems = "center"
  showKeyLabel.style.gap = "8px"
  showKeyLabel.style.fontWeight = "400"
  const showKeyCheckbox = document.createElement("input")
  showKeyCheckbox.type = "checkbox"
  showKeyCheckbox.id = "giphy-show-key"
  showKeyLabel.appendChild(showKeyCheckbox)
  showKeyLabel.appendChild(document.createTextNode("Show key"))
  showKeyRow.appendChild(showKeyLabel)
  content.appendChild(showKeyRow)

  showKeyCheckbox.addEventListener("change", () => {
    keyInput.type = showKeyCheckbox.checked ? "text" : "password"
  })

  // Buttons
  const btnRow = document.createElement("div")
  btnRow.className = "row"

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

  const saveBtn = document.createElement("button")
  saveBtn.textContent = "Save"
  saveBtn.addEventListener("click", async () => {
    const key = keyInput.value.trim()
    await setGiphyKey(key)
    setStatus(key ? "Saved" : "Saved empty key")
  })
  btnRow.appendChild(saveBtn)

  const testBtn = document.createElement("button")
  testBtn.textContent = "Test"
  testBtn.addEventListener("click", async () => {
    const key = keyInput.value.trim()
    if (!key) {
      setStatus("Missing key", false)
      return
    }
    setStatus("Testing…", false)
    const result = await testGiphyKey(key)
    if (result.error) {
      setStatus("Test failed: " + result.error, false)
    } else {
      setStatus("Key ok")
    }
  })
  btnRow.appendChild(testBtn)

  const clearBtn = document.createElement("button")
  clearBtn.textContent = "Clear"
  clearBtn.addEventListener("click", async () => {
    await setGiphyKey("")
    keyInput.value = ""
    setStatus("Cleared")
  })
  btnRow.appendChild(clearBtn)

  content.appendChild(btnRow)
  content.appendChild(statusEl)

  // Image Format section
  const formatSection = document.createElement("div")
  formatSection.style.marginTop = "16px"
  formatSection.style.borderTop = "1px solid rgba(0, 0, 0, 0.08)"
  formatSection.style.paddingTop = "16px"

  const formatLabel = document.createElement("label")
  formatLabel.style.marginBottom = "8px"
  formatLabel.textContent = "Image Format"
  formatSection.appendChild(formatLabel)

  const formatOptions = document.createElement("div")
  formatOptions.style.display = "flex"
  formatOptions.style.flexDirection = "column"
  formatOptions.style.gap = "8px"

  const formats: { value: GiphyImageFormat; label: string }[] = [
    { value: "markdown", label: "![](link) (default)" },
    { value: "img", label: '<img src="link" />' },
    { value: "img-fixed", label: '<img src="link" width="350" />' },
  ]

  formats.forEach(({ value, label }) => {
    const radioLabel = document.createElement("label")
    radioLabel.style.display = "flex"
    radioLabel.style.alignItems = "center"
    radioLabel.style.gap = "8px"
    radioLabel.style.fontWeight = "400"

    const radio = document.createElement("input")
    radio.type = "radio"
    radio.name = "giphy-format"
    radio.value = value
    radio.addEventListener("change", async () => {
      await setGiphyImageFormat(value)
      clearImageSettingsCache()
    })

    const code = document.createElement("code")
    code.textContent = label
    radioLabel.appendChild(radio)
    radioLabel.appendChild(code)
    formatOptions.appendChild(radioLabel)
  })

  formatSection.appendChild(formatOptions)
  content.appendChild(formatSection)

  // Alignment section
  const alignSection = document.createElement("div")
  alignSection.style.marginTop = "16px"
  alignSection.style.borderTop = "1px solid rgba(0, 0, 0, 0.08)"
  alignSection.style.paddingTop = "16px"

  const alignLabel = document.createElement("label")
  alignLabel.style.marginBottom = "8px"
  alignLabel.textContent = "Alignment"
  alignSection.appendChild(alignLabel)

  const alignOptions = document.createElement("div")
  alignOptions.style.display = "flex"
  alignOptions.style.flexDirection = "column"
  alignOptions.style.gap = "8px"

  const centerLabel = document.createElement("label")
  centerLabel.style.display = "flex"
  centerLabel.style.alignItems = "center"
  centerLabel.style.gap = "8px"
  centerLabel.style.fontWeight = "400"

  const centerCheckbox = document.createElement("input")
  centerCheckbox.type = "checkbox"
  centerCheckbox.addEventListener("change", async () => {
    await setGiphyCenterImage(centerCheckbox.checked)
    clearImageSettingsCache()
  })

  centerLabel.appendChild(centerCheckbox)
  centerLabel.appendChild(document.createTextNode("Center image (wrap in "))
  const centerCode = document.createElement("code")
  centerCode.textContent = '<p align="center">...</p>'
  centerLabel.appendChild(centerCode)
  centerLabel.appendChild(document.createTextNode(")"))
  alignOptions.appendChild(centerLabel)

  alignSection.appendChild(alignOptions)
  content.appendChild(alignSection)

  section.appendChild(content)
  container.appendChild(section)

  // Load current settings
  getGiphyKey().then((key) => {
    keyInput.value = key
  })
  getGiphyImageFormat().then((format) => {
    const radios = formatOptions.querySelectorAll('input[type="radio"]')
    radios.forEach((radio) => {
      const r = radio as HTMLInputElement
      r.checked = r.value === format
    })
  })
  getGiphyCenterImage().then((center) => {
    centerCheckbox.checked = center
  })
}
