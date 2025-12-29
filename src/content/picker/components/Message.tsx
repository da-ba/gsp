/**
 * Message Component
 */

import type { JSX } from "preact"
import { getCardStyles } from "../styles.ts"

export type MessageProps = {
  message: string
}

export function Message({ message }: MessageProps) {
  const cardStyles = getCardStyles()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        minHeight: 0,
      }}
    >
      <div style={cardStyles as JSX.CSSProperties}>{message}</div>
    </div>
  )
}
