/**
 * Picker Grid Component
 */

import React from "react"
import { Box, Text, ScrollArea, Grid } from "@radix-ui/themes"
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

export function PickerGrid({
  items,
  selectedIndex,
  imgUrlFn,
  onSelect,
  onHover,
  suggestItems = [],
  suggestTitle = "",
  onSuggestPick,
}: PickerGridProps) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <Box className="px-2.5 pb-2.5">
        {suggestItems.length > 0 && onSuggestPick && (
          <SuggestChips items={suggestItems} title={suggestTitle} onPick={onSuggestPick} />
        )}

        {/* Show suggestTitle as section header when there are no suggest chips */}
        {suggestItems.length === 0 && suggestTitle && (
          <Text size="1" className="opacity-70 mb-1 block">
            {suggestTitle}
          </Text>
        )}

        <Grid columns="3" gap="2">
          {items.map((item, idx) => (
            <GridItem
              key={item.id}
              item={item}
              index={idx}
              selected={idx === selectedIndex}
              imgUrlFn={imgUrlFn}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
        </Grid>
      </Box>
    </ScrollArea>
  )
}
