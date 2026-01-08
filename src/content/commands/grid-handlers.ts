/**
 * Grid handlers factory for commands
 *
 * Extracted to a separate file to avoid circular dependencies between
 * registry.ts and picker/index.ts (which imports from SettingsPanel.tsx
 * which imports from registry.ts).
 */

import type { PickerItem } from "../types.ts"
import { renderGrid } from "../picker/index.ts"

/** Handler type for rendering items in a grid */
type RenderItemsHandler = (items: PickerItem[], suggestTitle: string) => void

/** Handler type for selecting an item */
type OnSelectHandler = (item: PickerItem) => void

/** Return type for createGridHandlers */
export type GridHandlers = {
  renderItems: RenderItemsHandler
  onSelect: OnSelectHandler
}

/**
 * Create standard renderItems and onSelect handlers for a grid-based command.
 * Most commands follow the same pattern: display items in a grid and insert content on select.
 *
 * @param onInsert - Function to call when an item is selected, receives item.data
 * @returns Object with renderItems and onSelect methods to spread into CommandSpec
 */
export function createGridHandlers<T>(onInsert: (data: T) => void): GridHandlers {
  return {
    renderItems: (items: PickerItem[], suggestTitle: string) => {
      renderGrid(
        items,
        (it) => it.previewUrl,
        (it) => onInsert(it.data as T),
        suggestTitle
      )
    },
    onSelect: (it: PickerItem) => {
      if (!it) return
      onInsert(it.data as T)
    },
  }
}
