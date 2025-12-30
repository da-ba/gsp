/**
 * Giphy Picker Settings Component - for use in the picker's settings panel
 */

import React from "react"
import { Flex, Text, TextField, Button, Link, Separator } from "@radix-ui/themes"
import { getGiphyKey, setGiphyKey } from "./api.ts"
import { clearCommandCache } from "../../picker/index.ts"

// Cache keys for Giphy-specific data
const CACHE_TRENDING_TERMS = "giphy:trendingTerms"
const CACHE_TRENDING_GIFS = "giphy:trendingGifs"

/** Clear Giphy caches */
function clearGiphyCaches(): void {
  clearCommandCache(CACHE_TRENDING_TERMS)
  clearCommandCache(CACHE_TRENDING_GIFS)
}

export function GiphyPickerSettings() {
  const [apiKey, setApiKey] = React.useState("")
  const [status, setStatus] = React.useState("")

  // Load current key on mount
  React.useEffect(() => {
    getGiphyKey().then((key) => {
      if (key) {
        setApiKey(key.slice(0, 4) + "…" + key.slice(-4))
      }
    })
  }, [])

  const handleSave = async (ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const val = apiKey.trim()
    if (val.includes("…")) {
      setStatus("Enter a new key to save")
      return
    }
    if (!val) {
      setStatus("Please enter a key")
      return
    }
    setStatus("Saving…")
    await setGiphyKey(val)
    clearGiphyCaches()
    setStatus("Saved!")
    setApiKey(val.slice(0, 4) + "…" + val.slice(-4))
  }

  const handleClear = async (ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    await setGiphyKey("")
    clearGiphyCaches()
    setApiKey("")
    setStatus("Cleared")
  }

  return (
    <Flex direction="column" gap="2">
      <Separator size="4" />
      <Text size="2" weight="bold">
        Giphy API Key
      </Text>
      <Text size="1" color="gray">
        Get a free key at{" "}
        <Link
          href="https://developers.giphy.com/dashboard/"
          target="_blank"
          rel="noopener noreferrer"
        >
          developers.giphy.com
        </Link>
      </Text>
      <TextField.Root
        type="text"
        placeholder="Paste API key…"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="max-w-xs"
      />
      <Flex gap="2">
        <Button size="1" onClick={handleSave} data-settings-action="true">
          Save Key
        </Button>
        <Button size="1" variant="soft" onClick={handleClear} data-settings-action="true">
          Clear
        </Button>
      </Flex>
      {status && (
        <Text size="1" color="gray">
          {status}
        </Text>
      )}
    </Flex>
  )
}
