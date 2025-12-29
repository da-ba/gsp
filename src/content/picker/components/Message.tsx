/**
 * Message Component - SolidJS version
 */

import type { JSX } from "solid-js"
import { getCardStyles } from "../styles.ts"

export type MessageProps = {
  message: string
}

export function Message(props: MessageProps) {
  const cardStyles = getCardStyles()

  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        "min-height": "0",
      }}
    >
      <div style={cardStyles as JSX.CSSProperties}>{props.message}</div>
    </div>
  )
}
