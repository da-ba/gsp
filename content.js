const state = {
  pickerEl: null,
  headerTitleEl: null,
  headerSubEl: null,
  hintEl: null,
  bodyEl: null,
  footerEl: null,
  activeField: null,
  activeLineStart: 0,
  activeCursorPos: 0,
  activeCommand: "",
  lastQuery: "",
  debounceId: 0,
  inFlight: false,
  currentItems: [],
  selectedIndex: 0,
  cols: 3,
  mouseDownInPicker: false,
  suggestItems: [],
  lastSuggestQuery: "",
  suggestDebounceId: 0,
  cache: {
    giphyTrendingTerms: null,
    giphyTrendingGifs: null
  }
}

const commandRegistry = {}

function registerCommand(name, spec) {
  commandRegistry[name] = spec
}

function getCommand(name) {
  if (!name) return null
  return commandRegistry[name] || null
}

function dashChar() {
  return String.fromCharCode(45)
}

function htmlAttrDataColorMode() {
  const d = dashChar()
  return "data" + d + "color" + d + "mode"
}

function htmlAttrDataTheme() {
  const d = dashChar()
  return "data" + d + "theme"
}

function prefersDarkQuery() {
  const d = dashChar()
  return "(prefers" + d + "color" + d + "scheme: dark)"
}

function isDarkMode() {
  const html = document.documentElement
  const v1 = String(html.getAttribute(htmlAttrDataColorMode()) || "").toLowerCase()
  if (v1 === "dark") return true
  if (v1 === "light") return false

  const v2 = String(html.getAttribute(htmlAttrDataTheme()) || "").toLowerCase()
  if (v2.indexOf("dark") >= 0) return true
  if (v2.indexOf("light") >= 0) return false

  if (window.matchMedia) {
    return window.matchMedia(prefersDarkQuery()).matches
  }
  return false
}

function fontSystemUi() {
  const d = dashChar()
  return "system" + d + "ui"
}

function fontSansSerif() {
  const d = dashChar()
  return "sans" + d + "serif"
}

function tokenLinearGradient() {
  const d = dashChar()
  return "linear" + d + "gradient"
}

function isGitHubMarkdownField(el) {
  if (!el) return false
  return el.tagName === "TEXTAREA"
}

function add(a, b) {
  return a + b
}

function neg(b) {
  return add(~b, 1)
}

function sub(a, b) {
  return add(a, neg(b))
}

function clamp(n, min, max) {
  if (n < min) return min
  if (n > max) return max
  return n
}

function getCursorInfo(textarea) {
  const value = textarea.value || ""
  const pos = textarea.selectionStart || 0
  let lineStart = value.lastIndexOf("\n", pos)
  if (lineStart < 0) lineStart = 0
  else lineStart = add(lineStart, 1)
  const line = value.slice(lineStart, pos)
  return { value, pos, lineStart, line }
}

function parseSlashCommand(line) {
  const trimmed = (line || "").trim()
  if (!trimmed.startsWith("/")) return null
  const rest = trimmed.slice(1)
  const parts = rest.split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  const cmd = String(parts[0] || "").toLowerCase()
  const q = parts.slice(1).join(" ").trim()
  return { cmd, query: q }
}

async function getGiphyKey() {
  const res = await chrome.storage.local.get({ giphyApiKey: "" })
  return (res.giphyApiKey || "").trim()
}

async function setGiphyKey(v) {
  await chrome.storage.local.set({ giphyApiKey: String(v || "").trim() })
}

async function redactApiKey(url) {
  try {
    const u = new URL(url)
    if (u.searchParams.has("api_key")) u.searchParams.set("api_key", "REDACTED")
    return u.toString()
  } catch (e) {
    return url
  }
}

async function giphyGetJson(url) {
  let res = null
  try {
    res = await fetch(url, { method: "GET" })
  } catch (e) {
    const safeUrl = await redactApiKey(url)
    console.warn("GitHub Slash Palette Giphy fetch error", safeUrl)
    return { error: "Network error while calling Giphy" }
  }

  const status = res ? res.status : 0
  let json = null
  let text = ""
  try {
    json = await res.json()
  } catch (e) {
    try { text = await res.text() } catch (e2) {}
  }

  if (!res.ok) {
    const safeUrl = await redactApiKey(url)
    const meta = json && json.meta ? json.meta : null
    const msg = meta && meta.msg ? String(meta.msg) : ""
    const shortText = text ? String(text).slice(0, 160) : ""
    const detail = msg || shortText
    console.warn("GitHub Slash Palette Giphy error", status, safeUrl, detail)
    return { error: "Giphy error " + String(status) + (detail ? ": " + detail : "") }
  }

  if (json && json.meta && typeof json.meta.status === "number" && json.meta.status >= 400) {
    const meta = json.meta
    const safeUrl = await redactApiKey(url)
    const msg = meta.msg ? String(meta.msg) : ""
    console.warn("GitHub Slash Palette Giphy meta error", meta.status, safeUrl, msg)
    return { error: "Giphy error " + String(meta.status) + (msg ? ": " + msg : "") }
  }

  return { json }
}

