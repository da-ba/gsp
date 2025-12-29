/**
 * Giphy Options Section Component
 */

import React from "react"
import {
  Card,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  Link,
  Code,
  Checkbox,
  Box,
  RadioCards,
  Separator,
} from "@radix-ui/themes"
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

export function GiphyOptionsSection() {
  const [apiKey, setApiKey] = React.useState("")
  const [showKey, setShowKey] = React.useState(false)
  const [status, setStatus] = React.useState("")
  const [imageFormat, setImageFormat] = React.useState<GiphyImageFormat>("markdown")
  const [centerImage, setCenterImage] = React.useState(false)

  // Load current settings on mount
  React.useEffect(() => {
    getGiphyKey().then((key) => setApiKey(key))
    getGiphyImageFormat().then((format) => setImageFormat(format))
    getGiphyCenterImage().then((center) => setCenterImage(center))
  }, [])

  const handleSave = async () => {
    const key = apiKey.trim()
    await setGiphyKey(key)
    setStatus(key ? "Saved" : "Saved empty key")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleTest = async () => {
    const key = apiKey.trim()
    if (!key) {
      setStatus("Missing key")
      return
    }

    setStatus("Testing…")
    const result = await testGiphyKey(key)
    if (result.error) {
      setStatus("Test failed: " + result.error)
    } else {
      setStatus("Key ok ✓")
    }
  }

  const handleClear = async () => {
    await setGiphyKey("")
    setApiKey("")
    setStatus("Cleared")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleFormatChange = async (format: GiphyImageFormat) => {
    setImageFormat(format)
    await setGiphyImageFormat(format)
  }

  const handleCenterChange = async (center: boolean) => {
    setCenterImage(center)
    await setGiphyCenterImage(center)
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Box className="border-b border-gray-6 pb-3">
          <Heading size="3">/giphy</Heading>
        </Box>

        <Text size="2" color="gray">
          Giphy requires an API key. Get a free key at{" "}
          <Link
            href="https://developers.giphy.com/dashboard/"
            target="_blank"
            rel="noopener noreferrer"
          >
            developers.giphy.com
          </Link>
        </Text>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium" htmlFor="giphy-key">
            API Key
          </Text>
          <TextField.Root
            type={showKey ? "text" : "password"}
            id="giphy-key"
            placeholder="Paste your Giphy API key"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="max-w-lg"
          />
        </Flex>

        <Flex align="center" gap="2">
          <Checkbox
            id="giphy-show-key"
            checked={showKey}
            onCheckedChange={(checked) => setShowKey(checked === true)}
          />
          <Text as="label" size="2" htmlFor="giphy-show-key">
            Show key
          </Text>
        </Flex>

        <Flex gap="2">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="soft" onClick={handleTest}>
            Test
          </Button>
          <Button variant="soft" color="red" onClick={handleClear}>
            Clear
          </Button>
        </Flex>

        {status && (
          <Text size="2" weight="medium" color={status.includes("✓") ? "green" : undefined}>
            {status}
          </Text>
        )}

        <Separator size="4" />

        <Flex direction="column" gap="2">
          <Text size="2" weight="medium">
            Image Format
          </Text>
          <RadioCards.Root
            value={imageFormat}
            onValueChange={(value) => handleFormatChange(value as GiphyImageFormat)}
            columns="1"
          >
            <RadioCards.Item value="markdown">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Markdown
                </Text>
                <Text size="1" color="gray">
                  <Code>![](link)</Code> (default)
                </Text>
              </Flex>
            </RadioCards.Item>
            <RadioCards.Item value="img">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  HTML Image
                </Text>
                <Text size="1" color="gray">
                  <Code>{'<img src="link" />'}</Code>
                </Text>
              </Flex>
            </RadioCards.Item>
            <RadioCards.Item value="img-fixed">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">
                  Fixed Width
                </Text>
                <Text size="1" color="gray">
                  <Code>{'<img src="link" width="350" />'}</Code>
                </Text>
              </Flex>
            </RadioCards.Item>
          </RadioCards.Root>
        </Flex>

        <Separator size="4" />

        <Flex direction="column" gap="2">
          <Text size="2" weight="medium">
            Alignment
          </Text>
          <Flex align="center" gap="2">
            <Checkbox
              id="giphy-center"
              checked={centerImage}
              onCheckedChange={(checked) => handleCenterChange(checked === true)}
            />
            <Text as="label" size="2" htmlFor="giphy-center">
              Center image (wrap in <Code>{'<p align="center">...</p>'}</Code>)
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  )
}
