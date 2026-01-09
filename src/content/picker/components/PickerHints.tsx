/**
 * Picker Hints Component
 */

import React from "react"
import { getBadgeStyles } from "../styles.ts"

const HINTS = ["Arrows move", "Enter insert", "Esc close"]

export function PickerHints() {
  const badgeStyles = getBadgeStyles()

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "0 12px 10px 12px",
        height: "32px",
        boxSizing: "border-box",
      }}
    >
      {HINTS.map((hint) => (
        <div
          key={hint}
          style={{
            ...(badgeStyles as React.CSSProperties),
            padding: "3px 8px",
          }}
        >
          {hint}
        </div>
      ))}
    </div>
  )
}