function mapGifItems(json) {
  const items = json && Array.isArray(json.data) ? json.data : []
  const gifs = items.map(it => {
    const images = it && it.images ? it.images : null
    const fixed = images && images.fixed_width ? images.fixed_width : null
    const original = images && images.original ? images.original : null
    const previewUrl = pickHttpsUrl(fixed)
    const insertUrl = pickHttpsUrl(original) || previewUrl
    return { kind: "gif", id: it && it.id ? it.id : "", previewUrl, insertUrl }
  }).filter(g => g.previewUrl && g.insertUrl)
  return gifs
}

function pickHttpsUrl(img) {
  const candidate = String((img && (img.https_url || img.url)) || "").trim()
  if (!candidate) return ""
  if (candidate.startsWith("https://")) return candidate
  if (candidate.startsWith("http://")) return "https://" + candidate.slice("http://".length)
  return ""
}

async function giphySearchWithKey(apiKey, query) {
  const url = new URL("https://api.giphy.com/v1/gifs/search")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "12")
  url.searchParams.set("rating", "pg")
  url.searchParams.set("lang", "en")

  const out = await giphyGetJson(url.toString())
  if (out.error) return { error: out.error }
  return { items: mapGifItems(out.json) }
}

async function giphyTrendingGifsWithKey(apiKey) {
  const url = new URL("https://api.giphy.com/v1/gifs/trending")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("limit", "12")
  url.searchParams.set("rating", "pg")

  const out = await giphyGetJson(url.toString())
  if (out.error) return { error: out.error }
  return { items: mapGifItems(out.json) }
}

async function giphyTrendingTermsWithKey(apiKey) {
  const url = new URL("https://api.giphy.com/v1/trending/searches")
  url.searchParams.set("api_key", apiKey)

  const out = await giphyGetJson(url.toString())
  if (out.error) return { error: out.error }
  const arr = out.json && Array.isArray(out.json.data) ? out.json.data : []
  const terms = arr.map(s => String(s || "")).filter(Boolean)
  return { terms }
}

async function giphyAutocompleteTermsWithKey(apiKey, q) {
  const url = new URL("https://api.giphy.com/v1/gifs/search/tags")
  url.searchParams.set("api_key", apiKey)
  url.searchParams.set("q", q)
  url.searchParams.set("limit", "6")

  const out = await giphyGetJson(url.toString())
  if (out.error) return { error: out.error }
  const items = out.json && Array.isArray(out.json.data) ? out.json.data : []
  const terms = items.map(it => {
    if (!it) return ""
    if (typeof it.name === "string") return it.name
    if (typeof it === "string") return it
    return ""
  }).filter(Boolean)
  return { terms }
}

function applyPickerTheme(el) {
  const dark = isDarkMode()
  const lg = tokenLinearGradient()
  if (dark) {
    el.style.color = "rgba(255,255,255,0.92)"
    el.style.border = "1px solid rgba(255,255,255,0.14)"
    el.style.backgroundColor = "rgba(18,18,20,0.82)"
    el.style.backgroundImage = lg + "(180deg, rgba(35,35,40,0.92), rgba(14,14,16,0.82))"
    el.style.boxShadow = "0 18px 46px rgba(0,0,0,0.55)"
  } else {
    el.style.color = "rgba(0,0,0,0.88)"
    el.style.border = "1px solid rgba(0,0,0,0.14)"
    el.style.backgroundColor = "rgba(255,255,255,0.86)"
    el.style.backgroundImage = lg + "(180deg, rgba(255,255,255,0.96), rgba(245,247,255,0.86))"
    el.style.boxShadow = "0 18px 46px rgba(0,0,0,0.22)"
  }
  el.style.backdropFilter = "blur(12px)"
}

