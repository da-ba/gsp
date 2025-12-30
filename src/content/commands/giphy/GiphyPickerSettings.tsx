/**
 * Giphy Picker Settings Component - for use in the picker's settings panel
 */

import React from "react"
import {
  Flex,
  Text,
  TextField,
  Button,
  Link,
  Separator,
  Checkbox,
  RadioCards,
  Code,
} from "@radix-ui/themes"
import {
  getGiphyKey,
  setGiphyKey,
  getGiphyImageFormat,
  setGiphyImageFormat,
  getGiphyCenterImage,
  setGiphyCenterImage,
  type GiphyImageFormat,
} from "./api.ts"
import { clearGiphyCaches } from "./constants.ts"
import { clearImageSettingsCache } from "./command.ts"

export function GiphyPickerSettings() {
  const [apiKey, setApiKey] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [imageFormat, setImageFormat] = React.useState<GiphyImageFormat>("markdown")
  const [centerImage, setCenterImage] = React.useState(false)

  // Load current settings on mount
  React.useEffect(() => {
    getGiphyKey().then((key) => {
      if (key) {
        setApiKey(key.slice(0, 4) + "…" + key.slice(-4))
      }
    })
    getGiphyImageFormat().then(setImageFormat)
    getGiphyCenterImage().then(setCenterImage)
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

  const handleFormatChange = async (format: GiphyImageFormat) => {
    setImageFormat(format)
    await setGiphyImageFormat(format)
    clearImageSettingsCache()
  }

  const handleCenterChange = async (center: boolean) => {
    setCenterImage(center)
    await setGiphyCenterImage(center)
    clearImageSettingsCache()
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

      <Separator size="4" />

      <Text size="2" weight="bold">
        Image Format
      </Text>
      <RadioCards.Root
        value={imageFormat}
        onValueChange={(value) => handleFormatChange(value as GiphyImageFormat)}
        columns="1"
        size="1"
      >
        <RadioCards.Item value="markdown" data-settings-action="true">
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Markdown
            </Text>
            <Text size="1" color="gray">
              <Code size="1">![](link)</Code> (default)
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="img" data-settings-action="true">
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              HTML Image
            </Text>
            <Text size="1" color="gray">
              <Code size="1">{'<img src="link" />'}</Code>
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="img-fixed" data-settings-action="true">
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Fixed Width
            </Text>
            <Text size="1" color="gray">
              <Code size="1">{'<img src="link" width="350" />'}</Code>
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>

      <Separator size="4" />

      <Text size="2" weight="bold">
        Alignment
      </Text>
      <Flex align="center" gap="2">
        <Checkbox
          id="giphy-picker-center"
          size="1"
          checked={centerImage}
          onCheckedChange={(checked) => handleCenterChange(!!checked)}
          data-settings-action="true"
        />
        <Text as="label" size="1" htmlFor="giphy-picker-center">
          Center image (<Code size="1">{'<p align="center">...</p>'}</Code>)
        </Text>
      </Flex>
    </Flex>
  )
}
