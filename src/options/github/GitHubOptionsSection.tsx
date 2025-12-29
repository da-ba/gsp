/**
 * GitHub Options Section Component
 *
 * Provides UI for configuring shared GitHub API settings.
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
} from "@radix-ui/themes"
import { getGitHubToken, setGitHubToken, testGitHubToken } from "./api.ts"

export function GitHubOptionsSection() {
  const [token, setToken] = React.useState("")
  const [showToken, setShowToken] = React.useState(false)
  const [status, setStatus] = React.useState("")

  // Load current settings on mount
  React.useEffect(() => {
    getGitHubToken().then((t) => setToken(t))
  }, [])

  const handleSave = async () => {
    const t = token.trim()
    await setGitHubToken(t)
    setStatus(t ? "Saved" : "Saved empty token")
    setTimeout(() => setStatus(""), 1600)
  }

  const handleTest = async () => {
    const t = token.trim()
    if (!t) {
      setStatus("Missing token")
      return
    }

    setStatus("Testing…")
    const result = await testGitHubToken(t)
    if (result.valid) {
      setStatus("Token valid ✓")
    } else {
      setStatus("Test failed: " + (result.error || "Unknown error"))
    }
  }

  const handleClear = async () => {
    await setGitHubToken("")
    setToken("")
    setStatus("Cleared")
    setTimeout(() => setStatus(""), 1600)
  }

  return (
    <Card>
      <Flex direction="column" gap="4">
        <Box className="border-b border-gray-6 pb-3">
          <Heading size="3">GitHub API</Heading>
        </Box>

        <Text size="2" color="gray">
          A GitHub Personal Access Token enables advanced features:
        </Text>

        <Box className="pl-4">
          <Text size="2" color="gray" as="p">
            • <Code>/link ci</Code> - Link to CI jobs and artifacts
          </Text>
        </Box>

        <Text size="2" color="gray">
          Create a{" "}
          <Link
            href="https://github.com/settings/tokens/new?description=GitHub%20Slash%20Palette&scopes=public_repo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Personal Access Token
          </Link>{" "}
          with the <Code>public_repo</Code> scope (for public repos) or <Code>repo</Code> scope (for
          private repos). The token is stored locally in your browser.
        </Text>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium" htmlFor="github-token">
            Personal Access Token
          </Text>
          <TextField.Root
            type={showToken ? "text" : "password"}
            id="github-token"
            placeholder="Paste your GitHub Personal Access Token"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="max-w-lg"
          />
        </Flex>

        <Flex align="center" gap="2">
          <Checkbox
            id="github-show-token"
            checked={showToken}
            onCheckedChange={(checked) => setShowToken(checked === true)}
          />
          <Text as="label" size="2" htmlFor="github-show-token">
            Show token
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
      </Flex>
    </Card>
  )
}