function ensurePicker() {
  if (state.pickerEl) return state.pickerEl

  const el = document.createElement("div")
  el.id = "slashPalettePicker"
  el.style.position = "absolute"
  el.style.zIndex = "999999"
  el.style.width = "400px"
  el.style.maxHeight = "380px"
  el.style.overflow = "hidden"
  el.style.borderRadius = "14px"
  el.style.fontSize = "13px"
  el.style.fontFamily = fontSystemUi() + ", " + fontSansSerif()
  el.style.display = "none"

  applyPickerTheme(el)

  const header = document.createElement("div")
  header.style.display = "flex"
  header.style.alignItems = "center"
  header.style.justifyContent = "space-between"
  header.style.padding = "10px 10px 8px 10px"

  const left = document.createElement("div")
  left.style.display = "flex"
  left.style.flexDirection = "column"
  left.style.gap = "2px"

  const title = document.createElement("div")
  title.textContent = "GitHub Slash Palette"
  title.style.fontWeight = "700"
  title.style.letterSpacing = "0.4px"
  title.style.fontSize = "12px"
  title.style.opacity = "0.92"

  const sub = document.createElement("div")
  sub.textContent = "Type a slash command"
  sub.style.fontSize = "12px"
  sub.style.opacity = "0.72"

  left.appendChild(title)
  left.appendChild(sub)

  const badge = document.createElement("div")
  badge.textContent = "Esc close"
  badge.style.fontSize = "12px"
  badge.style.opacity = "0.72"
  badge.style.borderRadius = "999px"
  badge.style.padding = "4px 10px"
  badge.style.border = "1px solid rgba(0,0,0,0.14)"
  badge.style.backgroundColor = "rgba(255,255,255,0.55)"
  if (isDarkMode()) {
    badge.style.border = "1px solid rgba(255,255,255,0.14)"
    badge.style.backgroundColor = "rgba(0,0,0,0.18)"
  }

  header.appendChild(left)
  header.appendChild(badge)

  const hint = document.createElement("div")
  hint.style.display = "flex"
  hint.style.flexWrap = "wrap"
  hint.style.gap = "6px"
  hint.style.padding = "0 10px 10px 10px"

  const hintItems = [
    "Arrows move",
    "Enter insert",
    "Tab insert",
    "Esc close"
  ]

  hintItems.forEach(t => {
    const h = document.createElement("div")
    h.textContent = t
    h.style.fontSize = "12px"
    h.style.opacity = "0.72"
    h.style.borderRadius = "999px"
    h.style.padding = "3px 10px"
    h.style.border = "1px solid rgba(0,0,0,0.12)"
    h.style.backgroundColor = "rgba(255,255,255,0.55)"
    if (isDarkMode()) {
      h.style.border = "1px solid rgba(255,255,255,0.14)"
      h.style.backgroundColor = "rgba(0,0,0,0.18)"
    }
    hint.appendChild(h)
  })

  const body = document.createElement("div")
  body.style.overflow = "auto"
  body.style.padding = "0 10px 10px 10px"
  body.style.maxHeight = "280px"

  const footer = document.createElement("div")
  footer.style.padding = "10px"
  footer.style.borderTop = "1px solid rgba(0,0,0,0.10)"
  footer.style.opacity = "0.62"
  footer.style.fontSize = "12px"
  footer.textContent = "Tip: /giphy cats"
  if (isDarkMode()) {
    footer.style.borderTop = "1px solid rgba(255,255,255,0.10)"
  }

  el.addEventListener("mousedown", () => { state.mouseDownInPicker = true })
  el.addEventListener("mouseup", () => { state.mouseDownInPicker = false })

  el.appendChild(header)
  el.appendChild(hint)
  el.appendChild(body)
  el.appendChild(footer)

  document.documentElement.appendChild(el)

  state.pickerEl = el
  state.headerTitleEl = title
  state.headerSubEl = sub
  state.hintEl = hint
  state.bodyEl = body
  state.footerEl = footer

  return el
}

function isPickerVisible() {
  return !!(state.pickerEl && state.pickerEl.style.display === "block")
}

