/**
 * Picker List Component - displays items in a vertical list format
 */

import React from "react"
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
  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      {title && (
        <div
          style={{
            width: "100%",
            opacity: 0.72,
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          maxHeight: "100%",
          overflowY: "auto",
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
