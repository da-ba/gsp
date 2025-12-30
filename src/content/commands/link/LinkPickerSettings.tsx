/**
 * Link Command Picker Settings Component - for use in the picker's settings panel
 */

import React from "react"
import { Flex, Text, TextField, Button, Link, Code, Separator } from "@radix-ui/themes"
import { getGitHubToken, setGitHubToken } from "../../../options/github/api.ts"

export function LinkPickerSettings() {
  const [token, setToken] = React.useState("")
  const [status, setStatus] = React.useState("")

  // Load current token on mount
  React.useEffect(() => {
    getGitHubToken().then((t) => {
      if (t) {
        setToken(t.slice(0, 4) + "…" + t.slice(-4))
      }
    })
  }, [])

  const handleSave = async (ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const val = token.trim()
    if (val.includes("…")) {
      setStatus("Enter a new token to save")
      return
    }
    if (!val) {
      setStatus("Please enter a token")
      return
    }
    setStatus("Saving…")
    await setGitHubToken(val)
    setStatus("Saved!")
    setToken(val.slice(0, 4) + "…" + val.slice(-4))
  }

  const handleClear = async (ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    await setGitHubToken("")
    setToken("")
    setStatus("Cleared")
  }

  return (
    <Flex direction="column" gap="2">
      <Separator size="4" />
      <Text size="2" weight="bold">
        GitHub Token (for /link ci)
      </Text>
      <Text size="1" color="gray">
        Create a{" "}
        <Link
          href="https://github.com/settings/tokens/new?description=GitHub%20Slash%20Palette&scopes=public_repo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Personal Access Token
        </Link>{" "}
        with <Code size="1">public_repo</Code> or <Code size="1">repo</Code> scope.
      </Text>
      <TextField.Root
        type="text"
        placeholder="Paste GitHub token…"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="max-w-xs"
      />
      <Flex gap="2">
        <Button size="1" onClick={handleSave} data-settings-action="true">
          Save Token
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
