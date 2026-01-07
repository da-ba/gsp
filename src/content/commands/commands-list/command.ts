/**
 * Slash command implementation for listing all available commands
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 * Triggered by typing just "/" in a markdown textarea.
 */

import type { PickerItem } from "../../types.ts"
import { registerCommand, type CommandSpec, listCommands } from "../registry.ts"
import { renderGrid, setSlashQueryInField } from "../../picker/index.ts"
import { createSimpleTile } from "../../../utils/tile-builder.ts"

function makeCommandTile(name: string): PickerItem {
  return {
    id: name,
    previewUrl: createSimpleTile({
      id: name,
      title: "/" + name,
      subtitle: "Select to insert",
    }),
    data: name,
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
