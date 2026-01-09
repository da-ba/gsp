/**
 * Grid Item Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import { getGridItemSelectedStyles } from "../styles.ts"
import type { PickerItem } from "../../types.ts"

export type GridItemProps = {
  item: PickerItem
  index: number
  selected: boolean
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
}

export function GridItem({ item, index, selected, imgUrlFn, onSelect, onHover }: GridItemProps) {
  const dark = isDarkMode()
  const selectedStyles = getGridItemSelectedStyles(selected)

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
        padding: 0,
        margin: 0,
        backgroundColor: "transparent",
        cursor: "pointer",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid transparent",
        transition: "transform 80ms ease, box-shadow 80ms ease",
        boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.08)",
        ...(selectedStyles as React.CSSProperties),
      }}
    >
      <img
        src={imgUrlFn(item)}
        alt="item"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </button>
  )
}