function showPicker() {
  const picker = ensurePicker()
  applyPickerTheme(picker)
  picker.style.display = "block"
  try {
    picker.animate(
      [{ opacity: 0, transform: "scale(0.98)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 120, fill: "both" }
    )
  } catch (e) {}
}

function resetPickerState() {
  state.lastQuery = ""
  state.currentItems = []
  state.selectedIndex = 0
  state.suggestItems = []
  state.lastSuggestQuery = ""
  state.activeCommand = ""
}

function hidePicker() {
  if (!state.pickerEl) return
  state.pickerEl.style.display = "none"
  if (state.bodyEl) state.bodyEl.textContent = ""
  resetPickerState()
}

function clearBody() {
  ensurePicker()
  if (state.bodyEl) state.bodyEl.textContent = ""
}

function setHeader(title, subtitle) {
  ensurePicker()
  if (state.headerTitleEl) state.headerTitleEl.textContent = title || "GitHub Slash Palette"
  if (state.headerSubEl) state.headerSubEl.textContent = subtitle || "Type a slash command"
}

function renderMessage(msg) {
  clearBody()
  const body = state.bodyEl
  if (!body) return
  const p = document.createElement("div")
  p.textContent = msg
  p.style.padding = "10px"
  p.style.borderRadius = "12px"
  p.style.border = "1px solid rgba(0,0,0,0.10)"
  p.style.backgroundColor = "rgba(255,255,255,0.55)"
  if (isDarkMode()) {
    p.style.border = "1px solid rgba(255,255,255,0.12)"
    p.style.backgroundColor = "rgba(0,0,0,0.18)"
  }
  body.appendChild(p)
}

function renderLoadingSkeleton() {
  clearBody()
  const body = state.bodyEl
  if (!body) return

  const grid = document.createElement("div")
  grid.style.display = "grid"
  grid.style.gridTemplateColumns = "repeat(3, 1fr)"
  grid.style.gap = "8px"

  const dark = isDarkMode()
  for (let i = 0; i < 12; i = add(i, 1)) {
    const box = document.createElement("div")
    box.style.width = "100%"
    box.style.height = "88px"
    box.style.borderRadius = "12px"
    box.style.backgroundColor = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"
    box.style.border = dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)"
    try {
      box.animate(
        [{ opacity: 0.55 }, { opacity: 0.90 }, { opacity: 0.55 }],
        { duration: 900, iterations: Infinity }
      )
    } catch (e) {}
    grid.appendChild(box)
  }

  body.appendChild(grid)
}

function replaceRange(str, start, end, replacement) {
  return str.slice(0, start) + replacement + str.slice(end)
}

function insertAtActiveLine(replacement) {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const info = getCursorInfo(field)
  const full = info.value
  const pos = info.pos
  const lineStart = state.activeLineStart

  const newValue = replaceRange(full, lineStart, pos, replacement)
  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertGifMarkdown(url) {
  const replacement = "![](" + url + ")"
  insertAtActiveLine(replacement)
}

function setSlashQueryInField(cmd, term) {
  const field = state.activeField
  if (!field) return
  if (field.tagName !== "TEXTAREA") return

  const info = getCursorInfo(field)
  const full = info.value
  const pos = info.pos
  const lineStart = state.activeLineStart

  const replacement = "/" + cmd + " " + term
  const newValue = replaceRange(full, lineStart, pos, replacement)

  field.value = newValue

  const newPos = add(lineStart, replacement.length)
  field.focus()
  field.setSelectionRange(newPos, newPos)
  field.dispatchEvent(new Event("input", { bubbles: true }))
}

function getCaretCoordinates(textarea, pos) {
  const cs = window.getComputedStyle(textarea)

  const div = document.createElement("div")
  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = cs.whiteSpace
  div.style.wordWrap = cs.wordWrap
  div.style.overflowWrap = cs.overflowWrap
  div.style.wordBreak = cs.wordBreak
  div.style.overflow = "auto"

  div.style.fontFamily = cs.fontFamily
  div.style.fontSize = cs.fontSize
  div.style.fontWeight = cs.fontWeight
  div.style.fontStyle = cs.fontStyle
  div.style.letterSpacing = cs.letterSpacing
  div.style.textTransform = cs.textTransform
  div.style.textAlign = cs.textAlign
  div.style.lineHeight = cs.lineHeight

  div.style.paddingTop = cs.paddingTop
  div.style.paddingRight = cs.paddingRight
  div.style.paddingBottom = cs.paddingBottom
  div.style.paddingLeft = cs.paddingLeft

  div.style.borderTopWidth = cs.borderTopWidth
  div.style.borderRightWidth = cs.borderRightWidth
  div.style.borderBottomWidth = cs.borderBottomWidth
  div.style.borderLeftWidth = cs.borderLeftWidth
  div.style.borderTopStyle = cs.borderTopStyle
  div.style.borderRightStyle = cs.borderRightStyle
  div.style.borderBottomStyle = cs.borderBottomStyle
  div.style.borderLeftStyle = cs.borderLeftStyle

  div.style.boxSizing = cs.boxSizing
  div.style.width = String(textarea.clientWidth) + "px"
  div.style.height = String(textarea.clientHeight) + "px"

  const before = (textarea.value || "").slice(0, pos)
  const after = (textarea.value || "").slice(pos)

  div.textContent = before

  const span = document.createElement("span")
  span.textContent = after.length ? after : " "
  div.appendChild(span)

  document.body.appendChild(div)

  div.scrollTop = textarea.scrollTop
  div.scrollLeft = textarea.scrollLeft

  const divRect = div.getBoundingClientRect()
  const spanRect = span.getBoundingClientRect()

  const left = add(sub(spanRect.left, divRect.left), div.scrollLeft)
  const top = add(sub(spanRect.top, divRect.top), div.scrollTop)
  const height = spanRect.height || Number.parseFloat(cs.lineHeight || "16") || 16

  document.body.removeChild(div)
  return { left, top, height }
}

function positionPickerAtCaret(field) {
  const picker = ensurePicker()
  const rect = field.getBoundingClientRect()
  const caret = getCaretCoordinates(field, field.selectionStart || 0)

  let left = add(add(window.scrollX, rect.left), caret.left)
  let top = add(add(window.scrollY, rect.top), add(caret.top, add(caret.height, 10)))

  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight
  const pickerWidth = 400
  const pickerHeight = 380

  const maxLeft = sub(sub(add(window.scrollX, vw), pickerWidth), 10)
  if (left > maxLeft) left = maxLeft
  const minLeft = add(window.scrollX, 10)
  if (left < minLeft) left = minLeft

  const maxTop = sub(sub(add(window.scrollY, vh), pickerHeight), 10)
  if (top > maxTop) {
    top = sub(add(add(window.scrollY, rect.top), caret.top), add(pickerHeight, 10))
  }
  const minTop = add(window.scrollY, 10)
  if (top < minTop) top = minTop

  picker.style.left = String(left) + "px"
  picker.style.top = String(top) + "px"
}

function refreshSelectionStyles() {
  const picker = state.pickerEl
  if (!picker) return
  const buttons = picker.querySelectorAll("button[data_item_index]")
  const dark = isDarkMode()
  buttons.forEach(btn => {
    const idx = Number(btn.getAttribute("data_item_index") || "0")
    const selected = idx === state.selectedIndex
    btn.style.outline = "0"
    btn.style.transform = selected ? "scale(1.03)" : "scale(1)"
    btn.style.boxShadow = selected
      ? (dark ? "0 10px 22px rgba(0,0,0,0.55)" : "0 10px 22px rgba(0,0,0,0.22)")
      : "0 0 0 rgba(0,0,0,0)"
    btn.style.border = selected
      ? (dark ? "1px solid rgba(255,255,255,0.20)" : "1px solid rgba(0,0,0,0.18)")
      : "1px solid rgba(0,0,0,0)"
  })
}

function scrollSelectedIntoView() {
  const picker = state.pickerEl
  if (!picker) return
  const btn = picker.querySelector("button[data_item_index='" + String(state.selectedIndex) + "']")
  if (!btn) return
  btn.scrollIntoView({ block: "nearest", inline: "nearest" })
}

function renderSuggestChips(items, title, onPick) {
  const body = state.bodyEl
  if (!body) return
  if (!items || !items.length) return

  const wrap = document.createElement("div")
  wrap.style.display = "flex"
  wrap.style.flexWrap = "wrap"
  wrap.style.gap = "6px"
  wrap.style.marginBottom = "10px"

  if (title) {
    const label = document.createElement("div")
    label.textContent = title
    label.style.width = "100%"
    label.style.opacity = "0.72"
    label.style.fontSize = "12px"
    label.style.marginBottom = "4px"
    wrap.appendChild(label)
  }

  const dark = isDarkMode()

  items.slice(0, 8).forEach(term => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.textContent = term
    btn.style.borderRadius = "999px"
    btn.style.padding = "6px 10px"
    btn.style.cursor = "pointer"
    btn.style.fontSize = "12px"
    btn.style.border = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.12)"
    btn.style.backgroundColor = dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)"
    btn.style.color = dark ? "rgba(255,255,255,0.90)" : "rgba(0,0,0,0.82)"

    btn.addEventListener("mouseenter", () => {
      btn.style.transform = "scale(1.03)"
    })
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "scale(1)"
    })

    btn.addEventListener("click", () => {
      if (onPick) onPick(term)
    })

    wrap.appendChild(btn)
  })

  body.appendChild(wrap)
}

