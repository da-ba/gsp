/**
 * Grid Item Component
 */

import React from "react"
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
      className={`
        p-0 m-0 cursor-pointer rounded-xl overflow-hidden border-0 bg-transparent
        transition-transform duration-75 ease-in-out
        shadow-md hover:shadow-lg
        ${selected ? "scale-[1.03] ring-2 ring-accent-9 shadow-xl" : "scale-100"}
      `}
    >
      <img src={imgUrlFn(item)} alt="item" className="w-full h-auto block" />
    </button>
  )
}
