/**
 * /gsp slash command implementation
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 */

import type { PickerItem } from "../../types.ts"
import { registerCommand, type CommandSpec, listCommands } from "../registry.ts"
import { renderList, setSlashQueryInField, state } from "../../picker/index.ts"
import type { ListItemData } from "../../picker/components/PickerList.tsx"

let lastForwardedQuery = ""

/** Command descriptions for the list view */
const COMMAND_DESCRIPTIONS: Record<string, string> = {
  giphy: "Search and insert GIFs",
  emoji: "Insert emojis with search",
  font: "Text formatting styles",
  kbd: "Keyboard shortcuts with <kbd>",
  now: "Insert date/time formats",
  link: "Insert markdown links",
  mention: "Mention users (@username)",
  mermaid: "Insert diagram templates",
}

/** Command icons for the list view */
const COMMAND_ICONS: Record<string, string> = {
  giphy: "🎬",
  emoji: "😀",
  font: "🔤",
  kbd: "⌨️",
  now: "📅",
  link: "🔗",
  mention: "@",
  mermaid: "📊",
}

function makeCommandItem(name: string): PickerItem {
  return {
    id: name,
    previewUrl: "", // Not used in list view
    data: name, // Store command name for onSelect
  }
}

function getCommandItemData(item: PickerItem): ListItemData {
  const name = item.data as string
  return {
    label: "/" + name,
    description: COMMAND_DESCRIPTIONS[name] || "Command",
    icon: COMMAND_ICONS[name] || "⚡",
  }
}

function getAllCommandNames(): string[] {
  return listCommands().filter((c) => c && c !== "gsp")
}

const gspCommand: CommandSpec = {
  preflight: async () => ({ showSetup: false }),

  getEmptyState: async () => {
    lastForwardedQuery = ""
    const cmds = getAllCommandNames()
    const items = cmds.map(makeCommandItem)
    return {
      items,
      suggestTitle: "Commands",
    }
  },

  getResults: async (query: string) => {
    lastForwardedQuery = query || ""
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
      getCommandItemData,
      (it) => {
        const term = (lastForwardedQuery || "").trim()
        setSlashQueryInField(it.data as string, term)
      },
      {
        title: suggestTitle,
      }
    )
  },

  renderCurrent: () => {
    renderList(
      state.currentItems || [],
      getCommandItemData,
      (it) => {
        const term = (lastForwardedQuery || "").trim()
        setSlashQueryInField(it.data as string, term)
      },
      {
        title: "Commands",
      }
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    const term = (lastForwardedQuery || "").trim()
    setSlashQueryInField(it.data as string, term)
  },
}

// Register the command
registerCommand("gsp", gspCommand)

export { gspCommand }
