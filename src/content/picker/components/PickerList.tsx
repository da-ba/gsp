/**
 * Picker List Component - displays items in a vertical list format
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import { ListItem } from "./ListItem.tsx"
import type { PickerItem } from "../../types.ts"

export type PickerListProps = {
  items: PickerItem[]
  selectedIndex: number
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  title?: string
}

export function PickerList({ items, selectedIndex, onSelect, onHover, title }: PickerListProps) {
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
      {title && (
        <div
          style={{
            width: "100%",
            fontSize: "12px",
            marginBottom: "4px",
            color: dark ? "#8d96a0" : "#656d76",
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {items.map((item, idx) => (
          <ListItem
            key={item.id}
            item={item}
            index={idx}
            selected={idx === selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  )
}
