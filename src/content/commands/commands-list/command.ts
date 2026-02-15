/**
 * Slash command implementation for listing all available commands
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 * Triggered by typing just the command prefix (default: "//") in a markdown textarea.
 */

import type { PickerItem } from "../../types.ts"
import {
  registerCommand,
  type CommandSpec,
  listCommands,
  getCommandMetadata,
  type CommandMetadata,
} from "../registry.ts"
import { renderList, setSlashQueryInField } from "../../picker/index.ts"
import { COMMAND_PREFIX } from "../../../utils/command-prefix.ts"

const FALLBACK_COMMAND_META: CommandMetadata = {
  icon: "📝",
  description: "Insert content",
}

function makeCommandItem(name: string): PickerItem {
  const meta = getCommandMetadata(name) || FALLBACK_COMMAND_META
  return {
    id: name,
    previewUrl: "",
    title: COMMAND_PREFIX + name,
    subtitle: meta.description,
    icon: meta.icon,
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
    const items = cmds.map(makeCommandItem)
    return {
      items,
      suggestTitle: "Commands",
    }
  },

  getResults: async (query: string) => {
    const q = (query || "").trim().toLowerCase()
    const cmds = getAllCommandNames().filter((c) => (q ? c.includes(q) : true))
    const items = cmds.map(makeCommandItem)
    return {
      items,
      suggestTitle: q ? "Matching commands" : "Commands",
    }
  },

  renderItems: (items: PickerItem[], suggestTitle: string) => {
    renderList(
      items,
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

// Register the command with empty string (triggered by just the prefix)
registerCommand("", commandsCommand)

export { commandsCommand }
