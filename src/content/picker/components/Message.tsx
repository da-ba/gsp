/**
 * Message Component
 */

import React from "react"
import { isDarkMode } from "../../../utils/theme.ts"
import { getCardStyles } from "../styles.ts"

export type MessageProps = {
  message: string
}

export function Message({ message }: MessageProps) {
  const dark = isDarkMode()
  const cardStyles = getCardStyles()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 12px 12px 12px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      <div
        style={{
          ...(cardStyles as React.CSSProperties),
          color: dark ? "#8d96a0" : "#656d76",
        }}
      >
        {message}
      </div>
    </div>
  )
}