function renderGrid(items, imgUrlFn, onPickItem, suggestTitle) {
  clearBody()
  const body = state.bodyEl
  if (!body) return

  if (state.suggestItems && state.suggestItems.length) {
    renderSuggestChips(state.suggestItems, suggestTitle, term => {
      setSlashQueryInField(state.activeCommand, term)
    })
  }

  state.currentItems = items
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, sub(items.length, 1)))

  const grid = document.createElement("div")
  grid.style.display = "grid"
  grid.style.gridTemplateColumns = "repeat(3, 1fr)"
  grid.style.gap = "8px"

  const dark = isDarkMode()

  items.forEach((it, idx) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.setAttribute("data_item_index", String(idx))
    btn.style.padding = "0"
    btn.style.margin = "0"
    btn.style.backgroundColor = "transparent"
    btn.style.cursor = "pointer"
    btn.style.borderRadius = "12px"
    btn.style.overflow = "hidden"
    btn.style.border = "1px solid rgba(0,0,0,0)"
    btn.style.transition = "transform 90ms ease, boxShadow 90ms ease"
    btn.style.boxShadow = dark ? "0 6px 14px rgba(0,0,0,0.40)" : "0 6px 14px rgba(0,0,0,0.12)"

    const img = document.createElement("img")
    img.src = imgUrlFn(it)
    img.alt = "item"
    img.style.width = "100%"
    img.style.height = "auto"
    img.style.display = "block"

    btn.appendChild(img)

    btn.addEventListener("mouseenter", () => {
      state.selectedIndex = idx
      refreshSelectionStyles()
    })

    btn.addEventListener("click", () => {
      if (onPickItem) onPickItem(it)
      hidePicker()
    })

    grid.appendChild(btn)
  })

  body.appendChild(grid)
  refreshSelectionStyles()
}

