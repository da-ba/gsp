async function getKey() {
  const res = await chrome.storage.local.get({ giphyApiKey: "" })
  return (res.giphyApiKey || "").trim()
}

async function setKey(v) {
  await chrome.storage.local.set({ giphyApiKey: String(v || "").trim() })
}

async function loadKey() {
  const el = document.getElementById("key")
  el.value = await getKey()
}

function wireShowHide() {
  const input = document.getElementById("key")
  const cb = document.getElementById("showKey")
  if (!input || !cb) return

  cb.addEventListener("change", () => {
    input.type = cb.checked ? "text" : "password"
  })
}

function setStatus(t) {
  const s = document.getElementById("status")
  s.textContent = t || ""
}

async function saveKey() {
  const el = document.getElementById("key")
  const key = (el.value || "").trim()
  await setKey(key)
  setStatus(key ? "Saved" : "Saved empty key")
  setTimeout(() => setStatus(""), 1600)
}

async function testKey() {
  const el = document.getElementById("key")
  const key = (el.value || "").trim()
  if (!key) return setStatus("Missing key")

  setStatus("Testing")
  try {
    const url = new URL("https://api.giphy.com/v1/gifs/search")
    url.searchParams.set("api_key", key)
    url.searchParams.set("q", "ok")
    url.searchParams.set("limit", "1")
    url.searchParams.set("rating", "pg")
    const res = await fetch(url.toString())
    if (!res.ok) return setStatus("Test failed: " + String(res.status))
    setStatus("Key ok")
  } catch (e) {
    setStatus("Test error")
  }
}

document.getElementById("save").addEventListener("click", saveKey)
document.getElementById("test").addEventListener("click", testKey)
loadKey()
wireShowHide()
