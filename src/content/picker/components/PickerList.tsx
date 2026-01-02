/**
 * Picker List Component
 *
 * A navigable list view (like GitHub native commands) for commands
 * that don't need a visual grid preview.
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import type { PickerItem } from "../../types.ts"
import { CommandInput } from "./CommandInput.tsx"

export type ListItemData = {
  label: string
  description?: string
  icon?: string
}

export type PickerListProps = {
  items: PickerItem[]
  selectedIndex: number
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  /** Extract display data from picker item */
  getItemData: (item: PickerItem) => ListItemData
  /** Title to display above the list */
  title?: string
  /** Show input field for filtering */
  showInput?: boolean
  /** Input field value */
  inputValue?: string
  /** Input field change handler */
  onInputChange?: (value: string) => void
  /** Input field submit handler */
  onInputSubmit?: () => void
  /** Placeholder for input field */
  inputPlaceholder?: string
  /** Command name to show in input field */
  commandName?: string
}

export function PickerList({
  items,
  selectedIndex,
  onSelect,
  onHover,
  getItemData,
  title,
  showInput,
  inputValue = "",
  onInputChange,
  onInputSubmit,
  inputPlaceholder,
  commandName,
}: PickerListProps) {
  const dark = isDarkMode()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {showInput && onInputChange && onInputSubmit && (
        <CommandInput
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onInputSubmit}
          placeholder={inputPlaceholder}
          commandName={commandName}
        />
      )}

      {title && (
        <div
          style={{
            padding: "4px 10px 8px 10px",
            fontSize: "12px",
            fontWeight: 600,
            opacity: 0.72,
            color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          overflow: "auto",
          flex: "1 1 auto",
          minHeight: 0,
        }}
      >
        {items.map((item, idx) => {
          const data = getItemData(item)
          const isSelected = idx === selectedIndex

          return (
            <button
              key={item.id}
              type="button"
              data-item-index={idx}
              onClick={(ev) => {
                ev.preventDefault()
                ev.stopPropagation()
                onSelect(item)
              }}
              onMouseEnter={() => onHover(idx)}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                padding: "10px 12px",
                margin: 0,
                border: "none",
                borderRadius: 0,
                cursor: "pointer",
                textAlign: "left",
                backgroundColor: isSelected
                  ? dark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.06)"
                  : "transparent",
                color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
                transition: "background-color 60ms ease",
              }}
            >
              {data.icon && (
                <span
                  style={{
                    marginRight: "10px",
                    fontSize: "18px",
                    opacity: 0.85,
                  }}
                >
                  {data.icon}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {data.label}
                </span>
                {data.description && (
                  <span
                    style={{
                      fontSize: "12px",
                      opacity: 0.65,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {data.description}
                  </span>
                )}
              </div>
              {isSelected && (
                <span
                  style={{
                    marginLeft: "10px",
                    opacity: 0.5,
                    fontSize: "12px",
                  }}
                  aria-label="Press Enter to select"
                  title="Press Enter to select"
                >
                  ↵
                </span>
              )}
            </button>
          )
        })}

        {items.length === 0 && (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              opacity: 0.6,
              color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
            }}
          >
            No items found
          </div>
        )}
      </div>
    </div>
  )
}
