/**
 * Picker Footer Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"

export function PickerFooter() {
  const dark = isDarkMode()

  return (
    <div
      style={{
        padding: "10px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "44px",
        boxSizing: "border-box",
        borderTop: dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.10)",
      }}
    >
      <span
        style={{
          opacity: 0.62,
          color: dark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)",
        }}
      >
        Tip: type /gsp to list commands
      </span>
    </div>
  )
}
