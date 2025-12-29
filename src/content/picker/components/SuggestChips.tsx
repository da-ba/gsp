/**
 * Suggest Chips Component - SolidJS version
 */

import { createSignal, Show, For } from "solid-js"
import type { JSX } from "solid-js"
import { getBadgeStyles } from "../styles.ts"

export type SuggestChipsProps = {
  items: string[]
  title: string
  onPick: (term: string) => void
}

export function SuggestChips(props: SuggestChipsProps) {
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null)
  const badgeStyles = getBadgeStyles()

  return (
    <Show when={props.items.length > 0}>
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          gap: "6px",
          "margin-bottom": "10px",
        }}
      >
        <Show when={props.title}>
          <div
            style={{
              width: "100%",
              opacity: "0.72",
              "font-size": "12px",
              "margin-bottom": "4px",
            }}
          >
            {props.title}
          </div>
        </Show>
        <For each={props.items.slice(0, 8)}>
          {(term, idx) => (
            <button
              type="button"
              data-suggest-chip="true"
              onClick={(ev) => {
                ev.preventDefault()
                ev.stopPropagation()
                props.onPick(term)
              }}
              onMouseEnter={() => setHoveredIndex(idx())}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                ...(badgeStyles as JSX.CSSProperties),
                cursor: "pointer",
                padding: "6px 10px",
                transform: hoveredIndex() === idx() ? "scale(1.03)" : "scale(1)",
              }}
            >
              {term}
            </button>
          )}
        </For>
      </div>
    </Show>
  )
}