function renderKeySetupPanel(message, afterSave) {
  clearBody()
  const body = state.bodyEl
  if (!body) return

  const dark = isDarkMode()

  const card = document.createElement("div")
  card.style.borderRadius = "12px"
  card.style.padding = "12px"
  card.style.border = dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.12)"
  card.style.backgroundColor = dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)"

  const title = document.createElement("div")
  title.textContent = "Giphy API key required"
  title.style.fontWeight = "700"
  title.style.marginBottom = "6px"

  const msg = document.createElement("div")
  msg.textContent = message || "Paste your Giphy API key to enable /giphy"
  msg.style.opacity = "0.82"
  msg.style.fontSize = "12px"
  msg.style.marginBottom = "10px"

  const input = document.createElement("input")
  input.type = "password"
  input.placeholder = "Giphy API key"
    const showRow = document.createElement("label")
    showRow.style.display = "flex"
    showRow.style.alignItems = "center"
    showRow.style.gap = "8px"
    showRow.style.marginTop = "10px"
    showRow.style.fontSize = "12px"
    showRow.style.opacity = "0.82"

    const showCb = document.createElement("input")
    showCb.type = "checkbox"
    const showText = document.createElement("span")
    showText.textContent = "Show key"
    showRow.appendChild(showCb)
    showRow.appendChild(showText)

    showCb.addEventListener("change", () => {
      input.type = showCb.checked ? "text" : "password"
    })

  input.style.width = "100%"
  input.style.boxSizing = "border-box"
  input.style.padding = "10px 12px"
  input.style.borderRadius = "10px"
  input.style.border = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.18)"
  input.style.backgroundColor = dark ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.85)"
  input.style.color = dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)"

  const row = document.createElement("div")
  row.style.display = "flex"
  row.style.gap = "8px"
  row.style.marginTop = "10px"
  row.style.flexWrap = "wrap"

  const btnSave = document.createElement("button")
  btnSave.type = "button"
  btnSave.textContent = "Save"
  btnSave.style.flex = "1"
  btnSave.style.minWidth = "110px"
  btnSave.style.padding = "10px 12px"
  btnSave.style.borderRadius = "10px"
  btnSave.style.cursor = "pointer"
  btnSave.style.border = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.18)"
  btnSave.style.backgroundColor = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)"
  btnSave.style.color = dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)"

  const btnTest = document.createElement("button")
  btnTest.type = "button"
  btnTest.textContent = "Test"
  btnTest.style.flex = "1"
  btnTest.style.minWidth = "110px"
  btnTest.style.padding = "10px 12px"
  btnTest.style.borderRadius = "10px"
  btnTest.style.cursor = "pointer"
  btnTest.style.border = dark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(0,0,0,0.18)"
  btnTest.style.backgroundColor = "transparent"
  btnTest.style.color = dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)"

  const status = document.createElement("div")
  status.style.marginTop = "10px"
  status.style.fontSize = "12px"
  status.style.opacity = "0.82"

  async function doSave() {
    const v = String(input.value || "").trim()
    if (!v) {
      status.textContent = "Missing key"
      return
    }
    await setGiphyKey(v)
    status.textContent = "Saved"
    if (afterSave) afterSave()
  }

  async function doTest() {
    const v = String(input.value || "").trim()
    if (!v) {
      status.textContent = "Missing key"
      return
    }
    status.textContent = "Testing"
    const r = await giphySearchWithKey(v, "ok")
    if (r && r.error) status.textContent = r.error
    else status.textContent = "Key ok"
  }

  btnSave.addEventListener("click", doSave)
  btnTest.addEventListener("click", doTest)

  card.appendChild(title)
  card.appendChild(msg)
  card.appendChild(input)
  card.appendChild(showRow)
  row.appendChild(btnSave)
  row.appendChild(btnTest)
  card.appendChild(row)
  card.appendChild(status)

  body.appendChild(card)

  setTimeout(() => input.focus(), 0)
}

