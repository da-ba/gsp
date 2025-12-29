/**
 * Grid Item Component - SolidJS version
 */

import type { JSX } from "solid-js"
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

export function GridItem(props: GridItemProps) {
  const dark = isDarkMode()
  const selectedStyles = getGridItemSelectedStyles(props.selected)

  const handleClick = (ev: MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    props.onSelect(props.item)
  }

  return (
    <button
      type="button"
      data-item-index={props.index}
      onClick={handleClick}
      onMouseEnter={() => props.onHover(props.index)}
      style={{
        padding: "0",
        margin: "0",
        "background-color": "transparent",
        cursor: "pointer",
        "border-radius": "12px",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0)",
        transition: "transform 90ms ease, boxShadow 90ms ease",
        "box-shadow": dark ? "0 6px 14px rgba(0,0,0,0.40)" : "0 6px 14px rgba(0,0,0,0.12)",
        ...(selectedStyles as JSX.CSSProperties),
      }}
    >
      <img
        src={props.imgUrlFn(props.item)}
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
