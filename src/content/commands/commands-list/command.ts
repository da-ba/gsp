/**
 * Slash command implementation for listing all available commands
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 * Triggered by typing just "//" in a markdown textarea.
 */

import type { PickerItem } from "../../types.ts"
import { registerCommand, type CommandSpec, listCommands } from "../registry.ts"
import { renderList, setSlashQueryInField } from "../../picker/index.ts"

type CommandMeta = {
  icon: string
  description: string
}

const commandMeta: Record<string, CommandMeta> = {
  giphy: {
    icon: "🎬",
    description: "Search and insert animated GIFs",
  },
  emoji: {
    icon: "😀",
    description: "Search and insert emoji",
  },
  font: {
    icon: "𝔄",
    description: "Transform text into fancy unicode fonts",
  },
  mermaid: {
    icon: "📊",
    description: "Create diagrams and flowcharts",
  },
  mention: {
    icon: "@",
    description: "Mention a GitHub user",
  },
  now: {
    icon: "🕐",
    description: "Insert current date and time",
  },
  kbd: {
    icon: "⌨️",
    description: "Insert keyboard shortcut notation",
  },
  link: {
    icon: "🔗",
    description: "Insert formatted links",
  },
}

function makeCommandItem(name: string): PickerItem {
  const meta = commandMeta[name] || { icon: "📝", description: "Insert content" }
  return {
    id: name,
    previewUrl: "",
    title: "//" + name,
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

// Register the command with empty string (triggered by just "//")
registerCommand("", commandsCommand)

export { commandsCommand }
