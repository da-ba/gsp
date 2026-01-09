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

  // GitHub uses solid blue for selection (#2f81f7)
  const getBackgroundColor = () => {
    if (selected) return "#2f81f7"
    return "transparent"
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
        gap: "12px",
        width: "100%",
        padding: "10px 12px",
        margin: 0,
        backgroundColor: getBackgroundColor(),
        cursor: "pointer",
        borderRadius: "0",
        overflow: "hidden",
        border: "none",
        transition: "background-color 80ms ease",
        textAlign: "left",
      }}
    >
      {item.icon && (
        <span
          style={{
            fontSize: "16px",
            width: "20px",
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
            fontWeight: 600,
            color: selected ? "#ffffff" : dark ? "#e6edf3" : "#1f2328",
          }}
        >
          {item.title || item.id}
        </span>
        {item.subtitle && (
          <span
            style={{
              fontSize: "14px",
              color: selected ? "rgba(255,255,255,0.9)" : dark ? "#8d96a0" : "#656d76",
              whiteSpace: "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.4",
            }}
          >
            {item.subtitle}
          </span>
        )}
      </div>
    </button>
  )
}
