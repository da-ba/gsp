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
        padding: "10px 12px",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "40px",
        boxSizing: "border-box",
        borderTop: dark ? "1px solid #3d444d" : "1px solid rgba(31,35,40,0.1)",
      }}
    >
      <span
        style={{
          color: dark ? "#8d96a0" : "#656d76",
        }}
      >
        Tip: type / to list commands
      </span>
    </div>
  )
}
