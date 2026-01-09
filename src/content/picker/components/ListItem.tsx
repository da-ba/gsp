/**
 * List Item Component - displays items in a vertical list format
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import type { PickerItem } from "../../types.ts"

export type ListItemProps = {
  item: PickerItem
  index: number
  selected: boolean
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
}

export function ListItem({ item, index, selected, onSelect, onHover }: ListItemProps) {
  const dark = isDarkMode()

  const handleClick = (ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    onSelect(item)
  }

  return (
    <button
      type="button"
      data-item-index={index}
      onClick={handleClick}
      onMouseEnter={() => onHover(index)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "8px 12px",
        margin: 0,
        backgroundColor: selected
          ? dark
            ? "rgba(110,118,129,0.15)"
            : "rgba(31,35,40,0.06)"
          : "transparent",
        cursor: "pointer",
        borderRadius: "6px",
        overflow: "hidden",
        border: "none",
        transition: "background-color 80ms ease",
        textAlign: "left",
      }}
    >
      {item.icon && (
        <span
          style={{
            fontSize: "18px",
            width: "24px",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {item.icon}
        </span>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minWidth: 0,
          flex: 1,
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: dark ? "#e6edf3" : "#1f2328",
          }}
        >
          {item.title || item.id}
        </span>
        {item.subtitle && (
          <span
            style={{
              fontSize: "12px",
              color: dark ? "#8d96a0" : "#656d76",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.subtitle}
          </span>
        )}
      </div>
    </button>
  )
}
