/**
 * Slash command implementation for listing all available commands
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 * Triggered by typing just "/" in a markdown textarea.
 */

import { escapeForSvg } from "../../../utils/svg.ts"
import type { PickerItem } from "../../types.ts"
import { registerCommand, type CommandSpec, listCommands } from "../registry.ts"
import { renderGrid, setSlashQueryInField } from "../../picker/index.ts"

function makeCommandTile(name: string): PickerItem {
  const label = "/" + name
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="176" viewBox="0 0 240 176">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#eef2ff" stop-opacity="0.96"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="240" height="176" rx="18" fill="url(#bg)"/>
  <rect x="12" y="12" width="216" height="152" rx="14" fill="#ffffff" fill-opacity="0.65" stroke="#0f172a" stroke-opacity="0.10"/>
  <text x="24" y="86" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="26" font-weight="700" fill="#0f172a" fill-opacity="0.86">${escapeForSvg(
    label
  )}</text>
  <text x="24" y="118" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="500" fill="#0f172a" fill-opacity="0.55">Select to insert</text>
</svg>`

  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

  return {
    id: name,
    previewUrl: dataUrl,
    data: name, // Store command name for onSelect
  }
}

function getAllCommandNames(): string[] {
  // Filter out empty string (this command) from the list
  return listCommands().filter((c) => c && c !== "")
}

const commandsCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    const cmds = getAllCommandNames()
    const items = cmds.map(makeCommandTile)
    return {
      items,
      suggestTitle: "Commands",
    }
  },

  getResults: async (query: string) => {
    const q = (query || "").trim().toLowerCase()
    const cmds = getAllCommandNames().filter((c) => (q ? c.includes(q) : true))
    const items = cmds.map(makeCommandTile)
    return {
      items,
      suggestTitle: q ? "Matching commands" : "Commands",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderGrid(
      items,
      (it) => it.previewUrl,
      (it) => {
        // Don't retain the search term when selecting a command
        setSlashQueryInField(it.data as string, "")
      },
      suggestTitle
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    // Don't retain the search term when selecting a command
    setSlashQueryInField(it.data as string, "")
  },
}

// Register the command with empty string (triggered by just "/")
registerCommand("", commandsCommand)

export { commandsCommand }
