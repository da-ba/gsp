/**
 * Grid Item Component
 */

import type { JSX } from "preact"
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

  const handleClick = (ev: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
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
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0)",
        transition: "transform 90ms ease, boxShadow 90ms ease",
        boxShadow: dark ? "0 6px 14px rgba(0,0,0,0.40)" : "0 6px 14px rgba(0,0,0,0.12)",
        ...(selectedStyles as JSX.CSSProperties),
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