async function updateSuggestionsForActiveCommand(query) {
  const cmd = getCommand(state.activeCommand)
  if (!cmd) return
  if (!cmd.getSuggestions) return

  const q = (query || "").trim()
  if (!q) return
  if (q === state.lastSuggestQuery) return
  state.lastSuggestQuery = q

  if (state.suggestDebounceId) clearTimeout(state.suggestDebounceId)
  state.suggestDebounceId = setTimeout(async () => {
    const res = await cmd.getSuggestions(q)
    if (res && res.items && res.items.length) state.suggestItems = res.items
    else state.suggestItems = []
    if (isPickerVisible() && state.currentItems && state.currentItems.length) {
      cmd.renderCurrent()
    }
  }, 180)
}

async function handleCommandInput(field, cmdName, query) {
  const cmd = getCommand(cmdName)
  if (!cmd) return

  state.activeCommand = cmdName
  setHeader("GitHub Slash Palette", "/" + cmdName + (query ? " " + query : ""))

  showPicker()
  positionPickerAtCaret(field)

  const pre = await cmd.preflight()
  if (pre && pre.showSetup) {
    renderKeySetupPanel(pre.message, () => {
      state.cache.giphyTrendingTerms = null
      state.cache.giphyTrendingGifs = null
      state.lastQuery = ""
      handleCommandInput(field, cmdName, query || "")
    })
    return
  }

  if (!query) {
    renderLoadingSkeleton()
    const res = await cmd.getEmptyState()
    if (res && res.error) return renderMessage(res.error)
    state.suggestItems = res && res.suggest ? res.suggest : []
    state.selectedIndex = 0
    cmd.renderItems(res && res.items ? res.items : [], res && res.suggestTitle ? res.suggestTitle : "")
    return
  }

  updateSuggestionsForActiveCommand(query)

  if (query === state.lastQuery) return
  state.lastQuery = query

  if (state.debounceId) clearTimeout(state.debounceId)
  state.debounceId = setTimeout(async () => {
    showPicker()
    positionPickerAtCaret(field)
    renderLoadingSkeleton()

    if (state.inFlight) return
    state.inFlight = true
    try {
      const res = await cmd.getResults(query)
      if (res && res.error) renderMessage(res.error)
      else {
        const items = res && res.items ? res.items : []
        if (!items.length) renderMessage("No results. Check your Giphy key and DevTools Network tab for Giphy responses")
        else {
          state.selectedIndex = 0
          cmd.renderItems(items, res && res.suggestTitle ? res.suggestTitle : "")
        }
      }
    } finally {
      state.inFlight = false
    }
  }, 260)
}

function onFieldKeyDown(ev, field) {
  if (!isPickerVisible()) return

  const info = getCursorInfo(field)
  const parsed = parseSlashCommand(info.line)
  if (!parsed) return
  const cmd = getCommand(parsed.cmd)
  if (!cmd) return

  if (ev.key === "Escape") {
    ev.preventDefault()
    hidePicker()
    return
  }

  if (ev.key === "Tab") {
    if (state.currentItems && state.currentItems.length) {
      ev.preventDefault()
      const it = state.currentItems[state.selectedIndex] || state.currentItems[0]
      cmd.onSelect(it)
      hidePicker()
    }
    return
  }

  if (ev.key === "Enter") {
    if (state.currentItems && state.currentItems.length) {
      ev.preventDefault()
      const it = state.currentItems[state.selectedIndex] || state.currentItems[0]
      cmd.onSelect(it)
      hidePicker()
    }
    return
  }

  if (!state.currentItems.length) return

  if (ev.key === "ArrowRight") { ev.preventDefault(); moveSelectionGrid(1, 0); return }
  if (ev.key === "ArrowLeft") { ev.preventDefault(); moveSelectionGrid(~0, 0); return }
  if (ev.key === "ArrowDown") { ev.preventDefault(); moveSelectionGrid(0, 1); return }
  if (ev.key === "ArrowUp") { ev.preventDefault(); moveSelectionGrid(0, ~0); return }
}

function moveSelectionGrid(dx, dy) {
  const cols = state.cols
  const maxIdx = Math.max(0, sub(state.currentItems.length, 1))
  const row = Math.floor(state.selectedIndex / cols)
  const col = state.selectedIndex % cols
  const newRow = add(row, dy)
  const newCol = add(col, dx)
  let next = add(newRow * cols, newCol)
  next = clamp(next, 0, maxIdx)
  state.selectedIndex = next
  refreshSelectionStyles()
  scrollSelectedIntoView()
}

