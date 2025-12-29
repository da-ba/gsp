/**
 * Picker Hints Component - SolidJS version
 */

import { For } from "solid-js"
import type { JSX } from "solid-js"
import { getBadgeStyles } from "../styles.ts"

const HINTS = ["Arrows move", "Enter insert", "Esc close"]

export function PickerHints() {
  const badgeStyles = getBadgeStyles()

  return (
    <div
      style={{
        display: "flex",
        "flex-wrap": "wrap",
        gap: "6px",
        padding: "0 10px 10px 10px",
        height: "32px",
        "box-sizing": "border-box",
      }}
    >
      <For each={HINTS}>
        {(hint) => (
          <div
            style={{
              ...(badgeStyles as JSX.CSSProperties),
              padding: "3px 10px",
              "font-weight": "600",
            }}
          >
            {hint}
          </div>
        )}
      </For>
    </div>
  )
}
