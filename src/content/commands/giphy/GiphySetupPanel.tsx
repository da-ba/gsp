/**
 * Giphy Setup Panel Component - for initial API key setup
 */

import React from "react"
import { Card, Flex, Text, TextField, Button, Link } from "@radix-ui/themes"
import { setGiphyKey } from "./api.ts"
import { clearGiphyCaches } from "./constants.ts"

export type GiphySetupPanelProps = {
  onComplete: () => void
}

export function GiphySetupPanel({ onComplete }: GiphySetupPanelProps) {
  const [apiKey, setApiKey] = React.useState("")
  const [status, setStatus] = React.useState("")

  const handleSave = async (ev: React.MouseEvent | React.FormEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const val = apiKey.trim()
    if (!val) {
      setStatus("Please enter a key")
      return
    }
    setStatus("Saving…")
    await setGiphyKey(val)
    clearGiphyCaches()
    setStatus("Saved!")
    onComplete()
  }

  return (
    <Card className="p-3">
      <Flex direction="column" gap="2">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave(e)
            }
          }}
        />
        <Flex gap="2">
          <Button size="1" onClick={handleSave} data-settings-action="true">
            Save Key
          </Button>
        </Flex>
        {status && (
          <Text size="1" color="gray">
            {status}
          </Text>
        )}
      </Flex>
    </Card>
  )
}