function attachToField(field) {
  if (!isGitHubMarkdownField(field)) return
  if (field.__slashPaletteBound) return
  field.__slashPaletteBound = true

  field.addEventListener("input", () => handleFieldInput(field))
  field.addEventListener("keyup", () => handleFieldInput(field))
  field.addEventListener("click", () => {
    if (isPickerVisible()) positionPickerAtCaret(field)
  })
  field.addEventListener("scroll", () => {
    if (isPickerVisible()) positionPickerAtCaret(field)
  })
  field.addEventListener("keydown", ev => onFieldKeyDown(ev, field))

  field.addEventListener("blur", () => {
    setTimeout(() => {
      if (state.mouseDownInPicker) return
      if (isPickerVisible()) return
      if (document.activeElement !== field) hidePicker()
    }, 120)
  })
}

async function handleFieldInput(field) {
  const info = getCursorInfo(field)
  const parsed = parseSlashCommand(info.line)

  if (!parsed) {
    if (state.activeField === field) hidePicker()
    return
  }

  const cmd = getCommand(parsed.cmd)
  if (!cmd) {
    if (state.activeField === field) hidePicker()
    return
  }

  state.activeField = field
  state.activeLineStart = info.lineStart
  state.activeCursorPos = info.pos

  await handleCommandInput(field, parsed.cmd, parsed.query || "")
}

function scanAndAttach(root) {
  const textareas = root.querySelectorAll("textarea")
  textareas.forEach(attachToField)
}

registerCommand("giphy", {
  preflight: async () => {
    const key = await getGiphyKey()
    if (!key) return { showSetup: true, message: "Paste your Giphy API key to enable /giphy" }
    return { showSetup: false }
  },
  getEmptyState: async () => {
    const key = await getGiphyKey()
    if (!key) return { error: "Missing key" }

    if (!state.cache.giphyTrendingTerms) {
      const t = await giphyTrendingTermsWithKey(key)
      if (t && t.error) return { error: t.error }
      state.cache.giphyTrendingTerms = t && t.terms ? t.terms : []
    }
    if (!state.cache.giphyTrendingGifs) {
      const g = await giphyTrendingGifsWithKey(key)
      if (g && g.error) return { error: g.error }
      state.cache.giphyTrendingGifs = g && g.items ? g.items : []
    }
    return {
      items: state.cache.giphyTrendingGifs || [],
      suggest: (state.cache.giphyTrendingTerms || []).slice(0, 8),
      suggestTitle: "Trending searches"
    }
  },
  getResults: async query => {
    const key = await getGiphyKey()
    if (!key) return { error: "Missing key" }
    const r = await giphySearchWithKey(key, query)
    if (r && r.error) return { error: r.error }
    return { items: r && r.items ? r.items : [], suggestTitle: "Suggestions" }
  },
  getSuggestions: async query => {
    const key = await getGiphyKey()
    if (!key) return { items: [] }
    const r = await giphyAutocompleteTermsWithKey(key, query)
    if (r && r.error) return { items: [] }
    return { items: r && r.terms ? r.terms : [] }
  },
  renderItems: (items, suggestTitle) => {
    renderGrid(items, it => it.previewUrl, it => insertGifMarkdown(it.insertUrl), suggestTitle)
  },
  renderCurrent: () => {
    renderGrid(state.currentItems || [], it => it.previewUrl, it => insertGifMarkdown(it.insertUrl), "Suggestions")
  },
  onSelect: it => {
    if (!it) return
    insertGifMarkdown(it.insertUrl)
  }
})

function boot() {
  scanAndAttach(document)

  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (!node || node.nodeType !== 1) return
        scanAndAttach(node)
      })
    })
  })

  mo.observe(document.documentElement, { childList: true, subtree: true })

  document.addEventListener("mousedown", ev => {
    if (!isPickerVisible()) return
    const picker = state.pickerEl
    if (!picker) return
    if (picker.contains(ev.target)) return
    const field = state.activeField
    if (field && field.contains(ev.target)) return
    hidePicker()
  }, true)

  window.addEventListener("scroll", () => {
    if (isPickerVisible() && state.activeField) positionPickerAtCaret(state.activeField)
  }, { passive: true })

  window.addEventListener("resize", () => {
    if (isPickerVisible() && state.activeField) positionPickerAtCaret(state.activeField)
  })

  try {
    const mq = window.matchMedia ? window.matchMedia(prefersDarkQuery()) : null
    const onChange = () => {
      if (!isPickerVisible()) return
      if (state.pickerEl) applyPickerTheme(state.pickerEl)
      refreshSelectionStyles()
    }

    if (mq && mq.addEventListener) mq.addEventListener("change", onChange)
    else if (mq && mq.addListener) mq.addListener(onChange)

    const html = document.documentElement
    const moTheme = new MutationObserver(() => onChange())
    moTheme.observe(html, {
      attributes: true,
      attributeFilter: [htmlAttrDataColorMode(), htmlAttrDataTheme(), "class"]
    })
  } catch (e) {}
}

boot()
