/**
 * Picker Grid Component - SolidJS version
 */

import { Show, For } from "solid-js"
import { GridItem } from "./GridItem.tsx"
import { SuggestChips } from "./SuggestChips.tsx"
import type { PickerItem } from "../../types.ts"

export type PickerGridProps = {
  items: PickerItem[]
  selectedIndex: number
  imgUrlFn: (item: PickerItem) => string
  onSelect: (item: PickerItem) => void
  onHover: (index: number) => void
  suggestItems?: string[]
  suggestTitle?: string
  onSuggestPick?: (term: string) => void
}

export function PickerGrid(props: PickerGridProps) {
  return (
    <div
      style={{
        overflow: "auto",
        padding: "0 10px 10px 10px",
        flex: "1 1 auto",
        "min-height": "0",
      }}
    >
      <Show when={(props.suggestItems?.length ?? 0) > 0 && props.onSuggestPick}>
        <SuggestChips
          items={props.suggestItems ?? []}
          title={props.suggestTitle ?? ""}
          onPick={props.onSuggestPick!}
        />
      </Show>

      {/* Show suggestTitle as section header when there are no suggest chips */}
      <Show when={(props.suggestItems?.length ?? 0) === 0 && props.suggestTitle}>
        <div
          style={{
            width: "100%",
            opacity: "0.72",
            "font-size": "12px",
            "margin-bottom": "4px",
          }}
        >
          {props.suggestTitle}
        </div>
      </Show>

      <div
        style={{
          display: "grid",
          "grid-template-columns": "repeat(3, 1fr)",
          gap: "8px",
          "max-height": "100%",
          "overflow-y": "auto",
        }}
      >
        <For each={props.items}>
          {(item, idx) => (
            <GridItem
              item={item}
              index={idx()}
              selected={idx() === props.selectedIndex}
              imgUrlFn={props.imgUrlFn}
              onSelect={props.onSelect}
              onHover={props.onHover}
            />
          )}
        </For>
      </div>
    </div>
  )
}
