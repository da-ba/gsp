/**
 * Command Input Component
 *
 * Shows an input field in the picker for entering command parameters.
 * This allows users to type parameters without modifying the textarea directly.
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import { getInputStyles } from "../styles.ts"

export type CommandInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  commandName?: string
}

export function CommandInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type to search...",
  commandName,
}: CommandInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dark = isDarkMode()
  const inputStyles = getInputStyles()

  // Auto-focus the input when mounted
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter") {
      ev.preventDefault()
      onSubmit()
    }
    // Let arrow keys bubble up for navigation
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(ev.key)) {
      // Don't prevent default for arrow keys in input - allow cursor movement
      // But we'll let parent handle navigation in certain cases
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.stopPropagation()
      }
    }
  }

  return (
    <div
      style={{
        padding: "0 10px 10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {commandName && (
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            opacity: 0.72,
            color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
          }}
        >
          /{commandName}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          ...(inputStyles as React.CSSProperties),
          fontSize: "14px",
          outline: "none",
        }}
        data-picker-input="true"
      />
    </div>
  )
}
