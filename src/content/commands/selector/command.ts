/**
 * Internal command selector implementation
 *
 * Provides an overview of all registered commands and lets the user
 * pick one to insert at the current cursor position.
 * This is an internal command triggered by typing "/" - not user-facing.
 */

import type { PickerItem } from "../../types.ts"
import { registerCommand, type CommandSpec, listCommands } from "../registry.ts"
import { renderList, setSlashQueryInField, state } from "../../picker/index.ts"
import type { ListItemData } from "../../picker/components/PickerList.tsx"

/** Internal command name for the command selector */
export const COMMAND_SELECTOR_NAME = "_selector"

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
  // Filter out internal commands (prefixed with _)
  return listCommands().filter((c) => c && !c.startsWith("_"))
}

const commandSelectorCommand: CommandSpec = {
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
      getCommandItemData,
      (it) => {
        // Don't pass the filter query - just insert the selected command
        setSlashQueryInField(it.data as string, "")
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
        // Don't pass the filter query - just insert the selected command
        setSlashQueryInField(it.data as string, "")
      },
      {
        title: "Commands",
      }
    )
  },

  onSelect: (it: PickerItem) => {
    if (!it) return
    // Don't pass the filter query - just insert the selected command
    setSlashQueryInField(it.data as string, "")
  },
}

// Register the internal command
registerCommand(COMMAND_SELECTOR_NAME, commandSelectorCommand)

export { commandSelectorCommand }
