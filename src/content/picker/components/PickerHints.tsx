/**
 * Picker Hints Component
 */

import type { JSX } from "preact"
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
        padding: "0 10px 10px 10px",
        height: "32px",
        boxSizing: "border-box",
      }}
    >
      {HINTS.map((hint) => (
        <div
          key={hint}
          style={{
            ...(badgeStyles as JSX.CSSProperties),
            padding: "3px 10px",
            fontWeight: 600,
          }}
        >
          {hint}
        </div>
      ))}
    </div>
  )
}
