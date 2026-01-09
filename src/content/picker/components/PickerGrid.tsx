/**
 * Picker Grid Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import { GridItem } from "./GridItem.tsx"
import { SuggestChips } from "./SuggestChips.tsx"
import type { PickerItem } from "../../types.ts"

export type PickerGridProps = {
  items: PickerItem[]
  selectedIndex: number
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  suggestItems?: string[]
  suggestTitle?: string
  onSuggestPick?: (term: string) => void
}

export function PickerGrid({
  items,
  selectedIndex,
  imgUrlFn,
  onSelect,
  onHover,
  suggestItems = [],
  suggestTitle = "",
  onSuggestPick,
}: PickerGridProps) {
  const dark = isDarkMode()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 12px 12px 12px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      {suggestItems.length > 0 && onSuggestPick && (
        <SuggestChips items={suggestItems} title={suggestTitle} onPick={onSuggestPick} />
      )}

      {/* Show suggestTitle as section header when there are no suggest chips */}
      {suggestItems.length === 0 && suggestTitle && (
        <div
          style={{
            width: "100%",
            fontSize: "12px",
            marginBottom: "4px",
            color: dark ? "#8d96a0" : "#656d76",
          }}
        >
          {suggestTitle}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        {items.map((item, idx) => (
          <GridItem
            key={item.id}
            item={item}
            index={idx}
            selected={idx === selectedIndex}
            imgUrlFn={imgUrlFn}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  )
}
